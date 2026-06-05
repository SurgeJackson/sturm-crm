import type {
  AuditEntityType,
  ClientSource,
  ClientStatus,
  ClientType,
  DesignerLoyalty,
  DesignerPotential,
  DesignerRelationshipStage,
  DesignerRole,
  DesignerSource,
  EntityStatus,
  TaskStatus,
  UserRole
} from "@/generated/prisma/client";

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

export type ClientFormValues = {
  name: string;
  clientType: ClientType;
  phone?: string;
  email?: string;
  messenger?: string;
  city?: string;
  source: ClientSource;
  linkedDesignerId?: string;
  responsibleId: string;
  status: ClientStatus;
  comment?: string;
  lastContactAt?: string;
  nextContactAt?: string;
};

export type DesignerFormValues = {
  name: string;
  studio?: string;
  role: DesignerRole;
  phone?: string;
  email?: string;
  messenger?: string;
  website?: string;
  city: string;
  specialization: string[];
  projectSegment?: string;
  source: DesignerSource;
  responsibleId: string;
  relationshipStage: DesignerRelationshipStage;
  potential: DesignerPotential;
  loyalty: DesignerLoyalty;
  cooperationTerms?: string;
  firstContactAt?: string;
  lastTouchAt?: string;
  nextStepAt: string;
  nextStepText: string;
  comment?: string;
};
