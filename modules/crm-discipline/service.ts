import type {
  AuditEntityType,
  CrmViolation,
  CrmViolationSeverity,
  Prisma
} from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { toAuditValue } from "@/modules/crm/form-utils";
import {
  validateClientForDiscipline,
  validateDealForDiscipline,
  validateDesignerForDiscipline,
  validateObjectForDiscipline,
  validateProposalForDiscipline,
  validateTaskForDiscipline,
  type CrmViolationDraft
} from "@/modules/crm-discipline/rules";
import { canViewAllData, type PermissionUser } from "@/permissions";

export type BonusEligibilityStatus = "ELIGIBLE" | "NEEDS_FIX" | "NOT_ELIGIBLE" | "NOT_APPLICABLE";

export const crmViolationSeverityLabels: Record<CrmViolationSeverity, string> = {
  CRITICAL: "Критическое",
  MEDIUM: "Среднее",
  LOW: "Легкое"
};

export const bonusEligibilityLabels: Record<BonusEligibilityStatus, string> = {
  ELIGIBLE: "Учитывается",
  NEEDS_FIX: "Требует исправления",
  NOT_ELIGIBLE: "Не учитывается",
  NOT_APPLICABLE: "Не применяется"
};

const bonusEntityTypes = new Set<AuditEntityType>(["CLIENT", "OBJECT", "DEAL", "PROPOSAL"]);

function normalizeSeverity(severity: CrmViolationDraft["severity"]): CrmViolationSeverity {
  return severity.toUpperCase() as CrmViolationSeverity;
}

export function computeBonusEligibilityStatus(
  violations: Array<Pick<CrmViolation, "severity" | "canAffectBonus" | "status">> | CrmViolationDraft[],
  applies = true
): BonusEligibilityStatus {
  if (!applies) return "NOT_APPLICABLE";

  const activeBonusViolations = violations.filter((violation) => {
    const status = "status" in violation ? violation.status : "ACTIVE";
    return status === "ACTIVE" && violation.canAffectBonus;
  });

  if (activeBonusViolations.some((violation) => violation.severity === "CRITICAL" || violation.severity === "critical")) return "NOT_ELIGIBLE";
  if (activeBonusViolations.some((violation) => violation.severity === "MEDIUM" || violation.severity === "medium")) return "NEEDS_FIX";
  return "ELIGIBLE";
}

export function crmDisciplineStatus(violations: Array<Pick<CrmViolation, "severity" | "status">>) {
  const active = violations.filter((violation) => violation.status === "ACTIVE");
  if (active.some((violation) => violation.severity === "CRITICAL")) return "critical" as const;
  if (active.length > 0) return "needs_fix" as const;
  return "correct" as const;
}

export function crmEntityHref(entityType: AuditEntityType, entityId: string) {
  const prefixes: Partial<Record<AuditEntityType, string>> = {
    CLIENT: "/clients",
    DESIGNER: "/designers",
    OBJECT: "/objects",
    DEAL: "/deals",
    PROPOSAL: "/proposals",
    TASK: "/tasks"
  };
  return `${prefixes[entityType] ?? "/reports/crm-discipline"}/${entityId}`;
}

async function logViolationCreation(violation: CrmViolation, actorId?: string | null) {
  const userId = actorId ?? violation.responsibleId;
  if (!userId) return;
  await writeAuditLog({
    entityType: "CRM_VIOLATION",
    entityId: violation.id,
    action: "CREATE_CRM_VIOLATION",
    userId,
    after: toAuditValue(violation)
  });
}

async function logViolationResolution(before: CrmViolation, after: CrmViolation, actorId?: string | null) {
  const userId = actorId ?? after.responsibleId;
  if (!userId) return;
  await writeAuditLog({
    entityType: "CRM_VIOLATION",
    entityId: after.id,
    action: after.status === "IGNORED" ? "IGNORE_CRM_VIOLATION" : "RESOLVE_CRM_VIOLATION",
    userId,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });
}

async function logBonusEligibilityChange(
  entityType: AuditEntityType,
  entityId: string,
  before: BonusEligibilityStatus,
  after: BonusEligibilityStatus,
  actorId?: string | null
) {
  if (before === after || !actorId || !bonusEntityTypes.has(entityType)) return;
  await writeAuditLog({
    entityType,
    entityId,
    action: "CHANGE_BONUS_ELIGIBILITY_STATUS",
    userId: actorId,
    before: { bonusEligibilityStatus: before },
    after: { bonusEligibilityStatus: after }
  });
}

