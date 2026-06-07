import type { PrismaClient } from "../generated/prisma/client";
import { seedDesignerBonuses } from "./seed-bonuses";
import { seedDeals } from "./seed-deals";
import { seedObjects } from "./seed-objects";
import { seedProposals } from "./seed-proposals";
import { seedRelationships } from "./seed-relationships";
import { seedTasks } from "./seed-tasks";

export async function seedCrmData(prisma: PrismaClient, now: Date, year: number) {
  await seedRelationships(prisma, now);
  await seedObjects(prisma, now);
  await seedDeals(prisma, now);
  await seedProposals(prisma, now, year);
  await seedDesignerBonuses(prisma, now);
  await seedTasks(prisma, now, year);
}
