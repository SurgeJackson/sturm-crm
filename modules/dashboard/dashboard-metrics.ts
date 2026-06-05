import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics() {
  const [
    newClients,
    newDesigners,
    overdueTasks,
    activeObjects,
    activeProposals,
    activeDeals
  ] = await Promise.all([
    prisma.client.count(),
    prisma.designer.count(),
    prisma.taskActivity.count({ where: { status: "OVERDUE" } }),
    prisma.projectObject.count({ where: { status: "ACTIVE" } }),
    prisma.commercialProposal.count({ where: { status: "ACTIVE" } }),
    prisma.deal.count({ where: { status: "ACTIVE" } })
  ]);

  return {
    newClients,
    newDesigners,
    overdueTasks,
    activeObjects,
    activeProposals,
    activeDeals,
    dealsWithoutNextStep: 0,
    proposalsWithoutFollowUp: 0,
    designersWithoutTouch: 0
  };
}
