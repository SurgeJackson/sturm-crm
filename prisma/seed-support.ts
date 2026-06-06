import type { PrismaClient } from "../generated/prisma/client";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { seedUsers } from "./seed-fixtures";

export async function seedUserAccounts(prisma: PrismaClient, passwordHash: string) {
  for (const user of seedUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        isActive: true,
        passwordHash
      },
      create: {
        ...user,
        passwordHash,
        isActive: true
      }
    });
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
