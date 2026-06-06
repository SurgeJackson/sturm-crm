import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/modules/crm/date-ranges";
import type { PermissionUser } from "@/permissions";
import { groupBy, periodWhere, reportOwnerWhere, reportPeriod, sum, type Metric, type ReportSearchParams } from "./common";

export async function getDealsReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const now = new Date();
  const filters: Prisma.DealWhereInput[] = [reportOwnerWhere(user, params)];
  if (params.stage) filters.push({ stage: params.stage as never });
  if (params.source) filters.push({ source: params.source as never });
  if (params.probability) filters.push({ probability: params.probability as never });
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (params.objectId) filters.push({ objectId: params.objectId });
  filters.push({ createdAt: periodWhere(from, to) });
  const deals = await prisma.deal.findMany({
    where: { AND: filters },
    orderBy: { createdAt: "desc" },
    include: { responsible: { select: { name: true } }, client: { select: { name: true } }, projectObject: { select: { title: true } }, designer: { select: { name: true } } }
  });
  const active = deals.filter((deal) => !["LOST", "COMPLETED"].includes(deal.stage));
  return {
    period: { from, to },
    deals,
    metrics: [
      { title: "Активные сделки", value: active.length },
      { title: "Сумма активных сделок", value: `${sum(active.map((deal) => deal.potentialAmount)).toLocaleString("ru-RU")} ₽` },
      { title: "Без следующего шага", value: active.filter((deal) => !deal.nextActionAt || !deal.nextActionText).length, tone: "warning" as const },
      { title: "Просроченное действие", value: active.filter((deal) => deal.nextActionAt && deal.nextActionAt < now).length, tone: "warning" as const },
      { title: "Ожидают решения", value: active.filter((deal) => deal.stage === "WAITING_DECISION").length },
      { title: "Завершены", value: deals.filter((deal) => deal.stage === "COMPLETED").length, tone: "secondary" as const },
      { title: "Проиграны", value: deals.filter((deal) => deal.stage === "LOST").length, tone: "warning" as const }
    ] satisfies Metric[],
    byStage: groupBy(deals.map((deal) => deal.stage)),
    lossReasons: groupBy(deals.filter((deal) => deal.stage === "LOST").map((deal) => deal.lossReason))
  };
}

export async function getProposalsReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const now = new Date();
  const filters: Prisma.CommercialProposalWhereInput[] = [reportOwnerWhere(user, params), { createdAt: periodWhere(from, to) }];
  if (params.status) filters.push({ status: params.status as never });
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (params.objectId) filters.push({ objectId: params.objectId });
  if (params.clientId) filters.push({ clientId: params.clientId });
  const proposals = await prisma.commercialProposal.findMany({
    where: { AND: filters },
    orderBy: { createdAt: "desc" },
    include: { responsible: { select: { name: true } }, client: { select: { name: true } }, deal: { select: { title: true } }, projectObject: { select: { title: true } }, designer: { select: { name: true } } }
  });
  const amount = sum(proposals.map((proposal) => proposal.amount));
  const byResponsible = proposals.reduce<Record<string, { name: string; amount: number; count: number }>>((acc, proposal) => {
    acc[proposal.responsibleId] ??= { name: proposal.responsible.name, amount: 0, count: 0 };
    acc[proposal.responsibleId].amount += proposal.amount;
    acc[proposal.responsibleId].count += 1;
    return acc;
  }, {});
  const thinking7 = daysAgo(7, now);
  return {
    period: { from, to },
    proposals,
    metrics: [
      { title: "КП за период", value: proposals.length },
      { title: "Сумма КП", value: `${amount.toLocaleString("ru-RU")} ₽` },
      { title: "Средняя сумма КП", value: `${Math.round(amount / Math.max(proposals.length, 1)).toLocaleString("ru-RU")} ₽` },
      { title: "Принятые КП", value: proposals.filter((proposal) => proposal.status === "ACCEPTED").length, tone: "secondary" as const },
      { title: "Отклоненные КП", value: proposals.filter((proposal) => proposal.status === "DECLINED").length, tone: "warning" as const },
      { title: "Без follow-up", value: proposals.filter((proposal) => !proposal.nextTouchAt && !["ACCEPTED", "DECLINED", "ARCHIVED"].includes(proposal.status)).length, tone: "warning" as const },
      { title: "Без файла", value: proposals.filter((proposal) => !proposal.fileUrl).length, tone: "warning" as const },
      { title: "Думает 7+ дней", value: proposals.filter((proposal) => proposal.status === "CLIENT_THINKING" && proposal.sentAt && proposal.sentAt < thinking7).length, tone: "warning" as const }
    ] satisfies Metric[],
    byStatus: groupBy(proposals.map((proposal) => proposal.status)),
    declineReasons: groupBy(proposals.filter((proposal) => proposal.status === "DECLINED").map((proposal) => proposal.declineReason)),
    byResponsible: Object.values(byResponsible).sort((a, b) => b.amount - a.amount)
  };
}

export async function getLossReasonsReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const owner = reportOwnerWhere(user, params);
  const [lostDeals, declinedProposals, lostObjects] = await Promise.all([
    prisma.deal.findMany({ where: { AND: [owner, { stage: "LOST", updatedAt: periodWhere(from, to) }] }, include: { responsible: { select: { name: true } }, designer: { select: { name: true } }, projectObject: { select: { objectType: true } } } }),
    prisma.commercialProposal.findMany({ where: { AND: [owner, { status: "DECLINED", updatedAt: periodWhere(from, to) }] }, include: { responsible: { select: { name: true } }, designer: { select: { name: true } }, projectObject: { select: { objectType: true } } } }),
    prisma.projectObject.findMany({ where: { AND: [owner, { OR: [{ status: "LOST" }, { stage: "LOST" }], updatedAt: periodWhere(from, to) }] }, include: { responsible: { select: { name: true } }, designer: { select: { name: true } } } })
  ]);
  return {
    period: { from, to },
    lostDeals,
    declinedProposals,
    lostObjects,
    metrics: [
      { title: "Проигранные сделки", value: lostDeals.length, tone: "warning" as const },
      { title: "Отклоненные КП", value: declinedProposals.length, tone: "warning" as const },
      { title: "Потерянные объекты", value: lostObjects.length, tone: "warning" as const },
      { title: "Потенциальная потеря сделок", value: `${sum(lostDeals.map((deal) => deal.potentialAmount)).toLocaleString("ru-RU")} ₽`, tone: "warning" as const },
      { title: "Сумма отклоненных КП", value: `${sum(declinedProposals.map((proposal) => proposal.amount)).toLocaleString("ru-RU")} ₽`, tone: "warning" as const }
    ] satisfies Metric[],
    dealReasons: groupBy(lostDeals.map((deal) => deal.lossReason)),
    proposalReasons: groupBy(declinedProposals.map((proposal) => proposal.declineReason)),
    byResponsible: groupBy([...lostDeals.map((deal) => deal.responsible.name), ...declinedProposals.map((proposal) => proposal.responsible.name), ...lostObjects.map((object) => object.responsible.name)]),
    byDesigner: groupBy([...lostDeals.map((deal) => deal.designer?.name), ...declinedProposals.map((proposal) => proposal.designer?.name), ...lostObjects.map((object) => object.designer?.name)]),
    byObjectType: groupBy([...lostDeals.map((deal) => deal.projectObject.objectType), ...declinedProposals.map((proposal) => proposal.projectObject.objectType)])
  };
}
