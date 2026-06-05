import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { canViewAllData, type PermissionUser } from "@/permissions";

function accessWhere(user: PermissionUser): {
  client: Prisma.ClientWhereInput;
  designer: Prisma.DesignerWhereInput;
  object: Prisma.ProjectObjectWhereInput;
  deal: Prisma.DealWhereInput;
  proposal: Prisma.CommercialProposalWhereInput;
  task: Prisma.TaskActivityWhereInput;
} {
  if (canViewAllData(user)) {
    return { client: {}, designer: {}, object: {}, deal: {}, proposal: {}, task: {} };
  }

  return {
    client: { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
    designer: { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
    object: { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
    deal: { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
    proposal: { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
    task: { OR: [{ responsibleId: user.id }, { createdById: user.id }] }
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
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  weekEnd.setHours(23, 59, 59, 999);
  const access = accessWhere(user);
  const activeDealFilter: Prisma.DealWhereInput = { archivedAt: null, stage: { notIn: ["LOST", "COMPLETED"] } };
  const activeProposalFilter: Prisma.CommercialProposalWhereInput = { archivedAt: null, status: { notIn: ["ACCEPTED", "DECLINED", "ARCHIVED"] } };
  const myAccess = { OR: [{ responsibleId: user.id }, { createdById: user.id }] };
  const thinkingThreshold = new Date();
  thinkingThreshold.setDate(thinkingThreshold.getDate() - 7);

  const [
    newClients,
    newDesigners,
    overdueTasks,
    tasksToday,
    tasksWithoutResult,
    doneTasksPeriod,
    touchesPeriod,
    overdueTasksByResponsible,
    myTasksToday,
    myOverdueTasks,
    myTasksWeek,
    myRecentTouches,
    myFollowUps,
    managerActivity,
    activeObjects,
    newObjects,
    frozenObjects,
    lostObjects,
    objectsWithoutNextStep,
    objectsWithoutResponsible,
    objectsWithoutClient,
    objectsFromDesigners,
    activeProposals,
    newProposals,
    newProposalsAmount,
    proposalNoFollowUp,
    proposalNoFile,
    proposalThinking7,
    acceptedProposalsPeriod,
    declinedProposalsPeriod,
    activeProposalsAmount,
    myProposals,
    myProposalNoFollowUp,
    myProposalThinking,
    myProposalOverdueFollowUp,
    myAcceptedProposals,
    myDeclinedProposals,
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
    dealsByResponsible,
    proposalsByStatus,
    proposalDeclineReasons,
    proposalsByResponsible
  ] = await Promise.all([
    prisma.client.count({ where: { AND: [access.client, { createdAt: { gte: sevenDaysAgo } }] } }),
    prisma.designer.count({ where: { AND: [access.designer, { createdAt: { gte: sevenDaysAgo } }] } }),
    prisma.taskActivity.count({
      where: {
        AND: [
          access.task,
          { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { lt: new Date() } }
        ]
      }
    }),
    prisma.taskActivity.count({
      where: {
        AND: [
          access.task,
          { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { gte: todayStart, lte: todayEnd } }
        ]
      }
    }),
    prisma.taskActivity.count({ where: { AND: [access.task, { archivedAt: null, result: null }] } }),
    prisma.taskActivity.count({ where: { AND: [access.task, { recordType: "TASK", status: "DONE", completedAt: { gte: sevenDaysAgo } }] } }),
    prisma.taskActivity.count({ where: { AND: [access.task, { recordType: "TOUCH", completedAt: { gte: sevenDaysAgo } }] } }),
    prisma.taskActivity.findMany({
      where: { AND: [access.task, { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { lt: new Date() } }] },
      select: { responsible: { select: { id: true, name: true } } }
    }),
    prisma.taskActivity.count({
      where: {
        AND: [
          { responsibleId: user.id },
          { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { gte: todayStart, lte: todayEnd } }
        ]
      }
    }),
    prisma.taskActivity.count({
      where: {
        AND: [
          { responsibleId: user.id },
          { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { lt: new Date() } }
        ]
      }
    }),
    prisma.taskActivity.count({
      where: {
        AND: [
          { responsibleId: user.id },
          { recordType: "TASK", archivedAt: null, dueAt: { gte: todayStart, lte: weekEnd } }
        ]
      }
    }),
    prisma.taskActivity.count({ where: { responsibleId: user.id, recordType: "TOUCH", completedAt: { gte: sevenDaysAgo } } }),
    prisma.taskActivity.count({ where: { responsibleId: user.id, recordType: "TASK", actionType: "FOLLOW_UP", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] } } }),
    prisma.taskActivity.findMany({
      where: { AND: [access.task, { createdAt: { gte: sevenDaysAgo } }] },
      select: {
        recordType: true,
        status: true,
        responsible: { select: { id: true, name: true } }
      }
    }),
    prisma.projectObject.count({ where: { AND: [access.object, { status: "ACTIVE" }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { createdAt: { gte: sevenDaysAgo } }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { OR: [{ status: "FROZEN" }, { stage: "FROZEN" }] }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { OR: [{ status: "LOST" }, { stage: "LOST" }] }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { tasks: { none: { archivedAt: null } } }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { responsibleId: "" }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { clientId: "" }] } }),
    prisma.projectObject.count({ where: { AND: [access.object, { designerId: { not: null } }] } }),
    prisma.commercialProposal.count({ where: { AND: [access.proposal, activeProposalFilter] } }),
    prisma.commercialProposal.count({ where: { AND: [access.proposal, { createdAt: { gte: sevenDaysAgo } }] } }),
    prisma.commercialProposal.aggregate({ where: { AND: [access.proposal, { createdAt: { gte: sevenDaysAgo } }] }, _sum: { amount: true } }),
    prisma.commercialProposal.count({ where: { AND: [access.proposal, activeProposalFilter, { nextTouchAt: null }] } }),
    prisma.commercialProposal.count({ where: { AND: [access.proposal, { fileUrl: null }] } }),
    prisma.commercialProposal.count({ where: { AND: [access.proposal, { status: "CLIENT_THINKING", sentAt: { lt: thinkingThreshold } }] } }),
    prisma.commercialProposal.count({ where: { AND: [access.proposal, { status: "ACCEPTED", updatedAt: { gte: sevenDaysAgo } }] } }),
    prisma.commercialProposal.count({ where: { AND: [access.proposal, { status: "DECLINED", updatedAt: { gte: sevenDaysAgo } }] } }),
    prisma.commercialProposal.aggregate({ where: { AND: [access.proposal, activeProposalFilter] }, _sum: { amount: true } }),
    prisma.commercialProposal.count({ where: { AND: [myAccess, { archivedAt: null }] } }),
    prisma.commercialProposal.count({ where: { AND: [myAccess, activeProposalFilter, { nextTouchAt: null }] } }),
    prisma.commercialProposal.count({ where: { AND: [myAccess, { status: "CLIENT_THINKING", sentAt: { lt: thinkingThreshold } }] } }),
    prisma.commercialProposal.count({ where: { AND: [myAccess, activeProposalFilter, { nextTouchAt: { lt: new Date() } }] } }),
    prisma.commercialProposal.count({ where: { AND: [myAccess, { status: "ACCEPTED" }] } }),
    prisma.commercialProposal.count({ where: { AND: [myAccess, { status: "DECLINED" }] } }),
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
    }),
    prisma.commercialProposal.findMany({
      where: access.proposal,
      select: { status: true }
    }),
    prisma.commercialProposal.findMany({
      where: { AND: [access.proposal, { status: "DECLINED", declineReason: { not: null } }] },
      select: { declineReason: true }
    }),
    prisma.commercialProposal.findMany({
      where: access.proposal,
      select: {
        amount: true,
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

  const proposalStatusCounts = proposalsByStatus.reduce<Record<string, number>>((acc, proposal) => {
    acc[proposal.status] = (acc[proposal.status] ?? 0) + 1;
    return acc;
  }, {});

  const proposalDeclineReasonCounts = proposalDeclineReasons.reduce<Record<string, number>>((acc, proposal) => {
    if (proposal.declineReason) acc[proposal.declineReason] = (acc[proposal.declineReason] ?? 0) + 1;
    return acc;
  }, {});

  const proposalResponsibleAmounts = proposalsByResponsible.reduce<Record<string, { name: string; amount: number }>>((acc, proposal) => {
    acc[proposal.responsible.id] = {
      name: proposal.responsible.name,
      amount: (acc[proposal.responsible.id]?.amount ?? 0) + proposal.amount
    };
    return acc;
  }, {});

  const overdueTaskResponsibleCounts = overdueTasksByResponsible.reduce<Record<string, { name: string; count: number }>>((acc, task) => {
    acc[task.responsible.id] = {
      name: task.responsible.name,
      count: (acc[task.responsible.id]?.count ?? 0) + 1
    };
    return acc;
  }, {});

  const managerActivityCounts = managerActivity.reduce<Record<string, { name: string; tasks: number; done: number; touches: number }>>((acc, item) => {
    acc[item.responsible.id] ??= { name: item.responsible.name, tasks: 0, done: 0, touches: 0 };
    if (item.recordType === "TASK") acc[item.responsible.id].tasks += 1;
    if (item.status === "DONE" || item.status === "CLOSED") acc[item.responsible.id].done += 1;
    if (item.recordType === "TOUCH") acc[item.responsible.id].touches += 1;
    return acc;
  }, {});

  return {
    newClients,
    newDesigners,
    overdueTasks,
    tasksToday,
    tasksWithoutResult,
    doneTasksPeriod,
    touchesPeriod,
    overdueTaskResponsibleCounts: Object.values(overdueTaskResponsibleCounts).sort((a, b) => b.count - a.count),
    myTasksToday,
    myOverdueTasks,
    myTasksWeek,
    myRecentTouches,
    myFollowUps,
    managerActivityCounts: Object.values(managerActivityCounts).sort((a, b) => b.tasks + b.touches - (a.tasks + a.touches)),
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
    newProposals,
    newProposalsAmount: newProposalsAmount._sum.amount ?? 0,
    proposalNoFollowUp,
    proposalNoFile,
    proposalThinking7,
    acceptedProposalsPeriod,
    declinedProposalsPeriod,
    activeProposalsAmount: activeProposalsAmount._sum.amount ?? 0,
    proposalStatusCounts,
    proposalDeclineReasonCounts,
    proposalResponsibleAmounts: Object.values(proposalResponsibleAmounts).sort((a, b) => b.amount - a.amount),
    myProposals,
    myProposalNoFollowUp,
    myProposalThinking,
    myProposalOverdueFollowUp,
    myAcceptedProposals,
    myDeclinedProposals,
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
