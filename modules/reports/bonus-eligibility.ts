import type { CrmViolation } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { computeBonusEligibilityStatus, crmEntityHref, getActiveViolationsMap, type BonusEligibilityStatus } from "@/modules/crm-discipline/service";
import { canViewAllData, type PermissionUser } from "@/permissions";
import { groupBy, ownerWhere, periodWhere, reportPeriod, type Metric, type ReportSearchParams } from "./common";

export type BonusEligibilityRow = {
  entityType: "CLIENT" | "OBJECT" | "DEAL" | "PROPOSAL";
  entity: string;
  title: string;
  href: string;
  responsibleName: string;
  status: BonusEligibilityStatus;
  violations: string[];
  affectsBonus: boolean;
  detectedAt: Date | null;
};

type RawViolation = Pick<CrmViolation, "violationCode" | "severity" | "message" | "canAffectBonus" | "detectedAt" | "status">;
type InternalBonusEligibilityRow = BonusEligibilityRow & { rawViolations: RawViolation[] };

function violationMatchesFilters(violations: RawViolation[], params: ReportSearchParams) {
  if (!params.violationCode && !params.severity) return true;
  return violations.some((violation) => {
    if (params.violationCode && violation.violationCode !== params.violationCode) return false;
    if (params.severity && violation.severity !== params.severity.toUpperCase()) return false;
    return true;
  });
}

function bonusRow(
  entityType: BonusEligibilityRow["entityType"],
  entity: string,
  id: string,
  title: string,
  responsibleName: string,
  violations: RawViolation[]
): InternalBonusEligibilityRow {
  const status = computeBonusEligibilityStatus(violations);
  return {
    entityType,
    entity,
    title,
    href: crmEntityHref(entityType, id),
    responsibleName,
    status,
    violations: violations.map((violation) => violation.message),
    affectsBonus: violations.some((violation) => violation.canAffectBonus),
    detectedAt: violations[0]?.detectedAt ?? null,
    rawViolations: violations
  };
}

export async function getBonusEligibilityReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const responsibleId = canViewAllData(user) ? params.responsibleId : undefined;
  const owner = ownerWhere(user, responsibleId);
  const entityTypes = (params.entity ? [params.entity] : ["DEAL", "PROPOSAL", "CLIENT", "OBJECT"]) as Array<BonusEligibilityRow["entityType"]>;
  const rows: InternalBonusEligibilityRow[] = [];

  if (entityTypes.includes("DEAL")) {
    const deals = await prisma.deal.findMany({
      where: { AND: [owner, { archivedAt: null, createdAt: periodWhere(from, to) }] },
      include: { responsible: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    });
    const violations = await getActiveViolationsMap("DEAL", deals.map((deal) => deal.id));
    rows.push(...deals.map((deal) => bonusRow("DEAL", "Сделка", deal.id, deal.title, deal.responsible.name, violations.get(deal.id) ?? [])));
  }

  if (entityTypes.includes("PROPOSAL")) {
    const proposals = await prisma.commercialProposal.findMany({
      where: { AND: [owner, { archivedAt: null, createdAt: periodWhere(from, to) }] },
      include: { responsible: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    });
    const violations = await getActiveViolationsMap("PROPOSAL", proposals.map((proposal) => proposal.id));
    rows.push(...proposals.map((proposal) => bonusRow("PROPOSAL", "КП", proposal.id, proposal.proposalNumber, proposal.responsible.name, violations.get(proposal.id) ?? [])));
  }

  if (entityTypes.includes("CLIENT")) {
    const clients = await prisma.client.findMany({
      where: { AND: [owner, { archivedAt: null, createdAt: periodWhere(from, to) }] },
      include: { responsible: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    });
    const violations = await getActiveViolationsMap("CLIENT", clients.map((client) => client.id));
    rows.push(...clients.map((client) => bonusRow("CLIENT", "Клиент", client.id, client.name, client.responsible.name, violations.get(client.id) ?? [])));
  }

  if (entityTypes.includes("OBJECT")) {
    const objects = await prisma.projectObject.findMany({
      where: { AND: [owner, { archivedAt: null, createdAt: periodWhere(from, to) }] },
      include: { responsible: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    });
    const violations = await getActiveViolationsMap("OBJECT", objects.map((object) => object.id));
    rows.push(...objects.map((object) => bonusRow("OBJECT", "Объект", object.id, object.title, object.responsible.name, violations.get(object.id) ?? [])));
  }

  const filtered = rows.filter((row) => {
    if (params.bonusStatus && row.status !== params.bonusStatus) return false;
    if (!violationMatchesFilters(row.rawViolations, params)) return false;
    return true;
  });

  return {
    period: { from, to },
    rows: filtered,
    metrics: [
      { title: "Всего записей", value: filtered.length },
      { title: "Учитываются", value: filtered.filter((row) => row.status === "ELIGIBLE").length, tone: "secondary" as const },
      { title: "Требуют исправления", value: filtered.filter((row) => row.status === "NEEDS_FIX").length, tone: "warning" as const },
      { title: "Не учитываются", value: filtered.filter((row) => row.status === "NOT_ELIGIBLE").length, tone: "warning" as const },
      { title: "С нарушениями премирования", value: filtered.filter((row) => row.affectsBonus).length, tone: "warning" as const }
    ] satisfies Metric[],
    byEntity: groupBy(filtered.map((row) => row.entity)),
    byStatus: groupBy(filtered.map((row) => row.status))
  };
}
