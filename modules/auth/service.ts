import type { UserRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { sendInvitationEmail, sendPasswordChangedEmail, sendPasswordResetEmail, sendUserActivatedEmail, sendUserDeactivatedEmail, sendVerificationEmail } from "@/lib/email";
import type { RequestContext } from "@/lib/request-context";
import { createRawToken, hashToken } from "@/lib/token";
import { writeAuditLog } from "@/lib/audit-log";
import { writeSecurityLog } from "@/lib/security-log";
import { hashPassword, passwordSchema, verifyPassword } from "@/modules/auth/password";
import { AuthFlowError } from "@/modules/auth/errors";

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const INVITATION_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_FAILED_LOGIN_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;
const EMAIL_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const EMAIL_RATE_LIMIT_MAX = 3;

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function expiresIn(ms: number) {
  return new Date(Date.now() + ms);
}

async function assertEmailRateLimit(kind: "verification" | "reset", userId: string) {
  const since = new Date(Date.now() - EMAIL_RATE_LIMIT_WINDOW_MS);
  const count = kind === "verification"
    ? await prisma.emailVerificationToken.count({ where: { userId, createdAt: { gte: since } } })
    : await prisma.passwordResetToken.count({ where: { userId, createdAt: { gte: since } } });
  if (count >= EMAIL_RATE_LIMIT_MAX) throw new Error("Слишком много писем за последний час. Попробуйте позже.");
}

export async function createEmailVerificationToken(user: { id: string; email: string }, context: RequestContext = {}) {
  await prisma.emailVerificationToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() }
  });

  const token = createRawToken();
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      email: normalizeEmail(user.email),
      tokenHash: hashToken(token),
      expiresAt: expiresIn(EMAIL_VERIFICATION_TTL_MS),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    }
  });
  return token;
}

export async function createPasswordResetToken(user: { id: string; email: string }, context: RequestContext = {}) {
  const token = createRawToken();
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      email: normalizeEmail(user.email),
      tokenHash: hashToken(token),
      expiresAt: expiresIn(PASSWORD_RESET_TTL_MS),
      ipAddress: context.ipAddress,
      userAgent: context.userAgent
    }
  });
  return token;
}

export async function registerUser(data: { name: string; email: string; password: string }, context: RequestContext = {}) {
  const email = normalizeEmail(data.email);
  const passwordValidation = passwordSchema.safeParse(data.password);
  if (!passwordValidation.success) return { ok: false as const, message: passwordValidation.error.issues[0]?.message ?? "Пароль не прошел проверку" };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false as const, message: "Пользователь с таким email уже зарегистрирован" };

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email,
      passwordHash,
      role: "STORE_MANAGER",
      isActive: false,
      lastPasswordChangeAt: new Date()
    }
  });

  const token = await createEmailVerificationToken(user, context);
  await sendVerificationEmail({ to: user.email, name: user.name, token, userId: user.id });
  await writeSecurityLog({ action: "EMAIL_VERIFICATION_SENT", userId: user.id, entityType: "USER", entityId: user.id, ipAddress: context.ipAddress, userAgent: context.userAgent });

  return { ok: true as const, user };
}

export async function verifyEmailToken(token: string, context: RequestContext = {}) {
  const tokenHash = hashToken(token);
  const verification = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
    include: { user: true }
  });

  if (!verification) return { status: "invalid" as const };
  if (verification.usedAt) return { status: "used" as const };
  if (verification.expiresAt < new Date()) return { status: "expired" as const };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: verification.userId },
      data: { emailVerifiedAt: new Date() }
    });
    await tx.emailVerificationToken.update({
      where: { id: verification.id },
      data: { usedAt: new Date() }
    });
  });

  await writeSecurityLog({ action: "EMAIL_VERIFIED", userId: verification.userId, entityType: "USER", entityId: verification.userId, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return { status: "success" as const, user: verification.user };
}

export async function resendVerification(emailInput: string, context: RequestContext = {}) {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { status: "sent" as const };
  if (user.emailVerifiedAt) return { status: "verified" as const };

  await assertEmailRateLimit("verification", user.id);
  const token = await createEmailVerificationToken(user, context);
  await sendVerificationEmail({ to: user.email, name: user.name, token, userId: user.id, isResend: true });
  await writeSecurityLog({ action: "EMAIL_VERIFICATION_SENT", userId: user.id, entityType: "USER", entityId: user.id, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return { status: "sent" as const };
}

export async function requestPasswordReset(emailInput: string, context: RequestContext = {}) {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { status: "sent" as const };

  await assertEmailRateLimit("reset", user.id);
  const token = await createPasswordResetToken(user, context);
  await sendPasswordResetEmail({ to: user.email, name: user.name, token, userId: user.id });
  await writeSecurityLog({ action: "PASSWORD_RESET_REQUESTED", userId: user.id, entityType: "USER", entityId: user.id, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return { status: "sent" as const };
}

export async function resetPassword(token: string, password: string, context: RequestContext = {}) {
  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedPassword.success) return { status: "invalid-password" as const, message: parsedPassword.error.issues[0]?.message ?? "Пароль не прошел проверку" };

  const reset = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true }
  });

  if (!reset) return { status: "invalid" as const };
  if (reset.usedAt) return { status: "used" as const };
  if (reset.expiresAt < new Date()) return { status: "expired" as const };

  const passwordHash = await hashPassword(password);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: reset.userId },
      data: {
        passwordHash,
        lastPasswordChangeAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
    await tx.passwordResetToken.updateMany({
      where: { userId: reset.userId, usedAt: null },
      data: { usedAt: new Date() }
    });
  });

  await sendPasswordChangedEmail({ to: reset.user.email, name: reset.user.name, userId: reset.userId });
  await writeSecurityLog({ action: "PASSWORD_RESET_COMPLETED", userId: reset.userId, entityType: "USER", entityId: reset.userId, ipAddress: context.ipAddress, userAgent: context.userAgent });
  await writeSecurityLog({ action: "PASSWORD_CHANGED", userId: reset.userId, entityType: "USER", entityId: reset.userId, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return { status: "success" as const };
}

export async function authenticateCredentials(emailInput: string, password: string, context: RequestContext = {}) {
  const email = normalizeEmail(emailInput);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    await writeSecurityLog({ action: "FAILED_LOGIN", metadata: { email }, ipAddress: context.ipAddress, userAgent: context.userAgent, severity: "WARNING" });
    throw new AuthFlowError("INVALID_CREDENTIALS");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) throw new AuthFlowError("USER_LOCKED");
  if (!user.emailVerifiedAt) throw new AuthFlowError("EMAIL_NOT_VERIFIED");
  if (user.deactivatedAt) throw new AuthFlowError("USER_DEACTIVATED");
  if (!user.isActive) throw new AuthFlowError("USER_NOT_ACTIVE");

  const passwordMatches = await verifyPassword(password, user.passwordHash);
  if (!passwordMatches) {
    const failedLoginAttempts = user.failedLoginAttempts + 1;
    const lockedUntil = failedLoginAttempts >= MAX_FAILED_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCK_MS) : null;
    await prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts, lockedUntil }
    });
    await writeSecurityLog({ action: "FAILED_LOGIN", userId: user.id, entityType: "USER", entityId: user.id, ipAddress: context.ipAddress, userAgent: context.userAgent, severity: "WARNING", metadata: { failedLoginAttempts, lockedUntil } });
    throw new AuthFlowError(lockedUntil ? "USER_LOCKED" : "INVALID_CREDENTIALS");
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), failedLoginAttempts: 0, lockedUntil: null }
  });
  await writeSecurityLog({ action: "LOGIN", userId: user.id, entityType: "USER", entityId: user.id, ipAddress: context.ipAddress, userAgent: context.userAgent });
  return updated;
}

