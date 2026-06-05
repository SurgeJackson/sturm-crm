import bcrypt from "bcryptjs";
import { MongoClient, ObjectId } from "mongodb";
import { UserRole } from "@prisma/client";

const uri = process.env.DATABASE_URL;

if (!uri) {
  throw new Error("DATABASE_URL is not set");
}

const client = new MongoClient(uri);
const DEMO_PASSWORD = "Sturm12345";

const users = [
  {
    name: "Алексей Руководитель",
    email: "owner@sturm.local",
    role: UserRole.OWNER
  },
  {
    name: "Мария Старший менеджер",
    email: "sales-lead@sturm.local",
    role: UserRole.SALES_LEAD
  },
  {
    name: "Ирина Менеджер магазина",
    email: "store-manager@sturm.local",
    role: UserRole.STORE_MANAGER
  },
  {
    name: "Денис Проектный менеджер",
    email: "project-manager@sturm.local",
    role: UserRole.PROJECT_MANAGER
  },
  {
    name: "Ольга Администратор",
    email: "administrator@sturm.local",
    role: UserRole.ADMINISTRATOR
  }
];

async function main() {
  await client.connect();
  const db = client.db();
  const now = new Date();
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const userCollection = db.collection("User");

  for (const user of users) {
    await userCollection.updateOne(
      { email: user.email },
      {
        $set: {
          name: user.name,
          role: user.role,
          isActive: true,
          passwordHash,
          updatedAt: now
        },
        $setOnInsert: {
          _id: new ObjectId(),
          email: user.email,
          authProviderId: null,
          createdAt: now,
          lastLoginAt: null
        }
      },
      { upsert: true }
    );
  }

  const owner = await userCollection.findOne<{ _id: ObjectId }>({
    email: "owner@sturm.local"
  });

  if (!owner) {
    throw new Error("Owner was not created");
  }

  await db.collection("Client").updateOne(
    { _id: new ObjectId("000000000000000000000001") },
    {
      $set: {
        clientType: "INDIVIDUAL",
        phone: "+7 900 000-00-01",
        email: "client@example.com",
        messenger: null,
        city: "Москва",
        source: "SHOWROOM",
        linkedDesignerId: null,
        status: "NEW",
        responsibleId: owner._id,
        updatedAt: now,
        archivedAt: null,
        lastContactAt: null,
        nextContactAt: null,
        comment: "Seed-запись для проверки dashboard",
        notes: "Seed-запись для проверки dashboard"
      },
      $setOnInsert: {
        _id: new ObjectId("000000000000000000000001"),
        name: "Клиент шоурума",
        createdById: owner._id,
        createdAt: now
      }
    },
    { upsert: true }
  );

  await db.collection("Designer").updateOne(
    { _id: new ObjectId("000000000000000000000002") },
    {
      $set: {
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
        responsibleId: owner._id,
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
        updatedAt: now,
        archivedAt: null,
        comment: "Seed-запись для проверки dashboard",
        notes: "Seed-запись для проверки dashboard"
      },
      $setOnInsert: {
        _id: new ObjectId("000000000000000000000002"),
        name: "Архитектурное бюро Север",
        createdById: owner._id,
        createdAt: now
      }
    },
    { upsert: true }
  );

  await db.collection("ProjectObject").updateOne(
    { _id: new ObjectId("000000000000000000000003") },
    {
      $setOnInsert: {
        _id: new ObjectId("000000000000000000000003"),
        title: "Комплектация апартаментов",
        status: "ACTIVE",
        responsibleId: owner._id,
        createdById: owner._id,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        notes: "Seed-запись для проверки dashboard"
      }
    },
    { upsert: true }
  );

  console.log("Seed completed");
  console.log(`Demo password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await client.close();
  });
