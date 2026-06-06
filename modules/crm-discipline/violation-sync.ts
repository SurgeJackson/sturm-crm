import {
  Prisma,
  type AuditEntityType,
  type CrmViolation,
  type CrmViolationSeverity
} from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { toAuditValue } from "@/modules/crm/form-utils";
import {
  bonusEntityTypes,
  computeBonusEligibilityStatus,
  type BonusEligibilityStatus
} from "@/modules/crm-discipline/bonus";
import type { CrmViolationDraft, DisciplineRuleOptions } from "@/modules/crm-discipline/rules";

export type CrmDisciplineSyncOptions = DisciplineRuleOptions & {
  batchSize?: number;
};

export const DEFAULT_DISCIPLINE_BATCH_SIZE = 25;

type DisciplineTx = Prisma.TransactionClient;

function normalizeSeverity(severity: CrmViolationDraft["severity"]): CrmViolationSeverity {
  return severity.toUpperCase() as CrmViolationSeverity;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function logViolationCreation(violation: CrmViolation, actorId?: string | null, client?: DisciplineTx) {
  const userId = actorId ?? violation.responsibleId;
  if (!userId) return;
  await writeAuditLog({
    entityType: "CRM_VIOLATION",
    entityId: violation.id,
    action: "CREATE_CRM_VIOLATION",
    userId,
    after: toAuditValue(violation)
  }, client);
}

async function logViolationResolution(before: CrmViolation, after: CrmViolation, actorId?: string | null, client?: DisciplineTx) {
  const userId = actorId ?? after.responsibleId;
  if (!userId) return;
  await writeAuditLog({
    entityType: "CRM_VIOLATION",
    entityId: after.id,
    action: after.status === "IGNORED" ? "IGNORE_CRM_VIOLATION" : "RESOLVE_CRM_VIOLATION",
    userId,
    before: toAuditValue(before),
    after: toAuditValue(after)
  }, client);
}

async function logBonusEligibilityChange(
  entityType: AuditEntityType,
  entityId: string,
  before: BonusEligibilityStatus,
  after: BonusEligibilityStatus,
  actorId?: string | null,
  client?: DisciplineTx
) {
  if (before === after || !actorId || !bonusEntityTypes.has(entityType)) return;
  await writeAuditLog({
    entityType,
    entityId,
    action: "CHANGE_BONUS_ELIGIBILITY_STATUS",
    userId: actorId,
    before: { bonusEligibilityStatus: before },
    after: { bonusEligibilityStatus: after }
  }, client);
}

export async function syncViolationsForEntity(
  entityType: AuditEntityType,
  entityId: string,
  drafts: CrmViolationDraft[],
  actorId?: string | null
) {
  const sync = () => prisma.$transaction(async (tx) => {
    const activeBefore = await tx.crmViolation.findMany({
      where: { entityType, entityId, status: "ACTIVE" }
    });
    const uniqueDrafts = Array.from(new Map(drafts.map((draft) => [draft.code, draft])).values());
    const beforeBonusStatus = computeBonusEligibilityStatus(activeBefore, bonusEntityTypes.has(entityType));
    const nextByCode = new Map(uniqueDrafts.map((draft) => [draft.code, draft]));
    const activeByCode = new Map(activeBefore.map((violation) => [violation.violationCode, violation]));
    let created = 0;
    let resolved = 0;

    for (const draft of uniqueDrafts) {
      const existing = activeByCode.get(draft.code);
      if (existing) {
        const severity = normalizeSeverity(draft.severity);
        if (
          existing.severity !== severity ||
          existing.message !== draft.message ||
          existing.responsibleId !== draft.responsibleId ||
          existing.canAffectBonus !== draft.canAffectBonus
        ) {
          await tx.crmViolation.update({
            where: { id: existing.id },
            data: {
              severity,
              message: draft.message,
              responsibleId: draft.responsibleId,
              canAffectBonus: draft.canAffectBonus
            }
          });
        }
        continue;
      }

      const violation = await tx.crmViolation.create({
        data: {
          entityType,
          entityId,
          violationCode: draft.code,
          severity: normalizeSeverity(draft.severity),
          message: draft.message,
          responsibleId: draft.responsibleId,
          canAffectBonus: draft.canAffectBonus,
          detectedAt: draft.createdAt
        }
      });
      created += 1;
      await logViolationCreation(violation, actorId, tx);
    }

    for (const violation of activeBefore) {
      if (nextByCode.has(violation.violationCode)) continue;
      const after = await tx.crmViolation.update({
        where: { id: violation.id },
        data: {
          status: "RESOLVED",
          resolvedAt: new Date(),
          resolvedById: actorId ?? undefined
        }
      });
      resolved += 1;
      await logViolationResolution(violation, after, actorId, tx);
    }

    const afterBonusStatus = computeBonusEligibilityStatus(uniqueDrafts, bonusEntityTypes.has(entityType));
    await logBonusEligibilityChange(entityType, entityId, beforeBonusStatus, afterBonusStatus, actorId, tx);

    return { created, resolved, active: uniqueDrafts.length };
  });

  try {
    return await sync();
  } catch (error) {
    if (isUniqueConstraintError(error)) return sync();
    throw error;
  }
}

export async function expireViolationsForEntity(entityType: AuditEntityType, entityId: string, actorId?: string | null) {
  return prisma.$transaction(async (tx) => {
    const active = await tx.crmViolation.findMany({ where: { entityType, entityId, status: "ACTIVE" } });
    for (const violation of active) {
      const after = await tx.crmViolation.update({
        where: { id: violation.id },
        data: { status: "EXPIRED", resolvedAt: new Date(), resolvedById: actorId ?? undefined }
      });
      await logViolationResolution(violation, after, actorId, tx);
    }
    return active.length;
  });
}
