import { prisma } from "@/lib/prisma";
import type { DashboardContext } from "@/modules/dashboard/context";
import { getUserNameMap, groupRowsToCountMap, namedAmountRows } from "@/modules/dashboard/utils";

export async function getProposalMetrics(ctx: DashboardContext) {
  const [
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
    proposalsByStatus,
    proposalDeclineReasons,
    proposalsByResponsible
  ] = await Promise.all([
    prisma.commercialProposal.count({ where: { AND: [ctx.access.proposal, ctx.activeProposalFilter] } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.access.proposal, { createdAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.commercialProposal.aggregate({ where: { AND: [ctx.access.proposal, { createdAt: { gte: ctx.sevenDaysAgo } }] }, _sum: { amount: true } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.access.proposal, ctx.activeProposalFilter, { nextTouchAt: null }] } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.access.proposal, { fileUrl: null }] } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.access.proposal, { status: "CLIENT_THINKING", sentAt: { lt: ctx.thinkingThreshold } }] } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.access.proposal, { status: "ACCEPTED", updatedAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.access.proposal, { status: "DECLINED", updatedAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.commercialProposal.aggregate({ where: { AND: [ctx.access.proposal, ctx.activeProposalFilter] }, _sum: { amount: true } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.myAccess, { archivedAt: null }] } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.myAccess, ctx.activeProposalFilter, { nextTouchAt: null }] } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.myAccess, { status: "CLIENT_THINKING", sentAt: { lt: ctx.thinkingThreshold } }] } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.myAccess, ctx.activeProposalFilter, { nextTouchAt: { lt: ctx.now } }] } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.myAccess, { status: "ACCEPTED" }] } }),
    prisma.commercialProposal.count({ where: { AND: [ctx.myAccess, { status: "DECLINED" }] } }),
    prisma.commercialProposal.groupBy({
      by: ["status"],
      where: ctx.access.proposal,
      _count: { _all: true }
    }),
    prisma.commercialProposal.groupBy({
      by: ["declineReason"],
      where: { AND: [ctx.access.proposal, { status: "DECLINED", declineReason: { not: null } }] },
      _count: { _all: true }
    }),
    prisma.commercialProposal.groupBy({
      by: ["responsibleId"],
      where: ctx.access.proposal,
      _sum: { amount: true }
    })
  ]);

  const responsibleNames = await getUserNameMap(proposalsByResponsible.map((row) => row.responsibleId));

  return {
    activeProposals,
    newProposals,
    newProposalsAmount: newProposalsAmount._sum.amount ?? 0,
    proposalNoFollowUp,
    proposalNoFile,
    proposalThinking7,
    acceptedProposalsPeriod,
    declinedProposalsPeriod,
    activeProposalsAmount: activeProposalsAmount._sum.amount ?? 0,
    proposalStatusCounts: groupRowsToCountMap(proposalsByStatus, "status"),
    proposalDeclineReasonCounts: groupRowsToCountMap(proposalDeclineReasons, "declineReason"),
    proposalResponsibleAmounts: namedAmountRows(proposalsByResponsible, responsibleNames, (row) => row._sum.amount),
    myProposals,
    myProposalNoFollowUp,
    myProposalThinking,
    myProposalOverdueFollowUp,
    myAcceptedProposals,
    myDeclinedProposals
  };
}
