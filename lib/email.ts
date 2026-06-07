import { Resend } from "resend";
import { writeSecurityLog } from "@/lib/security-log";

type EmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  userId?: string | null;
  metadata?: Record<string, unknown>;
};

function appUrl() {
  return process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
}

function emailFrom() {
  return process.env.EMAIL_FROM || "STURM CRM <noreply@sturm.local>";
}

function supportEmail() {
  return process.env.SUPPORT_EMAIL || "support@sturm.local";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buttonLink(href: string, label: string) {
  return `<p><a href="${escapeHtml(href)}" style="display:inline-block;border-radius:6px;background:#f7f7f7;color:#111;padding:10px 14px;text-decoration:none;border:1px solid #ddd">${escapeHtml(label)}</a></p>`;
}

function layout(title: string, body: string) {
  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111">
      <h1 style="font-size:20px">${title}</h1>
      ${body}
      <p style="margin-top:24px;color:#666">STURM CRM</p>
    </div>
  `;
}

export async function sendEmail(input: EmailInput) {
  const apiKey = process.env.RESEND_API_KEY;

  try {
    if (!apiKey || process.env.NODE_ENV !== "production") {
      console.info("[email:dev]", { to: input.to, subject: input.subject, html: input.html });
      await writeSecurityLog({
        action: "EMAIL_SENT",
        userId: input.userId,
        entityType: "USER",
        metadata: { ...input.metadata, to: input.to, subject: input.subject, mode: "dev-log" }
      });
      return { id: "dev-log" };
    }

    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from: emailFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text
    });

    await writeSecurityLog({
      action: "EMAIL_SENT",
      userId: input.userId,
      entityType: "USER",
      metadata: { ...input.metadata, to: input.to, subject: input.subject, result }
    });

    return result;
  } catch (error) {
    await writeSecurityLog({
      action: "EMAIL_FAILED",
      userId: input.userId,
      entityType: "USER",
      severity: "WARNING",
      metadata: { ...input.metadata, to: input.to, subject: input.subject, error: error instanceof Error ? error.message : String(error) }
    });
    throw error;
  }
}

export function verificationUrl(token: string) {
  return `${appUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`;
}

export function resetPasswordUrl(token: string) {
  return `${appUrl()}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

export function invitationUrl(token: string) {
  return `${appUrl()}/auth/accept-invitation?token=${encodeURIComponent(token)}`;
}

export async function sendVerificationEmail({ to, name, token, userId, isResend = false }: { to: string; name: string; token: string; userId?: string | null; isResend?: boolean }) {
  const url = verificationUrl(token);
  const safeName = escapeHtml(name);
  return sendEmail({
    to,
    userId,
    subject: isResend ? "Новая ссылка для подтверждения email в STURM CRM" : "Подтверждение email для STURM CRM",
    html: layout("Подтверждение email", `
      <p>Здравствуйте, ${safeName}.</p>
      <p>${isResend ? "Вы запросили новую ссылку для подтверждения email в STURM CRM." : "Вы зарегистрировались в STURM CRM."}</p>
      <p>Для подтверждения email нажмите на кнопку ниже:</p>
      ${buttonLink(url, "Подтвердить email")}
      <p>Ссылка действительна в течение 24 часов.</p>
      <p>Если вы не регистрировались и не запрашивали это письмо, просто проигнорируйте его.</p>
    `),
    metadata: { template: isResend ? "verification_resend" : "verification" }
  });
}

export async function sendPasswordResetEmail({ to, name, token, userId }: { to: string; name: string; token: string; userId?: string | null }) {
  const url = resetPasswordUrl(token);
  const safeName = escapeHtml(name);
  return sendEmail({
    to,
    userId,
    subject: "Восстановление пароля STURM CRM",
    html: layout("Восстановление пароля", `
      <p>Здравствуйте, ${safeName}.</p>
      <p>Мы получили запрос на восстановление пароля для вашей учетной записи STURM CRM.</p>
      ${buttonLink(url, "Восстановить пароль")}
      <p>Ссылка действительна в течение 1 часа.</p>
      <p>Если вы не запрашивали восстановление пароля, проигнорируйте это письмо. Ваш пароль останется без изменений.</p>
    `),
    metadata: { template: "password_reset" }
  });
}

export async function sendPasswordChangedEmail({ to, name, userId }: { to: string; name: string; userId?: string | null }) {
  const safeName = escapeHtml(name);
  const safeSupportEmail = escapeHtml(supportEmail());
  return sendEmail({
    to,
    userId,
    subject: "Пароль STURM CRM был изменен",
    html: layout("Пароль изменен", `
      <p>Здравствуйте, ${safeName}.</p>
      <p>Пароль вашей учетной записи STURM CRM был успешно изменен.</p>
      <p>Если это были не вы, немедленно обратитесь к руководителю или администратору CRM.</p>
      <p>Контакт поддержки: ${safeSupportEmail}.</p>
    `),
    metadata: { template: "password_changed" }
  });
}

export async function sendUserActivatedEmail({ to, name, userId }: { to: string; name: string; userId?: string | null }) {
  const safeName = escapeHtml(name);
  return sendEmail({
    to,
    userId,
    subject: "Доступ к STURM CRM активирован",
    html: layout("Доступ активирован", `
      <p>Здравствуйте, ${safeName}.</p>
      <p>Ваш доступ к STURM CRM активирован.</p>
      ${buttonLink(`${appUrl()}/auth/login`, "Войти в STURM CRM")}
    `),
    metadata: { template: "user_activated" }
  });
}

export async function sendUserDeactivatedEmail({ to, name, userId }: { to: string; name: string; userId?: string | null }) {
  const safeName = escapeHtml(name);
  return sendEmail({
    to,
    userId,
    subject: "Доступ к STURM CRM деактивирован",
    html: layout("Доступ деактивирован", `
      <p>Здравствуйте, ${safeName}.</p>
      <p>Ваш доступ к STURM CRM был деактивирован.</p>
      <p>Если вы считаете, что это ошибка, обратитесь к руководителю.</p>
    `),
    metadata: { template: "user_deactivated" }
  });
}

export async function sendInvitationEmail({ to, name, token, userId }: { to: string; name: string; token: string; userId?: string | null }) {
  const url = invitationUrl(token);
  const safeName = escapeHtml(name || "коллега");
  return sendEmail({
    to,
    userId,
    subject: "Приглашение в STURM CRM",
    html: layout("Приглашение в STURM CRM", `
      <p>Здравствуйте, ${safeName}.</p>
      <p>Вам создана учетная запись в STURM CRM.</p>
      <p>Для завершения регистрации и создания пароля перейдите по ссылке:</p>
      ${buttonLink(url, "Принять приглашение")}
      <p>Ссылка действительна в течение 24 часов.</p>
    `),
    metadata: { template: "invitation" }
  });
}
