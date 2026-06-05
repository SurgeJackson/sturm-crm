import { AuditEntityType, EntityStatus, TaskStatus, UserRole } from "@/generated/prisma/client";

export const crmRoles = UserRole;
export const crmEntityStatuses = EntityStatus;
export const crmTaskStatuses = TaskStatus;
export const crmAuditEntityTypes = AuditEntityType;

export const crmEntityNames = [
  "Client",
  "Designer",
  "ProjectObject",
  "Deal",
  "CommercialProposal",
  "TaskActivity",
  "AuditLog",
  "User"
] as const;

export type CrmEntityName = (typeof crmEntityNames)[number];
