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
      relationshipStage: "NEW_CONTACT",
      potential: "A",
      loyalty: "WARM",
      cooperationTerms: null,
      firstContactAt: now,
      lastTouchAt: now,
      nextStepAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      nextStepText: "Позвонить и договориться о встрече",
      transferredObjectsCount: 0,
      activeObjectsCount: 0,
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
      relationshipStage: "NEW_CONTACT",
      potential: "A",
      loyalty: "WARM",
      cooperationTerms: null,
      firstContactAt: now,
      lastTouchAt: now,
      nextStepAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      nextStepText: "Позвонить и договориться о встрече",
      transferredObjectsCount: 0,
      activeObjectsCount: 0,
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
      status: "ACTIVE",
      responsibleId: "seed_owner",
      archivedAt: null,
      notes: "Seed-запись для проверки dashboard"
    },
    create: {
      id: "seed_project_object_apartments",
      title: "Комплектация апартаментов",
      status: "ACTIVE",
      responsibleId: "seed_owner",
      createdById: "seed_owner",
      archivedAt: null,
      notes: "Seed-запись для проверки dashboard"
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
