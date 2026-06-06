import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { ownerRecordWhere } from "@/modules/crm/access-where";
import { reportPeriodFromParams } from "@/modules/crm/date-ranges";
import type { BonusEligibilityStatus } from "@/modules/crm-discipline/service";
import { canViewAllData, type PermissionUser } from "@/permissions";

export type ReportSearchParams = {
  from?: string;
  to?: string;
  responsibleId?: string;
  role?: string;
  status?: string;
  stage?: string;
  source?: string;
  probability?: string;
  designerId?: string;
  objectId?: string;
  clientId?: string;
  city?: string;
  type?: string;
  actionType?: string;
  severity?: string;
  entity?: string;
  violationCode?: string;
  bonusStatus?: BonusEligibilityStatus;
};

export type Metric = {
  title: string;
  value: string | number;
  tone?: "default" | "secondary" | "warning" | "outline";
};

export type ProblemRow = {
  area: string;
  issue: string;
  severity: "critical" | "medium" | "light";
  responsibleId: string | null;
  responsibleName: string;
  entity: string;
  title: string;
  href: string;
  violationCode?: string;
  canAffectBonus?: boolean;
  detectedAt?: Date;
};

export function reportPeriod(params: ReportSearchParams) {
  return reportPeriodFromParams(params);
}

export function ownerWhere(user: PermissionUser, responsibleId?: string) {
  return ownerRecordWhere(user, responsibleId);
}

export function taskOwnerWhere(user: PermissionUser, responsibleId?: string) {
  return ownerRecordWhere<Prisma.TaskActivityWhereInput>(user, responsibleId);
}

export function reportResponsibleId(params: ReportSearchParams, user: PermissionUser) {
  return canViewAllData(user) ? params.responsibleId : undefined;
}

export function reportOwnerWhere(user: PermissionUser, params: ReportSearchParams) {
  return ownerWhere(user, reportResponsibleId(params, user));
}

export function reportTaskOwnerWhere(user: PermissionUser, params: ReportSearchParams) {
  return taskOwnerWhere(user, reportResponsibleId(params, user));
}

export function periodWhere(from: Date, to: Date): Prisma.DateTimeFilter {
  return { gte: from, lte: to };
}

export function groupBy<T extends string | null | undefined>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = item ?? "Не указано";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

export function countBy<T>(items: T[], keySelector: (item: T) => string | null | undefined) {
  return groupBy(items.map(keySelector));
}

export function entityLabel(entityType: string) {
  const labels: Record<string, string> = {
    CLIENT: "Клиент",
    DESIGNER: "Дизайнер",
    OBJECT: "Объект",
    DEAL: "Сделка",
    PROPOSAL: "КП",
    TASK: "Задача"
  };
  return labels[entityType] ?? entityType;
}

export function entityArea(entityType: string) {
  const labels: Record<string, string> = {
    CLIENT: "Клиенты",
    DESIGNER: "Дизайнеры",
    OBJECT: "Объекты",
    DEAL: "Сделки",
    PROPOSAL: "КП",
    TASK: "Задачи"
  };
  return labels[entityType] ?? entityType;
}

export function sum(values: Array<number | null>) {
  return values.reduce<number>((acc, value) => acc + (value ?? 0), 0);
}

function severityWeight(severity: ProblemRow["severity"]) {
  if (severity === "critical") return 10;
  if (severity === "medium") return 5;
  return 2;
}

export function scoreRows(problems: ProblemRow[]) {
  const grouped = problems.reduce<Record<string, { name: string; score: number; critical: number; medium: number; light: number; total: number }>>((acc, problem) => {
    const id = problem.responsibleId ?? "unknown";
    acc[id] ??= { name: problem.responsibleName, score: 100, critical: 0, medium: 0, light: 0, total: 0 };
    acc[id].score = Math.max(0, acc[id].score - severityWeight(problem.severity));
    acc[id][problem.severity] += 1;
    acc[id].total += 1;
    return acc;
  }, {});
  return Object.values(grouped).sort((a, b) => a.score - b.score);
}

export async function getReportFilterOptions(user: PermissionUser) {
  const visible = ownerWhere(user);
  const [users, clients, designers, objects, deals] = await Promise.all([
    prisma.user.findMany({
      where: canViewAllData(user) ? { isActive: true } : { id: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true }
    }),
    prisma.client.findMany({ where: visible, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.designer.findMany({ where: visible, orderBy: { name: "asc" }, select: { id: true, name: true, studio: true } }),
    prisma.projectObject.findMany({ where: visible, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.deal.findMany({ where: visible, orderBy: { title: "asc" }, select: { id: true, title: true } })
  ]);

  return { users, clients, designers, objects, deals };
}
