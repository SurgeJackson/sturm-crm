import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";
import { runCrmDisciplineCheck } from "../modules/crm-discipline/full-check";
import { DEMO_PASSWORD } from "./seed-fixtures";
import { seedCrmData } from "./seed-crm";
import { prepareSeedProposalFile, seedRolePermissions, seedUserAccounts } from "./seed-support";
import { seedTimeClock } from "./seed-time-clock";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const now = new Date();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const year = now.getFullYear();
  await prepareSeedProposalFile();
  await seedUserAccounts(prisma, passwordHash);
  await seedRolePermissions(prisma);

  await seedCrmData(prisma, now, year);
  await seedTimeClock(prisma, now);

  const discipline = await runCrmDisciplineCheck("seed_owner");

  console.log("Seed completed");
  console.log(`CRM discipline check: ${discipline.created} created, ${discipline.resolved} resolved, ${discipline.active} active`);
  console.log(`Demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
