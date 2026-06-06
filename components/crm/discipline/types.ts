import type { AuditEntityType, CrmViolationSeverity, CrmViolationStatus } from "@/generated/prisma/client";

export type CrmViolationView = {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  violationCode: string;
  severity: CrmViolationSeverity;
  message: string;
  responsibleId: string | null;
  detectedAt: Date;
  status: CrmViolationStatus;
  canAffectBonus: boolean;
  responsible?: { id: string; name: string; email?: string | null } | null;
};
