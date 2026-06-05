import { ObjectId } from "mongodb";
import type { AuditEntityType } from "@prisma/client";
import { getMongoDb } from "@/db/mongo";

type WriteAuditLogInput = {
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  userId: string;
  before?: unknown;
  after?: unknown;
};

export async function writeAuditLog({
  entityType,
  entityId,
  action,
  userId,
  before,
  after
}: WriteAuditLogInput) {
  const db = await getMongoDb();

  return db.collection("AuditLog").insertOne({
    _id: new ObjectId(),
    entityType,
    entityId,
    action,
    userId: new ObjectId(userId),
    before: before ?? null,
    after: after ?? null,
    createdAt: new Date()
  });
}

export async function getAuditLogs(entityType: AuditEntityType, entityId: string) {
  const db = await getMongoDb();

  return db
    .collection("AuditLog")
    .find({
      entityType,
      entityId
    })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
}
