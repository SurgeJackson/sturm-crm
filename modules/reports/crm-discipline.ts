import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { crmEntityHref, violationAccessWhere } from "@/modules/crm-discipline/service";
import { canViewAllData, type PermissionUser } from "@/permissions";
import { entityArea, entityLabel, groupBy, periodWhere, reportPeriod, scoreRows, type ProblemRow, type ReportSearchParams } from "./common";

export async function getCrmDisciplineReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const filters: Prisma.CrmViolationWhereInput[] = [
    violationAccessWhere(user),
    { status: "ACTIVE", detectedAt: periodWhere(from, to) }
  ];
  if (canViewAllData(user) && params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.entity) filters.push({ entityType: params.entity as never });
  if (params.violationCode) filters.push({ violationCode: params.violationCode });
  if (params.severity) filters.push({ severity: params.severity.toUpperCase() as never });

  const activeWhere: Prisma.CrmViolationWhereInput = { AND: filters };
  const resolvedWhere: Prisma.CrmViolationWhereInput = {
    AND: [
      violationAccessWhere(user),
      { status: "RESOLVED", resolvedAt: periodWhere(from, to) },
      ...(canViewAllData(user) && params.responsibleId ? [{ responsibleId: params.responsibleId }] : [])
    ]
  };
  const [violations, resolved] = await Promise.all([
    prisma.crmViolation.findMany({
      where: activeWhere,
      orderBy: [{ severity: "asc" }, { detectedAt: "desc" }],
      include: { responsible: { select: { id: true, name: true } } }
    }),
    prisma.crmViolation.findMany({
      where: resolvedWhere,
      orderBy: { resolvedAt: "desc" },
      select: { resolvedAt: true, violationCode: true, responsible: { select: { id: true, name: true } } }
    })
  ]);

  const problems: ProblemRow[] = violations.map((violation) => ({
    area: entityArea(violation.entityType),
    issue: violation.message,
    severity: violation.severity === "CRITICAL" ? "critical" : violation.severity === "MEDIUM" ? "medium" : "light",
    responsibleId: violation.responsibleId,
    responsibleName: violation.responsible?.name ?? "Не назначен",
    entity: entityLabel(violation.entityType),
    title: violation.entityId,
    href: crmEntityHref(violation.entityType, violation.entityId),
    violationCode: violation.violationCode,
    canAffectBonus: violation.canAffectBonus,
    detectedAt: violation.detectedAt
  }));

  const byEmployee = Object.values(violations.reduce<Record<string, { name: string; total: number; critical: number; medium: number; low: number; bonus: number }>>((acc, violation) => {
    const id = violation.responsibleId ?? "unknown";
    acc[id] ??= { name: violation.responsible?.name ?? "Не назначен", total: 0, critical: 0, medium: 0, low: 0, bonus: 0 };
    acc[id].total += 1;
    if (violation.severity === "CRITICAL") acc[id].critical += 1;
    if (violation.severity === "MEDIUM") acc[id].medium += 1;
    if (violation.severity === "LOW") acc[id].low += 1;
    if (violation.canAffectBonus) acc[id].bonus += 1;
    return acc;
  }, {})).sort((a, b) => b.total - a.total);

  const byEntity = Object.entries(groupBy(violations.map((violation) => entityLabel(violation.entityType))))
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
  const frequent = Object.entries(groupBy(violations.map((violation) => violation.violationCode)))
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
  const resolvedDynamics = Object.entries(groupBy(resolved.map((violation) => violation.resolvedAt?.toISOString().slice(0, 10))))
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    period: { from, to },
    problems,
    scores: scoreRows(problems),
    summary: {
      active: violations.length,
      critical: violations.filter((violation) => violation.severity === "CRITICAL").length,
      medium: violations.filter((violation) => violation.severity === "MEDIUM").length,
      low: violations.filter((violation) => violation.severity === "LOW").length,
      bonus: violations.filter((violation) => violation.canAffectBonus).length,
      resolved: resolved.length
    },
    byEmployee,
    byEntity,
    frequent,
    resolvedDynamics
  };
}
