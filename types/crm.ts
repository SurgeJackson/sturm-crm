import type { AuditEntityType, EntityStatus, TaskStatus, UserRole } from "@prisma/client";

export type CrmUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
};

export type BaseCrmEntity = {
  id: string;
  title?: string;
  name?: string;
  status: EntityStatus | TaskStatus;
  responsibleId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  archivedAt: Date | null;
  notes: string | null;
};

export type AuditLogPayload = {
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  userId: string;
  before?: unknown;
  after?: unknown;
};
