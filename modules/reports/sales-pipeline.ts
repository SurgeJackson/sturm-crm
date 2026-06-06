import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/modules/crm/date-ranges";
import { closedDealStages, closedProposalStatuses } from "@/modules/crm/domain-constants";
import type { PermissionUser } from "@/permissions";
import { groupBy, groupCountRows, periodWhere, reportOwnerWhere, reportPeriod, sum, type Metric, type ReportSearchParams } from "./common";

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
  const where: Prisma.DealWhereInput = { AND: filters };
  const activeWhere: Prisma.DealWhereInput = { AND: [where, { stage: { notIn: closedDealStages } }] };
  const [
    deals,
    activeDeals,
    activeDealsAmount,
    dealsWithoutNextStep,
    overdueNextActionDeals,
    waitingDecisionDeals,
    completedDeals,
    lostDeals,
    dealsByStageRows,
    lossReasonRows
  ] = await Promise.all([
    prisma.deal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { responsible: { select: { name: true } }, client: { select: { name: true } }, projectObject: { select: { title: true } }, designer: { select: { name: true } } }
    }),
    prisma.deal.count({ where: activeWhere }),
    prisma.deal.aggregate({ where: activeWhere, _sum: { potentialAmount: true } }),
    prisma.deal.count({ where: { AND: [activeWhere, { OR: [{ nextActionAt: null }, { nextActionText: null }] }] } }),
    prisma.deal.count({ where: { AND: [activeWhere, { nextActionAt: { lt: now } }] } }),
    prisma.deal.count({ where: { AND: [activeWhere, { stage: "WAITING_DECISION" }] } }),
    prisma.deal.count({ where: { AND: [where, { stage: "COMPLETED" }] } }),
    prisma.deal.count({ where: { AND: [where, { stage: "LOST" }] } }),
    prisma.deal.groupBy({ by: ["stage"], where, _count: { _all: true } }),
    prisma.deal.groupBy({ by: ["lossReason"], where: { AND: [where, { stage: "LOST" }] }, _count: { _all: true } })
  ]);
  return {
    period: { from, to },
    deals,
    metrics: [
      { title: "Активные сделки", value: activeDeals },
      { title: "Сумма активных сделок", value: `${(activeDealsAmount._sum.potentialAmount ?? 0).toLocaleString("ru-RU")} ₽` },
      { title: "Без следующего шага", value: dealsWithoutNextStep, tone: "warning" as const },
      { title: "Просроченное действие", value: overdueNextActionDeals, tone: "warning" as const },
      { title: "Ожидают решения", value: waitingDecisionDeals },
      { title: "Завершены", value: completedDeals, tone: "secondary" as const },
      { title: "Проиграны", value: lostDeals, tone: "warning" as const }
    ] satisfies Metric[],
    byStage: groupCountRows(dealsByStageRows, "stage"),
    lossReasons: groupCountRows(lossReasonRows, "lossReason")
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
  const thinking7 = daysAgo(7, now);
  const where: Prisma.CommercialProposalWhereInput = { AND: filters };
  const activeWhere: Prisma.CommercialProposalWhereInput = { status: { notIn: closedProposalStatuses } };
  const [
    proposals,
    proposalsAmount,
    acceptedProposals,
    declinedProposals,
    proposalsNoFollowUp,
    proposalsNoFile,
    proposalsThinking7,
    proposalsByStatusRows,
    declineReasonRows,
    proposalsByResponsibleRows
  ] = await Promise.all([
    prisma.commercialProposal.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { responsible: { select: { name: true } }, client: { select: { name: true } }, deal: { select: { title: true } }, projectObject: { select: { title: true } }, designer: { select: { name: true } } }
    }),
    prisma.commercialProposal.aggregate({ where, _sum: { amount: true } }),
    prisma.commercialProposal.count({ where: { AND: [where, { status: "ACCEPTED" }] } }),
    prisma.commercialProposal.count({ where: { AND: [where, { status: "DECLINED" }] } }),
    prisma.commercialProposal.count({ where: { AND: [where, activeWhere, { nextTouchAt: null }] } }),
    prisma.commercialProposal.count({ where: { AND: [where, { fileUrl: null }] } }),
    prisma.commercialProposal.count({ where: { AND: [where, { status: "CLIENT_THINKING", sentAt: { lt: thinking7 } }] } }),
    prisma.commercialProposal.groupBy({ by: ["status"], where, _count: { _all: true } }),
    prisma.commercialProposal.groupBy({ by: ["declineReason"], where: { AND: [where, { status: "DECLINED" }] }, _count: { _all: true } }),
    prisma.commercialProposal.groupBy({ by: ["responsibleId"], where, _sum: { amount: true }, _count: { _all: true } })
  ]);
  const amount = proposalsAmount._sum.amount ?? 0;
  const responsibles = await prisma.user.findMany({
    where: { id: { in: proposalsByResponsibleRows.map((row) => row.responsibleId) } },
    select: { id: true, name: true }
  });
  const responsibleNames = new Map(responsibles.map((responsible) => [responsible.id, responsible.name]));
  return {
    period: { from, to },
    proposals,
    metrics: [
      { title: "КП за период", value: proposals.length },
      { title: "Сумма КП", value: `${amount.toLocaleString("ru-RU")} ₽` },
      { title: "Средняя сумма КП", value: `${Math.round(amount / Math.max(proposals.length, 1)).toLocaleString("ru-RU")} ₽` },
      { title: "Принятые КП", value: acceptedProposals, tone: "secondary" as const },
      { title: "Отклоненные КП", value: declinedProposals, tone: "warning" as const },
      { title: "Без follow-up", value: proposalsNoFollowUp, tone: "warning" as const },
      { title: "Без файла", value: proposalsNoFile, tone: "warning" as const },
      { title: "Думает 7+ дней", value: proposalsThinking7, tone: "warning" as const }
    ] satisfies Metric[],
    byStatus: groupCountRows(proposalsByStatusRows, "status"),
    declineReasons: groupCountRows(declineReasonRows, "declineReason"),
    byResponsible: proposalsByResponsibleRows
      .map((row) => ({
        name: responsibleNames.get(row.responsibleId) ?? "Не указан",
        amount: row._sum.amount ?? 0,
        count: row._count._all
      }))
      .sort((a, b) => b.amount - a.amount)
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
