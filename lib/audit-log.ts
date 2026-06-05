import type { AuditEntityType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
  return prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      action,
      userId,
      before: before ?? undefined,
      after: after ?? undefined
    }
  });
}

export async function getAuditLogs(entityType: AuditEntityType, entityId: string) {
  return prisma.auditLog.findMany({
    where: {
      entityType,
      entityId
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
}
