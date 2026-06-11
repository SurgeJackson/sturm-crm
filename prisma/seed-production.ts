import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type UserRole } from "../generated/prisma/client";
import bcrypt from "bcryptjs";
import { defaultRolePermissions } from "../modules/admin/permissions";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required for production seed.`);
  return value;
}

function validatePassword(password: string) {
  if (password.length < 8) throw new Error("INITIAL_ADMIN_PASSWORD must be at least 8 characters long.");
  if (!/[A-Za-zА-Яа-я]/.test(password)) throw new Error("INITIAL_ADMIN_PASSWORD must contain at least one letter.");
  if (!/[0-9]/.test(password)) throw new Error("INITIAL_ADMIN_PASSWORD must contain at least one digit.");
}

async function seedRolePermissions() {
  for (const [roleKey, permissions] of Object.entries(defaultRolePermissions)) {
    const role = roleKey as UserRole;
    for (const [permissionKey, isAllowed] of Object.entries(permissions)) {
      await prisma.rolePermission.upsert({
        where: { role_permissionKey: { role, permissionKey } },
        update: { isAllowed },
        create: { role, permissionKey, isAllowed }
      });
    }
  }
}

async function main() {
  await seedRolePermissions();

  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log(`Production seed skipped initial admin creation: ${existingUsers} user(s) already exist.`);
    return;
  }

  const email = requiredEnv("INITIAL_ADMIN_EMAIL").toLowerCase();
  const password = requiredEnv("INITIAL_ADMIN_PASSWORD");
  const name = process.env.INITIAL_ADMIN_NAME?.trim() || "Администратор";
  validatePassword(password);

  await prisma.user.create({
    data: {
      name,
      email,
      role: "OWNER",
      passwordHash: await bcrypt.hash(password, 12),
      isActive: true,
      emailVerifiedAt: new Date(),
      lastPasswordChangeAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
      deactivatedAt: null,
      deactivatedById: null
    }
  });

  console.log(`Initial OWNER admin created: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
