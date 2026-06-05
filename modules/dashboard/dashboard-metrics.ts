import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canViewAllData, type PermissionUser } from "@/permissions";

function accessWhere(user: PermissionUser): {
  client: Prisma.ClientWhereInput;
  designer: Prisma.DesignerWhereInput;
  object: Prisma.ProjectObjectWhereInput;
  deal: Prisma.DealWhereInput;
} {
  if (canViewAllData(user)) {
    return { client: {}, designer: {}, object: {}, deal: {} };
  }

  return {
    client: { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
    designer: { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
    object: { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
    deal: { OR: [{ responsibleId: user.id }, { createdById: user.id }] }
  };
}

export async function getDashboardMetrics(user: PermissionUser) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const access = accessWhere(user);
  const activeDealFilter: Prisma.DealWhereInput = { archivedAt: null, stage: { notIn: ["LOST", "COMPLETED"] } };
  const myAccess = { OR: [{ responsibleId: user.id }, { createdById: user.id }] };

  const [
    newClients,
    newDesigners,
    overdueTasks,
    activeObjects,
    newObjects,
    frozenObjects,
    lostObjects,
    objectsWithoutNextStep,
    objectsWithoutResponsible,
    objectsWithoutClient,
    objectsFromDesigners,
    activeProposals,
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
    designersWithoutNextStep,
    designersWithoutTouch60,
    clientsWithoutNextContact,
    potentialADesigners,
    sleepingDesigners,
    myClients,
    myDesigners,
    myDesignersToday,
    myDesignersWithoutNextStep,
    myClientsWithoutNextContact,
    activeDesigners,
    activeObjectsByStage,
    topDesignersByObjects,
    activeDealsByStage,
    lostDealReasons,
    dealsByResponsible
  ] = await Promise.all([
    prisma.client.count({ where: { AND: [access.client, { createdAt: { gte: sevenDaysAgo } }] } }),
    prisma.designer.count({ where: { AND: [access.designer, { createdAt: { gte: sevenDaysAgo } }] } }),
    prisma.taskActivity.count({ where: { status: "OVERDUE" } }),
    prisma.projectObject.count({ where: { AND: [access.object, { status: "ACTIVE" }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { createdAt: { gte: sevenDaysAgo } }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { OR: [{ status: "FROZEN" }, { stage: "FROZEN" }] }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { OR: [{ status: "LOST" }, { stage: "LOST" }] }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { tasks: { none: { archivedAt: null } } }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { responsibleId: "" }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { clientId: "" }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { designerId: { not: null } }] } }),
    prisma.commercialProposal.count({ where: { status: "ACTIVE" } }),
    prisma.deal.count({ where: { AND: [access.deal, activeDealFilter] } }),
    prisma.deal.count({ where: { AND: [access.deal, { createdAt: { gte: sevenDaysAgo } }] } }),
    prisma.deal.aggregate({ where: { AND: [access.deal, activeDealFilter] }, _sum: { potentialAmount: true } }),
    prisma.deal.count({ where: { AND: [access.deal, activeDealFilter, { OR: [{ nextActionAt: null }, { nextActionText: null }] }] } }),
    prisma.deal.count({ where: { AND: [access.deal, activeDealFilter, { nextActionAt: { lt: new Date() } }] } }),
    prisma.deal.count({ where: { AND: [access.deal, activeDealFilter, { stage: "WAITING_DECISION" }] } }),
    prisma.deal.count({ where: { AND: [access.deal, { stage: "LOST", closedAt: { gte: sevenDaysAgo } }] } }),
    prisma.deal.count({ where: { AND: [myAccess, activeDealFilter] } }),
    prisma.deal.count({ where: { AND: [myAccess, activeDealFilter, { OR: [{ nextActionAt: null }, { nextActionText: null }] }] } }),
    prisma.deal.count({ where: { AND: [myAccess, activeDealFilter, { nextActionAt: { lt: new Date() } }] } }),
    prisma.deal.count({ where: { AND: [myAccess, activeDealFilter, { stage: "WAITING_DECISION" }] } }),
    prisma.deal.count({ where: { AND: [myAccess, activeDealFilter, { stage: "PROPOSAL_IN_PROGRESS" }] } }),
    prisma.deal.count({ where: { AND: [myAccess, { stage: "LOST", closedAt: { gte: sevenDaysAgo } }] } }),
    prisma.designer.count({ where: { AND: [access.designer, { OR: [{ nextStepAt: null }, { nextStepText: null }] }] } }),
    prisma.designer.count({ where: { AND: [access.designer, { OR: [{ lastTouchAt: null }, { lastTouchAt: { lt: sixtyDaysAgo } }] }] } }),
    prisma.client.count({ where: { AND: [access.client, { nextContactAt: null }] } }),
    prisma.designer.count({ where: { AND: [access.designer, { potential: "A" }] } }),
    prisma.designer.count({ where: { AND: [access.designer, { relationshipStage: "SLEEPING" }] } }),
    prisma.client.count({ where: { OR: [{ responsibleId: user.id }, { createdById: user.id }] } }),
    prisma.designer.count({ where: { OR: [{ responsibleId: user.id }, { createdById: user.id }] } }),
    prisma.designer.count({
      where: {
        OR: [{ responsibleId: user.id }, { createdById: user.id }],
        nextStepAt: { gte: todayStart, lte: todayEnd }
      }
    }),
    prisma.designer.count({
      where: {
        AND: [
          { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
          { OR: [{ nextStepAt: null }, { nextStepText: null }] }
        ]
      }
    }),
    prisma.client.count({
      where: {
        OR: [{ responsibleId: user.id }, { createdById: user.id }],
        nextContactAt: null
      }
    }),
    prisma.designer.findMany({
      where: access.designer,
      select: { relationshipStage: true }
    }),
    prisma.projectObject.findMany({
      where: access.object,
      select: { stage: true }
    }),
    prisma.designer.findMany({
      where: access.designer,
      orderBy: { transferredObjectsCount: "desc" },
      take: 5,
      select: { id: true, name: true, studio: true, transferredObjectsCount: true }
    }),
    prisma.deal.findMany({
      where: access.deal,
      select: { stage: true }
    }),
    prisma.deal.findMany({
      where: { AND: [access.deal, { stage: "LOST", lossReason: { not: null } }] },
      select: { lossReason: true }
    }),
    prisma.deal.findMany({
      where: access.deal,
      select: {
        responsible: { select: { id: true, name: true } }
      }
    })
  ]);

  const activeDesignersByStage = activeDesigners.reduce<Record<string, number>>((acc, designer) => {
    acc[designer.relationshipStage] = (acc[designer.relationshipStage] ?? 0) + 1;
    return acc;
  }, {});

  const objectsByStage = activeObjectsByStage.reduce<Record<string, number>>((acc, object) => {
    acc[object.stage] = (acc[object.stage] ?? 0) + 1;
    return acc;
  }, {});

  const dealsByStage = activeDealsByStage.reduce<Record<string, number>>((acc, deal) => {
    acc[deal.stage] = (acc[deal.stage] ?? 0) + 1;
    return acc;
  }, {});

  const dealLossReasons = lostDealReasons.reduce<Record<string, number>>((acc, deal) => {
    if (deal.lossReason) acc[deal.lossReason] = (acc[deal.lossReason] ?? 0) + 1;
    return acc;
  }, {});

  const dealResponsibleCounts = dealsByResponsible.reduce<Record<string, { name: string; count: number }>>((acc, deal) => {
    acc[deal.responsible.id] = {
      name: deal.responsible.name,
      count: (acc[deal.responsible.id]?.count ?? 0) + 1
    };
    return acc;
  }, {});

  return {
    newClients,
    newDesigners,
    overdueTasks,
    activeObjects,
    newObjects,
    frozenObjects,
    lostObjects,
    objectsWithoutNextStep,
    objectsWithoutResponsible,
    objectsWithoutClient,
    objectsFromDesigners,
    objectsByStage,
    topDesignersByObjects,
    activeProposals,
    activeDeals,
    newDeals,
    activeDealsAmount: activeDealsAmount._sum.potentialAmount ?? 0,
    dealsWithoutNextStep,
    overdueNextActionDeals,
    waitingDecisionDeals,
    lostDealsPeriod,
    dealsByStage,
    dealLossReasons,
    dealResponsibleCounts: Object.values(dealResponsibleCounts).sort((a, b) => b.count - a.count),
    myActiveDeals,
    myDealsWithoutNextStep,
    myOverdueNextActionDeals,
    myWaitingDecisionDeals,
    myProposalInProgressDeals,
    myLostDealsPeriod,
    proposalsWithoutFollowUp: 0,
    designersWithoutTouch: designersWithoutTouch60,
    designersWithoutNextStep,
    designersWithoutTouch60,
    clientsWithoutNextContact,
    potentialADesigners,
    sleepingDesigners,
    activeDesignersByStage,
    myClients,
    myDesigners,
    myDesignersToday,
    myDesignersWithoutNextStep,
    myClientsWithoutNextContact
  };
}
