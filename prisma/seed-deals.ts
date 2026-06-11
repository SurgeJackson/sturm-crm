import type { PrismaClient } from "../generated/prisma/client";
import { offsetDate } from "./seed-support";

const kanbanTestDeals = [
  {
    id: "seed_deal_kanban_manager_owner_selection",
    title: "Канбан тест: подбор сантехники",
    responsibleId: "seed_owner",
    stage: "SELECTION",
    potentialAmount: 740000,
    probability: "MEDIUM",
    nextActionDays: 1,
    nextActionText: "Согласовать подборку с клиентом",
    source: "SHOWROOM"
  },
  {
    id: "seed_deal_kanban_manager_owner_paid",
    title: "Канбан тест: оплаченный комплект",
    responsibleId: "seed_owner",
    stage: "PAID",
    potentialAmount: 1290000,
    probability: "VERY_HIGH",
    nextActionDays: 4,
    nextActionText: "Проверить готовность к поставке",
    source: "REPEAT_CLIENT"
  },
  {
    id: "seed_deal_kanban_manager_sales_new",
    title: "Канбан тест: новая заявка дизайнера",
    responsibleId: "seed_sales_lead",
    stage: "NEW_REQUEST",
    potentialAmount: 410000,
    probability: "LOW",
    nextActionDays: 0,
    nextActionText: "Уточнить состав помещений",
    source: "DESIGNER"
  },
  {
    id: "seed_deal_kanban_manager_sales_invoice",
    title: "Канбан тест: счет на смесители",
    responsibleId: "seed_sales_lead",
    stage: "INVOICE_OR_ORDER",
    potentialAmount: 980000,
    probability: "HIGH",
    nextActionDays: 2,
    nextActionText: "Отправить счет и условия поставки",
    source: "PHONE"
  },
  {
    id: "seed_deal_kanban_manager_store_qualification",
    title: "Канбан тест: квалификация шоурума",
    responsibleId: "seed_store_manager",
    stage: "QUALIFICATION",
    potentialAmount: 260000,
    probability: "MEDIUM",
    nextActionDays: 1,
    nextActionText: "Зафиксировать бюджет и сроки",
    source: "SHOWROOM"
  },
  {
    id: "seed_deal_kanban_manager_store_delivery",
    title: "Канбан тест: поставка мебели",
    responsibleId: "seed_store_manager",
    stage: "IN_DELIVERY",
    potentialAmount: 1460000,
    probability: "VERY_HIGH",
    nextActionDays: 5,
    nextActionText: "Сверить дату доставки",
    source: "WEBSITE"
  },
  {
    id: "seed_deal_kanban_manager_project_proposal",
    title: "Канбан тест: КП для объекта",
    responsibleId: "seed_project_manager",
    stage: "PROPOSAL_SENT",
    potentialAmount: 2150000,
    probability: "HIGH",
    nextActionDays: 3,
    nextActionText: "Получить обратную связь по КП",
    source: "COMMERCIAL_PROJECT"
  },
  {
    id: "seed_deal_kanban_manager_project_negotiation",
    title: "Канбан тест: переговоры по поставке",
    responsibleId: "seed_project_manager",
    stage: "NEGOTIATION",
    potentialAmount: 1780000,
    probability: "HIGH",
    nextActionDays: -1,
    nextActionText: "Согласовать финальную скидку",
    source: "RECOMMENDATION"
  },
  {
    id: "seed_deal_kanban_manager_admin_waiting",
    title: "Канбан тест: ожидание решения",
    responsibleId: "seed_administrator",
    stage: "WAITING_DECISION",
    potentialAmount: 620000,
    probability: "MEDIUM",
    nextActionDays: 6,
    nextActionText: "Напомнить о резерве товара",
    source: "OTHER"
  },
  {
    id: "seed_deal_kanban_manager_admin_completed",
    title: "Канбан тест: завершенный заказ",
    responsibleId: "seed_administrator",
    stage: "COMPLETED",
    potentialAmount: 890000,
    probability: "VERY_HIGH",
    nextActionDays: null,
    nextActionText: null,
    source: "REPEAT_CLIENT"
  }
] as const;

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

  for (const deal of kanbanTestDeals) {
    const nextActionAt = deal.nextActionDays === null ? null : offsetDate(now, deal.nextActionDays);
    const closedAt = deal.stage === "COMPLETED" ? now : null;

    await prisma.deal.upsert({
      where: { id: deal.id },
      update: {
        title: deal.title,
        clientId: "seed_client_showroom",
        objectId: "seed_project_object_apartments",
        designerId: "seed_designer_north",
        responsibleId: deal.responsibleId,
        stage: deal.stage,
        potentialAmount: deal.potentialAmount,
        probability: deal.probability,
        nextActionAt,
        nextActionText: deal.nextActionText,
        source: deal.source,
        lossReason: null,
        lossComment: null,
        comment: "Seed-сделка для проверки группировки канбана по ответственному менеджеру",
        archivedAt: null,
        closedAt,
        notes: "Seed-сделка для проверки группировки канбана по ответственному менеджеру"
      },
      create: {
        id: deal.id,
        title: deal.title,
        clientId: "seed_client_showroom",
        objectId: "seed_project_object_apartments",
        designerId: "seed_designer_north",
        responsibleId: deal.responsibleId,
        stage: deal.stage,
        potentialAmount: deal.potentialAmount,
        probability: deal.probability,
        nextActionAt,
        nextActionText: deal.nextActionText,
        source: deal.source,
        lossReason: null,
        lossComment: null,
        comment: "Seed-сделка для проверки группировки канбана по ответственному менеджеру",
        createdById: "seed_owner",
        archivedAt: null,
        closedAt,
        notes: "Seed-сделка для проверки группировки канбана по ответственному менеджеру"
      }
    });
  }
}
