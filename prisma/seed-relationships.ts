import type { PrismaClient } from "../generated/prisma/client";
import { offsetDate } from "./seed-support";

export async function seedRelationships(prisma: PrismaClient, now: Date) {
  await prisma.client.upsert({
    where: { id: "seed_client_showroom" },
    update: {
      name: "Клиент шоурума",
      clientType: "INDIVIDUAL",
      phone: "+7 900 000-00-01",
      email: "client@example.com",
      messenger: null,
      city: "Москва",
      source: "SHOWROOM",
      linkedDesignerId: null,
      status: "NEW",
      responsibleId: "seed_owner",
      archivedAt: null,
      lastContactAt: null,
      nextContactAt: null,
      comment: "Seed-запись для проверки dashboard",
      notes: "Seed-запись для проверки dashboard"
    },
    create: {
      id: "seed_client_showroom",
      name: "Клиент шоурума",
      clientType: "INDIVIDUAL",
      phone: "+7 900 000-00-01",
      email: "client@example.com",
      messenger: null,
      city: "Москва",
      source: "SHOWROOM",
      linkedDesignerId: null,
      status: "NEW",
      responsibleId: "seed_owner",
      createdById: "seed_owner",
      archivedAt: null,
      lastContactAt: null,
      nextContactAt: null,
      comment: "Seed-запись для проверки dashboard",
      notes: "Seed-запись для проверки dashboard"
    }
  });

  await prisma.designer.upsert({
    where: { id: "seed_designer_north" },
    update: {
      name: "Архитектурное бюро Север",
      studio: "Бюро Север",
      role: "BUREAU_HEAD",
      phone: "+7 900 000-00-02",
      email: "designer@example.com",
      messenger: null,
      website: "https://example.com",
      city: "Санкт-Петербург",
      specialization: ["APARTMENTS", "COMMERCIAL"],
      projectSegment: "PREMIUM",
      source: "RECOMMENDATION",
      status: "ACTIVE",
      responsibleId: "seed_owner",
      relationshipStage: "FIRST_OBJECT_RECEIVED",
      potential: "A",
      loyalty: "WARM",
      cooperationTerms: null,
      firstContactAt: now,
      lastTouchAt: now,
      nextStepAt: offsetDate(now, 7),
      nextStepText: "Позвонить и договориться о встрече",
      transferredObjectsCount: 1,
      activeObjectsCount: 1,
      proposalsTotalAmount: 4050000,
      paymentsTotalAmount: 0,
      archivedAt: null,
      comment: "Seed-запись для проверки dashboard",
      notes: "Seed-запись для проверки dashboard"
    },
    create: {
      id: "seed_designer_north",
      name: "Архитектурное бюро Север",
      studio: "Бюро Север",
      role: "BUREAU_HEAD",
      phone: "+7 900 000-00-02",
      email: "designer@example.com",
      messenger: null,
      website: "https://example.com",
      city: "Санкт-Петербург",
      specialization: ["APARTMENTS", "COMMERCIAL"],
      projectSegment: "PREMIUM",
      source: "RECOMMENDATION",
      status: "ACTIVE",
      responsibleId: "seed_owner",
      relationshipStage: "FIRST_OBJECT_RECEIVED",
      potential: "A",
      loyalty: "WARM",
      cooperationTerms: null,
      firstContactAt: now,
      lastTouchAt: now,
      nextStepAt: offsetDate(now, 7),
      nextStepText: "Позвонить и договориться о встрече",
      transferredObjectsCount: 1,
      activeObjectsCount: 1,
      proposalsTotalAmount: 4050000,
      paymentsTotalAmount: 0,
      createdById: "seed_owner",
      archivedAt: null,
      comment: "Seed-запись для проверки dashboard",
      notes: "Seed-запись для проверки dashboard"
    }
  });

  await prisma.client.update({
    where: { id: "seed_client_showroom" },
    data: { linkedDesignerId: "seed_designer_north" }
  });


}
