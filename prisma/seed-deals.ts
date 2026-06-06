import type { PrismaClient } from "../generated/prisma/client";
import { offsetDate } from "./seed-support";

export async function seedDeals(prisma: PrismaClient, now: Date) {
  await prisma.deal.upsert({
    where: { id: "seed_deal_apartments_sanitary" },
    update: {
      title: "Сантехника для апартаментов",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      responsibleId: "seed_owner",
      stage: "PROPOSAL_IN_PROGRESS",
      potentialAmount: 1850000,
      probability: "HIGH",
      nextActionAt: offsetDate(now, 3),
      nextActionText: "Подготовить КП по сантехнике",
      source: "DESIGNER",
      lossReason: null,
      lossComment: null,
      comment: "Seed-сделка для проверки Stage 4",
      archivedAt: null,
      closedAt: null,
      notes: "Seed-сделка для проверки Stage 4"
    },
    create: {
      id: "seed_deal_apartments_sanitary",
      title: "Сантехника для апартаментов",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      responsibleId: "seed_owner",
      stage: "PROPOSAL_IN_PROGRESS",
      potentialAmount: 1850000,
      probability: "HIGH",
      nextActionAt: offsetDate(now, 3),
      nextActionText: "Подготовить КП по сантехнике",
      source: "DESIGNER",
      lossReason: null,
      lossComment: null,
      comment: "Seed-сделка для проверки Stage 4",
      createdById: "seed_owner",
      archivedAt: null,
      closedAt: null,
      notes: "Seed-сделка для проверки Stage 4"
    }
  });

  await prisma.deal.upsert({
    where: { id: "seed_deal_apartments_accessories_lost" },
    update: {
      title: "Аксессуары для апартаментов",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      responsibleId: "seed_sales_lead",
      stage: "LOST",
      potentialAmount: 320000,
      probability: "LOW",
      nextActionAt: null,
      nextActionText: null,
      source: "DESIGNER",
      lossReason: "PRICE",
      lossComment: "Клиент выбрал более дешевый комплект",
      comment: "Seed-проигрыш для проверки причин",
      archivedAt: null,
      closedAt: now,
      notes: "Seed-проигрыш для проверки причин"
    },
    create: {
      id: "seed_deal_apartments_accessories_lost",
      title: "Аксессуары для апартаментов",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      responsibleId: "seed_sales_lead",
      stage: "LOST",
      potentialAmount: 320000,
      probability: "LOW",
      nextActionAt: null,
      nextActionText: null,
      source: "DESIGNER",
      lossReason: "PRICE",
      lossComment: "Клиент выбрал более дешевый комплект",
      comment: "Seed-проигрыш для проверки причин",
      createdById: "seed_owner",
      archivedAt: null,
      closedAt: now,
      notes: "Seed-проигрыш для проверки причин"
    }
  });


}