export async function createUserInvitation(data: { name: string; email: string; role: UserRole; comment?: string | null }, invitedById: string) {
  const email = normalizeEmail(data.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { ok: false as const, message: "Пользователь с таким email уже существует" };

  await prisma.userInvitation.updateMany({
    where: { email, acceptedAt: null, cancelledAt: null },
    data: { cancelledAt: new Date() }
  });

  const token = createRawToken();
  const invitation = await prisma.userInvitation.create({
    data: {
      email,
      name: data.name.trim(),
      role: data.role,
      invitedById,
      tokenHash: hashToken(token),
      expiresAt: expiresIn(INVITATION_TTL_MS),
      comment: data.comment ?? null
    }
  });
  await sendInvitationEmail({ to: email, name: data.name, token, userId: invitedById });
  await writeSecurityLog({ action: "USER_INVITED", userId: invitedById, entityType: "USER", entityId: invitation.id, metadata: { email, role: data.role } });
  return { ok: true as const, invitation };
}

export async function acceptInvitation(token: string, password: string) {
  const parsedPassword = passwordSchema.safeParse(password);
  if (!parsedPassword.success) return { status: "invalid-password" as const, message: parsedPassword.error.issues[0]?.message ?? "Пароль не прошел проверку" };

  const invitation = await prisma.userInvitation.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!invitation || invitation.cancelledAt) return { status: "invalid" as const };
  if (invitation.acceptedAt) return { status: "used" as const };
  if (invitation.expiresAt < new Date()) return { status: "expired" as const };

  const passwordHash = await hashPassword(password);
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        passwordHash,
        isActive: true,
        emailVerifiedAt: new Date(),
        lastPasswordChangeAt: new Date()
      }
    });
    await tx.userInvitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } });
    return created;
  });
  await writeSecurityLog({ action: "EMAIL_VERIFIED", userId: user.id, entityType: "USER", entityId: user.id });
  return { status: "success" as const, user };
}

export async function activateUser(id: string, actorId: string) {
  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return null;
  const user = await prisma.user.update({
    where: { id },
    data: { isActive: true, deactivatedAt: null, deactivatedById: null }
  });
  await writeAuditLog({ entityType: "USER", entityId: id, action: "ACTIVATE", userId: actorId, before, after: user });
  await writeSecurityLog({ action: "USER_ACTIVATED", userId: actorId, entityType: "USER", entityId: id });
  await sendUserActivatedEmail({ to: user.email, name: user.name, userId: user.id });
  return user;
}

export async function deactivateUser(id: string, actorId: string) {
  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return null;
  const user = await prisma.user.update({
    where: { id },
    data: { isActive: false, deactivatedAt: new Date(), deactivatedById: actorId }
  });
  await writeAuditLog({ entityType: "USER", entityId: id, action: "DEACTIVATE", userId: actorId, before, after: user });
  await writeSecurityLog({ action: "USER_DEACTIVATED", userId: actorId, entityType: "USER", entityId: id });
  await sendUserDeactivatedEmail({ to: user.email, name: user.name, userId: user.id });
  return user;
}

export async function updateUserRole(id: string, role: UserRole, actorId: string) {
  const before = await prisma.user.findUnique({ where: { id } });
  if (!before) return null;
  const user = await prisma.user.update({ where: { id }, data: { role } });
  await writeAuditLog({ entityType: "USER", entityId: id, action: "ROLE_CHANGED", userId: actorId, before, after: user });
  await writeSecurityLog({ action: "ROLE_CHANGED", userId: actorId, entityType: "USER", entityId: id, metadata: { before: before.role, after: role } });
  return user;
}
