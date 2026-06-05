import { MongoClient, ObjectId } from "mongodb";

const uri = process.env.DATABASE_URL;

if (!uri) {
  throw new Error("DATABASE_URL is not set");
}

const globalForMongo = globalThis as unknown as {
  mongoClient?: MongoClient;
};

export const mongoClient = globalForMongo.mongoClient ?? new MongoClient(uri);

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClient = mongoClient;
}

export async function getMongoDb() {
  await mongoClient.connect();
  return mongoClient.db();
}

export async function updateUserLastLoginAt(userId: string) {
  const db = await getMongoDb();

  await db.collection("User").updateOne(
    { _id: new ObjectId(userId) },
    {
      $set: {
        lastLoginAt: new Date(),
        updatedAt: new Date()
      }
    }
  );
}
