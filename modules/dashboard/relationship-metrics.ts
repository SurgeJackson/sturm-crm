import { prisma } from "@/lib/prisma";
import type { DashboardContext } from "@/modules/dashboard/context";
import { groupRowsToCountMap } from "@/modules/dashboard/utils";

export async function getRelationshipMetrics(ctx: DashboardContext) {
  const [
    newClients,
    newDesigners,
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
    prisma.client.count({ where: { AND: [ctx.access.client, { createdAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.designer.count({ where: { AND: [ctx.access.designer, { createdAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.designer.count({ where: { AND: [ctx.access.designer, { OR: [{ nextStepAt: null }, { nextStepText: null }] }] } }),
    prisma.designer.count({ where: { AND: [ctx.access.designer, { OR: [{ lastTouchAt: null }, { lastTouchAt: { lt: ctx.sixtyDaysAgo } }] }] } }),
    prisma.client.count({ where: { AND: [ctx.access.client, { nextContactAt: null }] } }),
    prisma.designer.count({ where: { AND: [ctx.access.designer, { potential: "A" }] } }),
    prisma.designer.count({ where: { AND: [ctx.access.designer, { relationshipStage: "SLEEPING" }] } }),
    prisma.client.count({ where: ctx.myAccess }),
    prisma.designer.count({ where: ctx.myAccess }),
    prisma.designer.count({
      where: {
        AND: [ctx.myAccess, { nextStepAt: { gte: ctx.today.start, lte: ctx.today.end } }]
      }
    }),
    prisma.designer.count({
      where: {
        AND: [
          ctx.myAccess,
          { OR: [{ nextStepAt: null }, { nextStepText: null }] }
        ]
      }
    }),
    prisma.client.count({
      where: {
        AND: [ctx.myAccess, { nextContactAt: null }]
      }
    }),
    prisma.designer.groupBy({
      by: ["relationshipStage"],
      where: ctx.access.designer,
      _count: { _all: true }
    })
  ]);

  return {
    newClients,
    newDesigners,
    designersWithoutTouch: designersWithoutTouch60,
    designersWithoutNextStep,
    designersWithoutTouch60,
    clientsWithoutNextContact,
    potentialADesigners,
    sleepingDesigners,
    activeDesignersByStage: groupRowsToCountMap(activeDesigners, "relationshipStage"),
    myClients,
    myDesigners,
    myDesignersToday,
    myDesignersWithoutNextStep,
    myClientsWithoutNextContact
  };
}
