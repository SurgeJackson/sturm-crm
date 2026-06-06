import type { AuditEntityType, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { canViewAllData, type PermissionUser } from "@/permissions";

export async function getActiveViolationsForEntity(entityType: AuditEntityType, entityId: string) {
  return prisma.crmViolation.findMany({
    where: { entityType, entityId, status: "ACTIVE" },
    orderBy: [{ severity: "asc" }, { detectedAt: "desc" }],
    include: { responsible: { select: { id: true, name: true, email: true } } }
  });
}

export async function getActiveViolationsMap(entityType: AuditEntityType, entityIds: string[]) {
  if (entityIds.length === 0) return new Map<string, Awaited<ReturnType<typeof getActiveViolationsForEntity>>>();
  const rows = await prisma.crmViolation.findMany({
    where: { entityType, entityId: { in: entityIds }, status: "ACTIVE" },
    orderBy: [{ severity: "asc" }, { detectedAt: "desc" }],
    include: { responsible: { select: { id: true, name: true, email: true } } }
  });
  return rows.reduce<Map<string, typeof rows>>((acc, row) => {
    acc.set(row.entityId, [...(acc.get(row.entityId) ?? []), row]);
    return acc;
  }, new Map());
}

export function violationAccessWhere(user: PermissionUser): Prisma.CrmViolationWhereInput {
  if (canViewAllData(user)) return {};
  return { responsibleId: user.id };
}
