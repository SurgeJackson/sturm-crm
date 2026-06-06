import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/modules/crm/date-ranges";
import type { PermissionUser } from "@/permissions";
import { groupBy, periodWhere, reportOwnerWhere, reportPeriod, sum, type Metric, type ReportSearchParams } from "./common";

export async function getDesignersReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const filters: Prisma.DesignerWhereInput[] = [reportOwnerWhere(user, params)];
  if (params.stage) filters.push({ relationshipStage: params.stage as never });
  if (params.probability) filters.push({ potential: params.probability as never });
  if (params.status) filters.push({ loyalty: params.status as never });
  if (params.city) filters.push({ city: { contains: params.city, mode: "insensitive" } });
  if (params.source) filters.push({ source: params.source as never });
  filters.push({ createdAt: periodWhere(from, to) });
  const designers = await prisma.designer.findMany({
    where: { AND: filters },
    include: {
      responsible: { select: { name: true } },
      projectObjects: { where: { archivedAt: null }, select: { id: true } },
      proposals: { where: { archivedAt: null }, select: { id: true, amount: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  const sixtyDaysAgo = daysAgo(60);
  return {
    period: { from, to },
    designers,
    metrics: [
      { title: "Новые дизайнеры", value: designers.length },
      { title: "Без касаний", value: designers.filter((designer) => !designer.lastTouchAt || designer.lastTouchAt < sixtyDaysAgo).length, tone: "warning" as const },
      { title: "Без следующего шага", value: designers.filter((designer) => !designer.nextStepAt || !designer.nextStepText).length, tone: "warning" as const },
      { title: "Передали объект", value: designers.filter((designer) => designer.projectObjects.length > 0).length },
      { title: "Ключевые партнеры", value: designers.filter((designer) => designer.relationshipStage === "KEY_PARTNER").length, tone: "secondary" as const }
    ] satisfies Metric[],
    byStage: groupBy(designers.map((designer) => designer.relationshipStage)),
    byPotential: groupBy(designers.map((designer) => designer.potential)),
    byLoyalty: groupBy(designers.map((designer) => designer.loyalty)),
    topByObjects: [...designers].sort((a, b) => b.projectObjects.length - a.projectObjects.length).slice(0, 10),
    topByProposalAmount: [...designers].sort((a, b) => sum(b.proposals.map((proposal) => proposal.amount)) - sum(a.proposals.map((proposal) => proposal.amount))).slice(0, 10)
  };
}

export async function getObjectsReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const filters: Prisma.ProjectObjectWhereInput[] = [reportOwnerWhere(user, params), { createdAt: periodWhere(from, to) }];
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (params.clientId) filters.push({ clientId: params.clientId });
  if (params.stage) filters.push({ stage: params.stage as never });
  if (params.status) filters.push({ status: params.status as never });
  if (params.type) filters.push({ objectType: params.type as never });
  if (params.city) filters.push({ city: { contains: params.city, mode: "insensitive" } });
  const objects = await prisma.projectObject.findMany({
    where: { AND: filters },
    include: {
      responsible: { select: { name: true } },
      client: { select: { name: true } },
      designer: { select: { name: true } },
      tasks: { where: { archivedAt: null }, select: { id: true } },
      participants: { where: { archivedAt: null }, select: { id: true, participantType: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  return {
    period: { from, to },
    objects,
    metrics: [
      { title: "Новые объекты", value: objects.length },
      { title: "Активные объекты", value: objects.filter((object) => object.status === "ACTIVE").length },
      { title: "От дизайнеров", value: objects.filter((object) => object.designerId).length },
      { title: "В расчете", value: objects.filter((object) => object.stage === "CALCULATION").length },
      { title: "В согласовании", value: objects.filter((object) => object.stage === "APPROVAL").length },
      { title: "Заморожены", value: objects.filter((object) => object.status === "FROZEN" || object.stage === "FROZEN").length, tone: "warning" as const },
      { title: "Потеряны", value: objects.filter((object) => object.status === "LOST" || object.stage === "LOST").length, tone: "warning" as const },
      { title: "Без задач", value: objects.filter((object) => object.tasks.length === 0).length, tone: "warning" as const },
      { title: "Без закупщика", value: objects.filter((object) => object.participants.every((participant) => participant.participantType !== "PURCHASE_INFLUENCER")).length, tone: "warning" as const },
      { title: "Без контакта реализации", value: objects.filter((object) => object.participants.every((participant) => participant.participantType !== "IMPLEMENTATION_CONTACT")).length, tone: "warning" as const }
    ] satisfies Metric[],
    byStage: groupBy(objects.map((object) => object.stage)),
    byType: groupBy(objects.map((object) => object.objectType))
  };
}
