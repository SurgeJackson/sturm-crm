import type { AuditEntityType, Prisma, PrismaClient } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type SecurityLogClient = PrismaClient | Prisma.TransactionClient;

export async function writeSecurityLog({
  action,
  userId,
  entityType,
  entityId,
  metadata,
  client = prisma
}: {
  action: string;
  userId?: string | null;
  entityType?: AuditEntityType;
  entityId?: string;
  metadata?: unknown;
  client?: SecurityLogClient;
}) {
  return client.securityLog.create({
    data: {
      action,
      userId: userId ?? null,
      entityType,
      entityId,
      metadata: metadata === undefined ? undefined : JSON.parse(JSON.stringify(metadata))
    }
  });
}
