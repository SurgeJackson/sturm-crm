import type { AuditEntityType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type WriteAuditLogInput = {
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  userId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
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
      before,
      after
    }
  });
}
