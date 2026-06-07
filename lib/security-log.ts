import type { AuditEntityType, Prisma, PrismaClient, SecurityLogSeverity } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type SecurityLogClient = PrismaClient | Prisma.TransactionClient;

function jsonMetadata(metadata: unknown) {
  return metadata === undefined ? undefined : JSON.parse(JSON.stringify(metadata));
}

function metadataWithMissingUserId(metadata: unknown, missingUserId: string) {
  const serialized = jsonMetadata(metadata);
  if (serialized && typeof serialized === "object" && !Array.isArray(serialized)) {
    return { ...serialized, missingUserId };
  }
  return { value: serialized, missingUserId };
}

async function existingSecurityLogUserId(client: SecurityLogClient, userId?: string | null) {
  if (!userId) return null;

  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true }
  });

  return user?.id ?? null;
}

export async function writeSecurityLog({
  action,
  userId,
  entityType,
  entityId,
  metadata,
  ipAddress,
  userAgent,
  severity = "INFO",
  client = prisma
}: {
  action: string;
  userId?: string | null;
  entityType?: AuditEntityType;
  entityId?: string;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  severity?: SecurityLogSeverity;
  client?: SecurityLogClient;
}) {
  const existingUserId = await existingSecurityLogUserId(client, userId);
  return client.securityLog.create({
    data: {
      action,
      userId: existingUserId,
      entityType,
      entityId,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      severity,
      metadata: userId && !existingUserId ? metadataWithMissingUserId(metadata, userId) : jsonMetadata(metadata)
    }
  });
}
