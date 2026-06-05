import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canViewAllData, type PermissionUser } from "@/permissions";

function accessWhere(user: PermissionUser): {
  client: Prisma.ClientWhereInput;
  designer: Prisma.DesignerWhereInput;
  object: Prisma.ProjectObjectWhereInput;
} {
  if (canViewAllData(user)) {
    return { client: {}, designer: {}, object: {} };
  }

  return {
    client: { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
    designer: { OR: [{ responsibleId: user.id }, { createdById: user.id }] },
    object: { OR: [{ responsibleId: user.id }, { createdById: user.id }] }
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
    newObjects,
    frozenObjects,
    lostObjects,
    objectsWithoutNextStep,
    objectsWithoutResponsible,
    objectsWithoutClient,
    objectsFromDesigners,
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
    activeDesigners,
    activeObjectsByStage,
    topDesignersByObjects
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
