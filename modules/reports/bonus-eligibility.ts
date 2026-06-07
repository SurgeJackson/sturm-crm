import type { CrmViolation } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { enumParam, upperEnumParam } from "@/modules/crm/param-parsing";
import { computeBonusEligibilityStatus, crmEntityHref, crmViolationSeverityLabels, type BonusEligibilityStatus } from "@/modules/crm-discipline/bonus";
import { getActiveViolationsMap } from "@/modules/crm-discipline/queries";
import type { PermissionUser } from "@/permissions";
import { groupBy, periodWhere, reportOwnerWhere, reportPeriod, type Metric, type ReportSearchParams } from "./common";

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
type BonusEntityRecord = {
  id: string;
  title: string;
  responsible: { name: string };
};
type BonusEntityConfig = {
  entityType: BonusEligibilityRow["entityType"];
  entity: string;
  load: (owner: ReturnType<typeof reportOwnerWhere>, createdAt: ReturnType<typeof periodWhere>, ids?: string[]) => Promise<BonusEntityRecord[]>;
};

const bonusEntityTypeLabels: Record<BonusEligibilityRow["entityType"], string> = {
  CLIENT: "Клиент",
  OBJECT: "Объект",
  DEAL: "Сделка",
  PROPOSAL: "КП"
};

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

const bonusEntityConfigs: BonusEntityConfig[] = [
  {
    entityType: "DEAL",
    entity: "Сделка",
    load: (owner, createdAt, ids) => prisma.deal.findMany({
      where: { AND: [owner, { archivedAt: null, createdAt }, ids ? { id: { in: ids } } : {}] },
      select: { id: true, title: true, responsible: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    })
  },
  {
    entityType: "PROPOSAL",
    entity: "КП",
    load: async (owner, createdAt, ids) => {
      const proposals = await prisma.commercialProposal.findMany({
        where: { AND: [owner, { archivedAt: null, createdAt }, ids ? { id: { in: ids } } : {}] },
        select: { id: true, proposalNumber: true, responsible: { select: { name: true } } },
        orderBy: { createdAt: "desc" }
      });
      return proposals.map((proposal) => ({
        id: proposal.id,
        title: proposal.proposalNumber,
        responsible: proposal.responsible
      }));
    }
  },
  {
    entityType: "CLIENT",
    entity: "Клиент",
    load: (owner, createdAt, ids) => prisma.client.findMany({
      where: { AND: [owner, { archivedAt: null, createdAt }, ids ? { id: { in: ids } } : {}] },
      select: { id: true, name: true, responsible: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    }).then((clients) => clients.map((client) => ({
      id: client.id,
      title: client.name,
      responsible: client.responsible
    })))
  },
  {
    entityType: "OBJECT",
    entity: "Объект",
    load: (owner, createdAt, ids) => prisma.projectObject.findMany({
      where: { AND: [owner, { archivedAt: null, createdAt }, ids ? { id: { in: ids } } : {}] },
      select: { id: true, title: true, responsible: { select: { name: true } } },
      orderBy: { createdAt: "desc" }
    })
  }
];

async function bonusRowsForEntity(
  config: BonusEntityConfig,
  owner: ReturnType<typeof reportOwnerWhere>,
  createdAt: ReturnType<typeof periodWhere>,
  ids?: string[]
) {
  const records = await config.load(owner, createdAt, ids);
  const violations = await getActiveViolationsMap(config.entityType, records.map((record) => record.id));
  return records.map((record) => bonusRow(
    config.entityType,
    config.entity,
    record.id,
    record.title,
    record.responsible.name,
    violations.get(record.id) ?? []
  ));
}

export async function getBonusEligibilityReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const owner = reportOwnerWhere(user, params);
  const entityType = enumParam(params.entity, bonusEntityTypeLabels);
  const severity = upperEnumParam(params.severity, crmViolationSeverityLabels);
  const entityTypes = entityType ? [entityType] : ["DEAL", "PROPOSAL", "CLIENT", "OBJECT"] satisfies Array<BonusEligibilityRow["entityType"]>;
  const createdAt = periodWhere(from, to);
  const idsByEntity = new Map<BonusEligibilityRow["entityType"], string[]>();
  const restrictByViolation = Boolean(params.violationCode || severity);

  if (restrictByViolation) {
    const violations = await prisma.crmViolation.findMany({
      where: {
        status: "ACTIVE",
        entityType: { in: entityTypes },
        ...(params.violationCode ? { violationCode: params.violationCode } : {}),
        ...(severity ? { severity } : {})
      },
      select: { entityType: true, entityId: true }
    });
    for (const violation of violations) {
      const type = violation.entityType as BonusEligibilityRow["entityType"];
      idsByEntity.set(type, [...(idsByEntity.get(type) ?? []), violation.entityId]);
    }
    if (violations.length === 0) {
      return {
        period: { from, to },
        rows: [],
        metrics: [
          { title: "Всего записей", value: 0 },
          { title: "Учитываются", value: 0, tone: "secondary" as const },
          { title: "Требуют исправления", value: 0, tone: "warning" as const },
          { title: "Не учитываются", value: 0, tone: "warning" as const },
          { title: "С нарушениями премирования", value: 0, tone: "warning" as const }
        ] satisfies Metric[],
        byEntity: {},
        byStatus: {}
      };
    }
  }

  const rows = (await Promise.all(
    bonusEntityConfigs
      .filter((config) => entityTypes.includes(config.entityType))
      .map((config) => bonusRowsForEntity(config, owner, createdAt, restrictByViolation ? idsByEntity.get(config.entityType) ?? [] : undefined))
  )).flat();

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
