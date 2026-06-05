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
      $setOnInsert: {
        _id: new ObjectId("000000000000000000000001"),
        name: "Клиент шоурума",
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

  await db.collection("Designer").updateOne(
    { _id: new ObjectId("000000000000000000000002") },
    {
      $setOnInsert: {
        _id: new ObjectId("000000000000000000000002"),
        name: "Архитектурное бюро Север",
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
