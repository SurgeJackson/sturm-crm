import type { PrismaClient, UserRole } from "../generated/prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { defaultRolePermissions } from "../modules/admin/permissions";
import { seedUsers } from "./seed-fixtures";

export async function seedUserAccounts(prisma: PrismaClient, passwordHash: string) {
  const now = new Date();
  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        isActive: true,
        passwordHash,
        emailVerifiedAt: now,
        lastPasswordChangeAt: now,
        failedLoginAttempts: 0,
        lockedUntil: null,
        deactivatedAt: null,
        deactivatedById: null
      },
      create: {
        ...user,
        passwordHash,
        isActive: true,
        emailVerifiedAt: now,
        lastPasswordChangeAt: now
      }
    });
  }
}

export async function seedRolePermissions(prisma: PrismaClient) {
  for (const [role, permissions] of Object.entries(defaultRolePermissions)) {
    const userRole = role as UserRole;
    for (const [permissionKey, isAllowed] of Object.entries(permissions)) {
      await prisma.rolePermission.upsert({
        where: { role_permissionKey: { role: userRole, permissionKey } },
        update: { isAllowed },
        create: { role: userRole, permissionKey, isAllowed }
      });
    }
  }
}

export async function prepareSeedProposalFile() {
  const uploadsDir = path.join(process.cwd(), "public", "uploads", "proposals");
  await mkdir(uploadsDir, { recursive: true });
  await writeFile(path.join(uploadsDir, "seed-kp.pdf"), Buffer.from("Seed commercial proposal file"));
}

export function offsetDate(now: Date, days: number) {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}
