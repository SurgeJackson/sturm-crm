import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";
import { runCrmDisciplineCheck } from "../modules/crm-discipline/service";
import { DEMO_PASSWORD } from "./seed-fixtures";
import { offsetDate, prepareSeedProposalFile, seedUserAccounts } from "./seed-support";

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

  await prisma.projectObject.upsert({
    where: { id: "seed_project_object_apartments" },
    update: {
      title: "Комплектация апартаментов",
      objectType: "APARTMENTS_COMPLEX",
      city: "Москва",
      region: "Москва",
      address: "Пресненская набережная, 12",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      status: "ACTIVE",
      stage: "CALCULATION",
      implementationStartAt: now,
      implementationEndAt: offsetDate(now, 45),
      budget: 2800000,
      bathroomsCount: 8,
      interestCategories: ["SANITARY_WARE", "MIXERS", "SHOWER_SYSTEMS", "BATHROOM_FURNITURE"],
      files: ["Планировка апартаментов.pdf", "Спецификация санузлов.xlsx"],
      comment: "Seed-объект для проверки Stage 3",
      responsibleId: "seed_owner",
      archivedAt: null,
      notes: "Seed-объект для проверки Stage 3"
    },
    create: {
      id: "seed_project_object_apartments",
      title: "Комплектация апартаментов",
      objectType: "APARTMENTS_COMPLEX",
      city: "Москва",
      region: "Москва",
      address: "Пресненская набережная, 12",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      status: "ACTIVE",
      stage: "CALCULATION",
      implementationStartAt: now,
      implementationEndAt: offsetDate(now, 45),
      budget: 2800000,
      bathroomsCount: 8,
      interestCategories: ["SANITARY_WARE", "MIXERS", "SHOWER_SYSTEMS", "BATHROOM_FURNITURE"],
      files: ["Планировка апартаментов.pdf", "Спецификация санузлов.xlsx"],
      comment: "Seed-объект для проверки Stage 3",
      responsibleId: "seed_owner",
      createdById: "seed_owner",
      archivedAt: null,
      notes: "Seed-объект для проверки Stage 3"
    }
  });

  await prisma.projectObjectParticipant.upsert({
    where: { id: "seed_object_participant_owner" },
    update: {
      participantType: "PURCHASE_INFLUENCER",
      fullName: "Анна Собственник",
      company: "STURM Development",
      role: "Собственник",
      phone: "+7 900 000-00-03",
      email: "owner-client@example.com",
      messenger: "Telegram",
      responsibleId: "seed_owner",
      influenceLevel: "HIGH",
      influenceType: "FINAL_DECISION",
      attitudeToSturm: "LOYAL",
      decisionFactors: "Сроки, бренд, наличие",
      responsibilityZone: null,
      canApproveChanges: null,
      whenToInvolve: null,
      comment: "Ключевой участник решения",
      archivedAt: null
    },
    create: {
      id: "seed_object_participant_owner",
      objectId: "seed_project_object_apartments",
      participantType: "PURCHASE_INFLUENCER",
      fullName: "Анна Собственник",
      company: "STURM Development",
      role: "Собственник",
      phone: "+7 900 000-00-03",
      email: "owner-client@example.com",
      messenger: "Telegram",
      responsibleId: "seed_owner",
      influenceLevel: "HIGH",
      influenceType: "FINAL_DECISION",
      attitudeToSturm: "LOYAL",
      decisionFactors: "Сроки, бренд, наличие",
      responsibilityZone: null,
      canApproveChanges: null,
      whenToInvolve: null,
      comment: "Ключевой участник решения",
      createdById: "seed_owner",
      archivedAt: null
    }
  });

  await prisma.projectObjectParticipant.upsert({
    where: { id: "seed_object_participant_foreman" },
    update: {
      participantType: "IMPLEMENTATION_CONTACT",
      fullName: "Игорь Прораб",
      company: "Генподрядчик",
      role: "Прораб",
      phone: "+7 900 000-00-04",
      email: "foreman@example.com",
      messenger: "WhatsApp",
      responsibleId: "seed_project_manager",
      influenceLevel: null,
      influenceType: null,
      attitudeToSturm: null,
      decisionFactors: null,
      responsibilityZone: "Приемка, монтаж, сроки",
      canApproveChanges: "PARTIALLY",
      whenToInvolve: "Перед поставкой и при изменениях на объекте",
      comment: "Контакт реализации",
      archivedAt: null
    },
    create: {
      id: "seed_object_participant_foreman",
      objectId: "seed_project_object_apartments",
      participantType: "IMPLEMENTATION_CONTACT",
      fullName: "Игорь Прораб",
      company: "Генподрядчик",
      role: "Прораб",
      phone: "+7 900 000-00-04",
      email: "foreman@example.com",
      messenger: "WhatsApp",
      responsibleId: "seed_project_manager",
      influenceLevel: null,
      influenceType: null,
      attitudeToSturm: null,
      decisionFactors: null,
      responsibilityZone: "Приемка, монтаж, сроки",
      canApproveChanges: "PARTIALLY",
      whenToInvolve: "Перед поставкой и при изменениях на объекте",
      comment: "Контакт реализации",
      createdById: "seed_owner",
      archivedAt: null
    }
  });

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

  await prisma.commercialProposal.upsert({
    where: { id: "seed_proposal_sanitary_v1" },
    update: {
      proposalNumber: `КП-${year}-0001`,
      dealId: "seed_deal_apartments_sanitary",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      responsibleId: "seed_owner",
      version: 1,
      parentProposalId: null,
      amount: 1850000,
      discountPercent: 7,
      discountAmount: 139250,
      status: "SENT",
      recipientType: "CLIENT",
      recipientName: "Клиент шоурума",
      recipientContact: "client@example.com",
      approvalRequiredFrom: "Анна Собственник",
      sentAt: offsetDate(now, -2),
      nextTouchAt: offsetDate(now, 2),
      fileUrl: "/uploads/proposals/seed-kp.pdf",
      fileName: "seed-kp.pdf",
      fileSize: 29,
      fileMimeType: "application/pdf",
      uploadedById: "seed_owner",
      uploadedAt: now,
      declineReason: null,
      declineComment: null,
      comment: "Seed КП для проверки отправки и follow-up",
      archivedAt: null,
      notes: "Seed КП для проверки отправки и follow-up"
    },
    create: {
      id: "seed_proposal_sanitary_v1",
      proposalNumber: `КП-${year}-0001`,
      dealId: "seed_deal_apartments_sanitary",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      responsibleId: "seed_owner",
      version: 1,
      parentProposalId: null,
      amount: 1850000,
      discountPercent: 7,
      discountAmount: 139250,
      status: "SENT",
      recipientType: "CLIENT",
      recipientName: "Клиент шоурума",
      recipientContact: "client@example.com",
      approvalRequiredFrom: "Анна Собственник",
      sentAt: offsetDate(now, -2),
      nextTouchAt: offsetDate(now, 2),
      fileUrl: "/uploads/proposals/seed-kp.pdf",
      fileName: "seed-kp.pdf",
      fileSize: 29,
      fileMimeType: "application/pdf",
      uploadedById: "seed_owner",
      uploadedAt: now,
      declineReason: null,
      declineComment: null,
      comment: "Seed КП для проверки отправки и follow-up",
      createdById: "seed_owner",
      archivedAt: null,
      notes: "Seed КП для проверки отправки и follow-up"
    }
  });

  await prisma.commercialProposal.upsert({
    where: { id: "seed_proposal_sanitary_v2" },
    update: {
      proposalNumber: `КП-${year}-0002`,
      dealId: "seed_deal_apartments_sanitary",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      responsibleId: "seed_owner",
      version: 2,
      parentProposalId: "seed_proposal_sanitary_v1",
      amount: 2200000,
      discountPercent: 5,
      discountAmount: 115000,
      status: "CLIENT_THINKING",
      recipientType: "CLIENT",
      recipientName: "Клиент шоурума",
      recipientContact: "client@example.com",
      approvalRequiredFrom: "Анна Собственник",
      sentAt: offsetDate(now, -8),
      nextTouchAt: offsetDate(now, -1),
      fileUrl: "/uploads/proposals/seed-kp.pdf",
      fileName: "seed-kp.pdf",
      fileSize: 29,
      fileMimeType: "application/pdf",
      uploadedById: "seed_owner",
      uploadedAt: now,
      declineReason: null,
      declineComment: null,
      comment: "Seed версия КП: клиент думает больше 7 дней",
      archivedAt: null,
      notes: "Seed версия КП: клиент думает больше 7 дней"
    },
    create: {
      id: "seed_proposal_sanitary_v2",
      proposalNumber: `КП-${year}-0002`,
      dealId: "seed_deal_apartments_sanitary",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      responsibleId: "seed_owner",
      version: 2,
      parentProposalId: "seed_proposal_sanitary_v1",
      amount: 2200000,
      discountPercent: 5,
      discountAmount: 115000,
      status: "CLIENT_THINKING",
      recipientType: "CLIENT",
      recipientName: "Клиент шоурума",
      recipientContact: "client@example.com",
      approvalRequiredFrom: "Анна Собственник",
      sentAt: offsetDate(now, -8),
      nextTouchAt: offsetDate(now, -1),
      fileUrl: "/uploads/proposals/seed-kp.pdf",
      fileName: "seed-kp.pdf",
      fileSize: 29,
      fileMimeType: "application/pdf",
      uploadedById: "seed_owner",
      uploadedAt: now,
      declineReason: null,
      declineComment: null,
      comment: "Seed версия КП: клиент думает больше 7 дней",
      createdById: "seed_owner",
      archivedAt: null,
      notes: "Seed версия КП: клиент думает больше 7 дней"
    }
  });

  await prisma.commercialProposal.upsert({
    where: { id: "seed_proposal_accessories_declined" },
    update: {
      proposalNumber: `КП-${year}-0003`,
      dealId: "seed_deal_apartments_accessories_lost",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      responsibleId: "seed_sales_lead",
      version: 1,
      parentProposalId: null,
      amount: 320000,
      discountPercent: null,
      discountAmount: null,
      status: "DECLINED",
      recipientType: "CLIENT",
      recipientName: "Клиент шоурума",
      recipientContact: "client@example.com",
      approvalRequiredFrom: null,
      sentAt: offsetDate(now, -4),
      nextTouchAt: null,
      fileUrl: "/uploads/proposals/seed-kp.pdf",
      fileName: "seed-kp.pdf",
      fileSize: 29,
      fileMimeType: "application/pdf",
      uploadedById: "seed_sales_lead",
      uploadedAt: now,
      declineReason: "PRICE",
      declineComment: "Клиент выбрал более дешевый комплект",
      comment: "Seed отклоненное КП",
      archivedAt: null,
      notes: "Seed отклоненное КП"
    },
    create: {
      id: "seed_proposal_accessories_declined",
      proposalNumber: `КП-${year}-0003`,
      dealId: "seed_deal_apartments_accessories_lost",
      clientId: "seed_client_showroom",
      objectId: "seed_project_object_apartments",
      designerId: "seed_designer_north",
      responsibleId: "seed_sales_lead",
      version: 1,
      parentProposalId: null,
      amount: 320000,
      discountPercent: null,
      discountAmount: null,
      status: "DECLINED",
      recipientType: "CLIENT",
      recipientName: "Клиент шоурума",
      recipientContact: "client@example.com",
      approvalRequiredFrom: null,
      sentAt: offsetDate(now, -4),
      nextTouchAt: null,
      fileUrl: "/uploads/proposals/seed-kp.pdf",
      fileName: "seed-kp.pdf",
      fileSize: 29,
      fileMimeType: "application/pdf",
      uploadedById: "seed_sales_lead",
      uploadedAt: now,
      declineReason: "PRICE",
      declineComment: "Клиент выбрал более дешевый комплект",
      comment: "Seed отклоненное КП",
      createdById: "seed_owner",
      archivedAt: null,
      notes: "Seed отклоненное КП"
    }
  });

  await prisma.taskActivity.upsert({
    where: { id: "seed_task_proposal_followup" },
    update: {
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: `Связаться по КП КП-${year}-0001`,
      description: "Проверить реакцию клиента после отправки КП",
      status: "NEW",
      priority: "HIGH",
      objectId: "seed_project_object_apartments",
      dealId: "seed_deal_apartments_sanitary",
      proposalId: "seed_proposal_sanitary_v1",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, 2),
      completedAt: null,
      result: null,
      nextStepText: null,
      nextStepAt: null,
      responsibleId: "seed_owner",
      isAutoCreated: true,
      autoRule: "PROPOSAL_FOLLOW_UP",
      archivedAt: null,
      notes: "Seed follow-up по отправленному КП"
    },
    create: {
      id: "seed_task_proposal_followup",
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: `Связаться по КП КП-${year}-0001`,
      description: "Проверить реакцию клиента после отправки КП",
      status: "NEW",
      priority: "HIGH",
      objectId: "seed_project_object_apartments",
      dealId: "seed_deal_apartments_sanitary",
      proposalId: "seed_proposal_sanitary_v1",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, 2),
      responsibleId: "seed_owner",
      createdById: "seed_owner",
      isAutoCreated: true,
      autoRule: "PROPOSAL_FOLLOW_UP",
      archivedAt: null,
      notes: "Seed follow-up по отправленному КП"
    }
  });

  await prisma.taskActivity.upsert({
    where: { id: "seed_task_overdue_deal" },
    update: {
      recordType: "TASK",
      actionType: "CALL",
      title: "Позвонить клиенту по подбору",
      description: "Просроченная seed-задача для проверки контроля",
      status: "IN_PROGRESS",
      priority: "URGENT",
      objectId: "seed_project_object_apartments",
      dealId: "seed_deal_apartments_sanitary",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, -1),
      completedAt: null,
      result: null,
      responsibleId: "seed_store_manager",
      archivedAt: null,
      notes: "Seed просроченная задача"
    },
    create: {
      id: "seed_task_overdue_deal",
      recordType: "TASK",
      actionType: "CALL",
      title: "Позвонить клиенту по подбору",
      description: "Просроченная seed-задача для проверки контроля",
      status: "IN_PROGRESS",
      priority: "URGENT",
      objectId: "seed_project_object_apartments",
      dealId: "seed_deal_apartments_sanitary",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, -1),
      responsibleId: "seed_store_manager",
      createdById: "seed_owner",
      archivedAt: null,
      notes: "Seed просроченная задача"
    }
  });

  await prisma.taskActivity.upsert({
    where: { id: "seed_touch_designer_meeting" },
    update: {
      recordType: "TOUCH",
      actionType: "SHOWROOM_MEETING",
      title: "Встреча с дизайнером в шоуруме",
      description: "Обсудили объект и сроки реализации",
      status: "RECORDED",
      priority: "NORMAL",
      objectId: "seed_project_object_apartments",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, -2),
      completedAt: offsetDate(now, -2),
      result: "Дизайнер готов показать подбор клиенту",
      nextStepText: "Отправить уточненную подборку",
      nextStepAt: offsetDate(now, 1),
      responsibleId: "seed_project_manager",
      archivedAt: null,
      notes: "Seed касание"
    },
    create: {
      id: "seed_touch_designer_meeting",
      recordType: "TOUCH",
      actionType: "SHOWROOM_MEETING",
      title: "Встреча с дизайнером в шоуруме",
      description: "Обсудили объект и сроки реализации",
      status: "RECORDED",
      priority: "NORMAL",
      objectId: "seed_project_object_apartments",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, -2),
      completedAt: offsetDate(now, -2),
      result: "Дизайнер готов показать подбор клиенту",
      nextStepText: "Отправить уточненную подборку",
      nextStepAt: offsetDate(now, 1),
      responsibleId: "seed_project_manager",
      createdById: "seed_owner",
      archivedAt: null,
      notes: "Seed касание"
    }
  });

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
