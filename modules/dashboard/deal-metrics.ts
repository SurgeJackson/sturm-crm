import { prisma } from "@/lib/prisma";
import type { DashboardContext } from "@/modules/dashboard/context";
import { groupRowsToCountMap } from "@/modules/dashboard/utils";

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
    prisma.deal.findMany({
      where: ctx.access.deal,
      select: {
        responsible: { select: { id: true, name: true } }
      }
    })
  ]);

  const dealResponsibleCounts = dealsByResponsible.reduce<Record<string, { name: string; count: number }>>((acc, deal) => {
    acc[deal.responsible.id] = {
      name: deal.responsible.name,
      count: (acc[deal.responsible.id]?.count ?? 0) + 1
    };
    return acc;
  }, {});

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
    dealResponsibleCounts: Object.values(dealResponsibleCounts).sort((a, b) => b.count - a.count),
    myActiveDeals,
    myDealsWithoutNextStep,
    myOverdueNextActionDeals,
    myWaitingDecisionDeals,
    myProposalInProgressDeals,
    myLostDealsPeriod
  };
}
