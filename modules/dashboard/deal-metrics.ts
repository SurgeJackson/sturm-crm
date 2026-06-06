import { prisma } from "@/lib/prisma";
import type { DashboardContext } from "@/modules/dashboard/context";
import { getUserNameMap, groupRowsToCountMap, namedCountRows } from "@/modules/dashboard/utils";

export async function getDealMetrics(ctx: DashboardContext) {
  const [
    activeDeals,
    newDeals,
    activeDealsAmount,
    dealsWithoutNextStep,
    overdueNextActionDeals,
    waitingDecisionDeals,
    lostDealsPeriod,
    myActiveDeals,
    myDealsWithoutNextStep,
    myOverdueNextActionDeals,
    myWaitingDecisionDeals,
    myProposalInProgressDeals,
    myLostDealsPeriod,
    activeDealsByStage,
    lostDealReasons,
    dealsByResponsible
  ] = await Promise.all([
    prisma.deal.count({ where: { AND: [ctx.access.deal, ctx.activeDealFilter] } }),
    prisma.deal.count({ where: { AND: [ctx.access.deal, { createdAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.deal.aggregate({ where: { AND: [ctx.access.deal, ctx.activeDealFilter] }, _sum: { potentialAmount: true } }),
    prisma.deal.count({ where: { AND: [ctx.access.deal, ctx.activeDealFilter, { OR: [{ nextActionAt: null }, { nextActionText: null }] }] } }),
    prisma.deal.count({ where: { AND: [ctx.access.deal, ctx.activeDealFilter, { nextActionAt: { lt: ctx.now } }] } }),
    prisma.deal.count({ where: { AND: [ctx.access.deal, ctx.activeDealFilter, { stage: "WAITING_DECISION" }] } }),
    prisma.deal.count({ where: { AND: [ctx.access.deal, { stage: "LOST", closedAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.deal.count({ where: { AND: [ctx.myAccess, ctx.activeDealFilter] } }),
    prisma.deal.count({ where: { AND: [ctx.myAccess, ctx.activeDealFilter, { OR: [{ nextActionAt: null }, { nextActionText: null }] }] } }),
    prisma.deal.count({ where: { AND: [ctx.myAccess, ctx.activeDealFilter, { nextActionAt: { lt: ctx.now } }] } }),
    prisma.deal.count({ where: { AND: [ctx.myAccess, ctx.activeDealFilter, { stage: "WAITING_DECISION" }] } }),
    prisma.deal.count({ where: { AND: [ctx.myAccess, ctx.activeDealFilter, { stage: "PROPOSAL_IN_PROGRESS" }] } }),
    prisma.deal.count({ where: { AND: [ctx.myAccess, { stage: "LOST", closedAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.deal.groupBy({
      by: ["stage"],
      where: ctx.access.deal,
      _count: { _all: true }
    }),
    prisma.deal.groupBy({
      by: ["lossReason"],
      where: { AND: [ctx.access.deal, { stage: "LOST", lossReason: { not: null } }] },
      _count: { _all: true }
    }),
    prisma.deal.groupBy({
      by: ["responsibleId"],
      where: ctx.access.deal,
      _count: { _all: true }
    })
  ]);

  const responsibleNames = await getUserNameMap(dealsByResponsible.map((row) => row.responsibleId));

  return {
    activeDeals,
    newDeals,
    activeDealsAmount: activeDealsAmount._sum.potentialAmount ?? 0,
    dealsWithoutNextStep,
    overdueNextActionDeals,
    waitingDecisionDeals,
    lostDealsPeriod,
    dealsByStage: groupRowsToCountMap(activeDealsByStage, "stage"),
    dealLossReasons: groupRowsToCountMap(lostDealReasons, "lossReason"),
    dealResponsibleCounts: namedCountRows(dealsByResponsible, responsibleNames),
    myActiveDeals,
    myDealsWithoutNextStep,
    myOverdueNextActionDeals,
    myWaitingDecisionDeals,
    myProposalInProgressDeals,
    myLostDealsPeriod
  };
}
