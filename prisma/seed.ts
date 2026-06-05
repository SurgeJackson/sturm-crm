import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "Sturm12345";

const users = [
  {
    id: "seed_owner",
    name: "Алексей Руководитель",
    email: "owner@sturm.local",
    role: UserRole.OWNER
  },
  {
    id: "seed_sales_lead",
    name: "Мария Старший менеджер",
    email: "sales-lead@sturm.local",
    role: UserRole.SALES_LEAD
  },
  {
    id: "seed_store_manager",
    name: "Ирина Менеджер магазина",
    email: "store-manager@sturm.local",
    role: UserRole.STORE_MANAGER
  },
  {
    id: "seed_project_manager",
    name: "Денис Проектный менеджер",
    email: "project-manager@sturm.local",
    role: UserRole.PROJECT_MANAGER
  },
  {
    id: "seed_administrator",
    name: "Ольга Администратор",
    email: "administrator@sturm.local",
    role: UserRole.ADMINISTRATOR
  }
];

async function main() {
  const now = new Date();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  for (const user of users) {
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
      nextStepAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      nextStepText: "Позвонить и договориться о встрече",
      transferredObjectsCount: 1,
      activeObjectsCount: 1,
      proposalsTotalAmount: 0,
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
      nextStepAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      nextStepText: "Позвонить и договориться о встрече",
      transferredObjectsCount: 1,
      activeObjectsCount: 1,
      proposalsTotalAmount: 0,
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
      implementationEndAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
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
      implementationEndAt: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
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

  console.log("Seed completed");
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