export async function syncViolationsForEntity(
  entityType: AuditEntityType,
  entityId: string,
  drafts: CrmViolationDraft[],
  actorId?: string | null
) {
  const activeBefore = await prisma.crmViolation.findMany({
    where: { entityType, entityId, status: "ACTIVE" }
  });
  const beforeBonusStatus = computeBonusEligibilityStatus(activeBefore, bonusEntityTypes.has(entityType));
  const nextByCode = new Map(drafts.map((draft) => [draft.code, draft]));
  const activeByCode = new Map(activeBefore.map((violation) => [violation.violationCode, violation]));
  const created: CrmViolation[] = [];
  const resolved: CrmViolation[] = [];

  for (const draft of drafts) {
    const existing = activeByCode.get(draft.code);
    if (existing) {
      const severity = normalizeSeverity(draft.severity);
      if (
        existing.severity !== severity ||
        existing.message !== draft.message ||
        existing.responsibleId !== draft.responsibleId ||
        existing.canAffectBonus !== draft.canAffectBonus
      ) {
        await prisma.crmViolation.update({
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

    const violation = await prisma.crmViolation.create({
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
    created.push(violation);
    await logViolationCreation(violation, actorId);
  }

  for (const violation of activeBefore) {
    if (nextByCode.has(violation.violationCode)) continue;
    const after = await prisma.crmViolation.update({
      where: { id: violation.id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
        resolvedById: actorId ?? undefined
      }
    });
    resolved.push(after);
    await logViolationResolution(violation, after, actorId);
  }

  const afterBonusStatus = computeBonusEligibilityStatus(drafts, bonusEntityTypes.has(entityType));
  await logBonusEligibilityChange(entityType, entityId, beforeBonusStatus, afterBonusStatus, actorId);

  return { created: created.length, resolved: resolved.length, active: drafts.length };
}

export async function expireViolationsForEntity(entityType: AuditEntityType, entityId: string, actorId?: string | null) {
  const active = await prisma.crmViolation.findMany({ where: { entityType, entityId, status: "ACTIVE" } });
  for (const violation of active) {
    const after = await prisma.crmViolation.update({
      where: { id: violation.id },
      data: { status: "EXPIRED", resolvedAt: new Date(), resolvedById: actorId ?? undefined }
    });
    await logViolationResolution(violation, after, actorId);
  }
  return active.length;
}

export async function syncClientDiscipline(clientId: string, actorId?: string | null) {
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return { created: 0, resolved: 0, active: 0 };
  if (client.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("CLIENT", client.id, actorId), active: 0 };
  return syncViolationsForEntity("CLIENT", client.id, validateClientForDiscipline(client), actorId);
}

export async function syncDesignerDiscipline(designerId: string, actorId?: string | null) {
  const designer = await prisma.designer.findUnique({ where: { id: designerId } });
  if (!designer) return { created: 0, resolved: 0, active: 0 };
  if (designer.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("DESIGNER", designer.id, actorId), active: 0 };
  return syncViolationsForEntity("DESIGNER", designer.id, validateDesignerForDiscipline(designer), actorId);
}

export async function syncObjectDiscipline(objectId: string, actorId?: string | null) {
  const object = await prisma.projectObject.findUnique({
    where: { id: objectId },
    include: { tasks: { select: { archivedAt: true, status: true, autoRule: true } } }
  });
  if (!object) return { created: 0, resolved: 0, active: 0 };
  if (object.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("OBJECT", object.id, actorId), active: 0 };
  return syncViolationsForEntity("OBJECT", object.id, validateObjectForDiscipline(object), actorId);
}

export async function syncDealDiscipline(dealId: string, actorId?: string | null) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId } });
  if (!deal) return { created: 0, resolved: 0, active: 0 };
  if (deal.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("DEAL", deal.id, actorId), active: 0 };
  return syncViolationsForEntity("DEAL", deal.id, validateDealForDiscipline(deal), actorId);
}

export async function syncProposalDiscipline(proposalId: string, actorId?: string | null) {
  const proposal = await prisma.commercialProposal.findUnique({ where: { id: proposalId } });
  if (!proposal) return { created: 0, resolved: 0, active: 0 };
  if (proposal.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("PROPOSAL", proposal.id, actorId), active: 0 };
  return syncViolationsForEntity("PROPOSAL", proposal.id, validateProposalForDiscipline(proposal), actorId);
}

export async function syncTaskDiscipline(taskId: string, actorId?: string | null) {
  const task = await prisma.taskActivity.findUnique({ where: { id: taskId } });
  if (!task) return { created: 0, resolved: 0, active: 0 };
  if (task.archivedAt) return { created: 0, resolved: await expireViolationsForEntity("TASK", task.id, actorId), active: 0 };
  return syncViolationsForEntity("TASK", task.id, validateTaskForDiscipline(task), actorId);
}

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

export async function runCrmDisciplineCheck(actorId?: string | null) {
  const [clients, designers, objects, deals, proposals, tasks] = await Promise.all([
    prisma.client.findMany({ where: { archivedAt: null } }),
    prisma.designer.findMany({ where: { archivedAt: null } }),
    prisma.projectObject.findMany({ where: { archivedAt: null }, include: { tasks: { select: { archivedAt: true, status: true, autoRule: true } } } }),
    prisma.deal.findMany({ where: { archivedAt: null } }),
    prisma.commercialProposal.findMany({ where: { archivedAt: null } }),
    prisma.taskActivity.findMany({ where: { archivedAt: null } })
  ]);

  const results: Array<{ created: number; resolved: number; active: number }> = [];
  for (const client of clients) results.push(await syncViolationsForEntity("CLIENT", client.id, validateClientForDiscipline(client), actorId));
  for (const designer of designers) results.push(await syncViolationsForEntity("DESIGNER", designer.id, validateDesignerForDiscipline(designer), actorId));
  for (const object of objects) results.push(await syncViolationsForEntity("OBJECT", object.id, validateObjectForDiscipline(object), actorId));
  for (const deal of deals) results.push(await syncViolationsForEntity("DEAL", deal.id, validateDealForDiscipline(deal), actorId));
  for (const proposal of proposals) results.push(await syncViolationsForEntity("PROPOSAL", proposal.id, validateProposalForDiscipline(proposal), actorId));
  for (const task of tasks) results.push(await syncViolationsForEntity("TASK", task.id, validateTaskForDiscipline(task), actorId));

  return results.reduce(
    (acc: { checked: number; created: number; resolved: number; active: number }, item) => ({
      checked: acc.checked + 1,
      created: acc.created + item.created,
      resolved: acc.resolved + item.resolved,
      active: acc.active + item.active
    }),
    { checked: 0, created: 0, resolved: 0, active: 0 }
  );
}
