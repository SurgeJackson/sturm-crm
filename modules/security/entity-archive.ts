import type { AuditEntityType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import type { RequestContext } from "@/lib/request-context";
import { writeSecurityLog } from "@/lib/security-log";
import {
  syncClientDiscipline,
  syncDealDiscipline,
  syncDesignerDiscipline,
  syncObjectDiscipline,
  syncProposalDiscipline,
  syncTaskDiscipline
} from "@/modules/crm-discipline/entity-sync";
import { refreshDesignerObjectCounters } from "@/modules/objects/services/designer-counters";

export type ArchivableEntityType = "CLIENT" | "DESIGNER" | "OBJECT" | "DEAL" | "PROPOSAL" | "TASK";

type ArchivableRecord = {
  id: string;
  archivedAt?: Date | null;
  designerId?: string | null;
  status?: string | null;
};

export function entityPath(type: ArchivableEntityType, id: string) {
  const base = {
    CLIENT: "clients",
    DESIGNER: "designers",
    OBJECT: "objects",
    DEAL: "deals",
    PROPOSAL: "proposals",
    TASK: "tasks"
  }[type];
  return `/${base}/${id}`;
}

export async function getArchivableEntity(type: ArchivableEntityType, id: string): Promise<ArchivableRecord | null> {
  switch (type) {
    case "CLIENT":
      return prisma.client.findUnique({ where: { id } });
    case "DESIGNER":
      return prisma.designer.findUnique({ where: { id } });
    case "OBJECT":
      return prisma.projectObject.findUnique({ where: { id } });
    case "DEAL":
      return prisma.deal.findUnique({ where: { id } });
    case "PROPOSAL":
      return prisma.commercialProposal.findUnique({ where: { id } });
    case "TASK":
      return prisma.taskActivity.findUnique({ where: { id } });
  }
}

async function updateArchiveState(type: ArchivableEntityType, id: string, archivedAt: Date | null) {
  switch (type) {
    case "CLIENT":
      return prisma.client.update({ where: { id }, data: { archivedAt, status: archivedAt ? "ARCHIVED" : "ACTIVE" } });
    case "DESIGNER":
      return prisma.designer.update({ where: { id }, data: { archivedAt, status: archivedAt ? "ARCHIVED" : "ACTIVE" } });
    case "OBJECT":
      return prisma.projectObject.update({ where: { id }, data: { archivedAt, status: archivedAt ? "ARCHIVED" : "ACTIVE" } });
    case "DEAL":
      return prisma.deal.update({ where: { id }, data: { archivedAt } });
    case "PROPOSAL":
      return prisma.commercialProposal.update({ where: { id }, data: { archivedAt } });
    case "TASK":
      return prisma.taskActivity.update({ where: { id }, data: { archivedAt } });
  }
}

async function syncArchivedEntity(type: ArchivableEntityType, id: string, userId: string) {
  switch (type) {
    case "CLIENT":
      return syncClientDiscipline(id, userId);
    case "DESIGNER":
      return syncDesignerDiscipline(id, userId);
    case "OBJECT":
      return syncObjectDiscipline(id, userId);
    case "DEAL":
      return syncDealDiscipline(id, userId);
    case "PROPOSAL":
      return syncProposalDiscipline(id, userId);
    case "TASK":
      return syncTaskDiscipline(id, userId);
  }
}

function objectDesignerId(entity: unknown) {
  return typeof entity === "object" && entity !== null && "designerId" in entity
    ? String(entity.designerId ?? "")
    : null;
}

export async function archiveEntity(type: ArchivableEntityType, id: string, userId: string, context: RequestContext = {}) {
  const before = await getArchivableEntity(type, id);
  if (!before) return null;
  const after = await updateArchiveState(type, id, new Date());
  await writeAuditLog({ entityType: type as AuditEntityType, entityId: id, action: "ARCHIVE", userId, before, after });
  await writeSecurityLog({ action: "ARCHIVE_ENTITY", userId, entityType: type as AuditEntityType, entityId: id, ipAddress: context.ipAddress, userAgent: context.userAgent });
  if (type === "OBJECT") await refreshDesignerObjectCounters(objectDesignerId(after));
  await syncArchivedEntity(type, id, userId);
  return after;
}

export async function restoreEntity(type: ArchivableEntityType, id: string, userId: string, context: RequestContext = {}) {
  const before = await getArchivableEntity(type, id);
  if (!before) return null;
  const after = await updateArchiveState(type, id, null);
  await writeAuditLog({ entityType: type as AuditEntityType, entityId: id, action: "RESTORE", userId, before, after });
  await writeSecurityLog({ action: "RESTORE_ENTITY", userId, entityType: type as AuditEntityType, entityId: id, ipAddress: context.ipAddress, userAgent: context.userAgent });
  if (type === "OBJECT") await refreshDesignerObjectCounters(objectDesignerId(after));
  await syncArchivedEntity(type, id, userId);
  return after;
}
