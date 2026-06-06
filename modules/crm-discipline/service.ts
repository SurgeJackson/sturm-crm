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
import { processCursorBatches, type DisciplineSyncResult } from "@/modules/crm-discipline/batch-runner";
import {
  validateClientForDiscipline,
  validateDealForDiscipline,
  validateDesignerForDiscipline,
  validateObjectForDiscipline,
  validateProposalForDiscipline,
  validateTaskForDiscipline,
  type CrmViolationDraft,
  type DisciplineRuleOptions
} from "@/modules/crm-discipline/rules";

export {
  bonusEligibilityLabels,
  computeBonusEligibilityStatus,
  crmDisciplineStatus,
  crmEntityHref,
  crmViolationSeverityLabels,
  type BonusEligibilityStatus
} from "@/modules/crm-discipline/bonus";
export {
  getActiveViolationsForEntity,
  getActiveViolationsMap,
  violationAccessWhere
} from "@/modules/crm-discipline/queries";

export type CrmDisciplineSyncOptions = DisciplineRuleOptions & {
  batchSize?: number;
};

const DEFAULT_DISCIPLINE_BATCH_SIZE = 25;

function normalizeSeverity(severity: CrmViolationDraft["severity"]): CrmViolationSeverity {
  return severity.toUpperCase() as CrmViolationSeverity;
}

type DisciplineTx = Prisma.TransactionClient;

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

export async function syncClientDiscipline(clientId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return { created: 0, resolved: 0, active: 0 };
  if (client.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("CLIENT", client.id, actorId), active: 0 };
  return syncViolationsForEntity("CLIENT", client.id, validateClientForDiscipline(client, options), actorId);
}

export async function syncDesignerDiscipline(designerId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const designer = await prisma.designer.findUnique({ where: { id: designerId } });
  if (!designer) return { created: 0, resolved: 0, active: 0 };
  if (designer.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("DESIGNER", designer.id, actorId), active: 0 };
  return syncViolationsForEntity("DESIGNER", designer.id, validateDesignerForDiscipline(designer, options), actorId);
}

export async function syncObjectDiscipline(objectId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const object = await prisma.projectObject.findUnique({
    where: { id: objectId },
    include: { tasks: { select: { archivedAt: true, status: true, autoRule: true } } }
  });
  if (!object) return { created: 0, resolved: 0, active: 0 };
  if (object.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("OBJECT", object.id, actorId), active: 0 };
  return syncViolationsForEntity("OBJECT", object.id, validateObjectForDiscipline(object, options), actorId);
}

export async function syncDealDiscipline(dealId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { created: 0, resolved: 0, active: 0 };
  if (deal.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("DEAL", deal.id, actorId), active: 0 };
  return syncViolationsForEntity("DEAL", deal.id, validateDealForDiscipline(deal, options), actorId);
}

export async function syncProposalDiscipline(proposalId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const proposal = await prisma.commercialProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) return { created: 0, resolved: 0, active: 0 };
  if (proposal.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("PROPOSAL", proposal.id, actorId), active: 0 };
  return syncViolationsForEntity("PROPOSAL", proposal.id, validateProposalForDiscipline(proposal, options), actorId);
}

export async function syncTaskDiscipline(taskId: string, actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const task = await prisma.taskActivity.findUnique({ where: { id: taskId } });
  if (!task) return { created: 0, resolved: 0, active: 0 };
  if (task.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("TASK", task.id, actorId), active: 0 };
  return syncViolationsForEntity("TASK", task.id, validateTaskForDiscipline(task, options), actorId);
}

export async function runCrmDisciplineCheck(actorId?: string | null, options?: CrmDisciplineSyncOptions) {
  const ruleOptions = { now: options?.now ?? new Date() };
  const batchSize = Math.max(options?.batchSize ?? DEFAULT_DISCIPLINE_BATCH_SIZE, 1);

  const results = await Promise.all([
    processCursorBatches(
      (cursorId) => prisma.client.findMany({
        where: { archivedAt: null },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (client) => syncViolationsForEntity("CLIENT", client.id, validateClientForDiscipline(client, ruleOptions), actorId)
    ),
    processCursorBatches(
      (cursorId) => prisma.designer.findMany({
        where: { archivedAt: null },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (designer) => syncViolationsForEntity("DESIGNER", designer.id, validateDesignerForDiscipline(designer, ruleOptions), actorId)
    ),
    processCursorBatches(
      (cursorId) => prisma.projectObject.findMany({
        where: { archivedAt: null },
        include: { tasks: { select: { archivedAt: true, status: true, autoRule: true } } },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (object) => syncViolationsForEntity("OBJECT", object.id, validateObjectForDiscipline(object, ruleOptions), actorId)
    ),
    processCursorBatches(
      (cursorId) => prisma.deal.findMany({
        where: { archivedAt: null },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (deal) => syncViolationsForEntity("DEAL", deal.id, validateDealForDiscipline(deal, ruleOptions), actorId)
    ),
    processCursorBatches(
      (cursorId) => prisma.commercialProposal.findMany({
        where: { archivedAt: null },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (proposal) => syncViolationsForEntity("PROPOSAL", proposal.id, validateProposalForDiscipline(proposal, ruleOptions), actorId)
    ),
    processCursorBatches(
      (cursorId) => prisma.taskActivity.findMany({
        where: { archivedAt: null },
        orderBy: { id: "asc" },
        take: batchSize,
        ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {})
      }),
      (task) => syncViolationsForEntity("TASK", task.id, validateTaskForDiscipline(task, ruleOptions), actorId)
    )
  ]);

  return results.reduce(
    (acc, item) => ({
      checked: acc.checked + item.checked,
      created: acc.created + item.created,
      resolved: acc.resolved + item.resolved,
      active: acc.active + item.active
    }),
    { checked: 0, created: 0, resolved: 0, active: 0 }
  );
}
