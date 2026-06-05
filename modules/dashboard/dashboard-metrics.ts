import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canViewAllData, type PermissionUser } from "@/permissions";

function accessWhere(user: PermissionUser): { client: Prisma.ClientWhereInput; designer: Prisma.DesignerWhereInput } {
  if (canViewAllData(user)) {
    return { client: {}, designer: {} };
  }

  return {
    client: { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
    designer: { OR: [{ responsibleId: user.id }, { createdById: user.id }] }
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

  const [
    newClients,
    newDesigners,
    overdueTasks,
    activeObjects,
    activeProposals,
    activeDeals,
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
    activeDesigners
  ] = await Promise.all([
    prisma.client.count({ where: { AND: [access.client, { createdAt: { gte: sevenDaysAgo } }] } }),
    prisma.designer.count({ where: { AND: [access.designer, { createdAt: { gte: sevenDaysAgo } }] } }),
    prisma.taskActivity.count({ where: { status: "OVERDUE" } }),
    prisma.projectObject.count({ where: { status: "ACTIVE" } }),
    prisma.commercialProposal.count({ where: { status: "ACTIVE" } }),
    prisma.deal.count({ where: { status: "ACTIVE" } }),
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
    })
  ]);

  const activeDesignersByStage = activeDesigners.reduce<Record<string, number>>((acc, designer) => {
    acc[designer.relationshipStage] = (acc[designer.relationshipStage] ?? 0) + 1;
    return acc;
  }, {});

  return {
    newClients,
    newDesigners,
    overdueTasks,
    activeObjects,
    activeProposals,
    activeDeals,
    dealsWithoutNextStep: 0,
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
