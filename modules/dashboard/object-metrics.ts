import { prisma } from "@/lib/prisma";
import type { DashboardContext } from "@/modules/dashboard/context";
import { groupRowsToCountMap } from "@/modules/dashboard/utils";

export async function getObjectMetrics(ctx: DashboardContext) {
  const [
    activeObjects,
    newObjects,
    frozenObjects,
    lostObjects,
    objectsWithoutNextStep,
    objectsWithoutResponsible,
    objectsWithoutClient,
    objectsFromDesigners,
    activeObjectsByStage,
    topDesignersByObjects
  ] = await Promise.all([
    prisma.projectObject.count({ where: { AND: [ctx.access.object, { status: "ACTIVE" }] } }),
    prisma.projectObject.count({ where: { AND: [ctx.access.object, { createdAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.projectObject.count({ where: { AND: [ctx.access.object, { OR: [{ status: "FROZEN" }, { stage: "FROZEN" }] }] } }),
    prisma.projectObject.count({ where: { AND: [ctx.access.object, { OR: [{ status: "LOST" }, { stage: "LOST" }] }] } }),
    prisma.projectObject.count({ where: { AND: [ctx.access.object, { tasks: { none: { archivedAt: null } } }] } }),
    prisma.projectObject.count({ where: { AND: [ctx.access.object, { responsibleId: "" }] } }),
    prisma.projectObject.count({ where: { AND: [ctx.access.object, { clientId: "" }] } }),
    prisma.projectObject.count({ where: { AND: [ctx.access.object, { designerId: { not: null } }] } }),
    prisma.projectObject.groupBy({
      by: ["stage"],
      where: ctx.access.object,
      _count: { _all: true }
    }),
    prisma.designer.findMany({
      where: ctx.access.designer,
      orderBy: { transferredObjectsCount: "desc" },
      take: 5,
      select: { id: true, name: true, studio: true, transferredObjectsCount: true }
    })
  ]);

  return {
    activeObjects,
    newObjects,
    frozenObjects,
    lostObjects,
    objectsWithoutNextStep,
    objectsWithoutResponsible,
    objectsWithoutClient,
    objectsFromDesigners,
    objectsByStage: groupRowsToCountMap(activeObjectsByStage, "stage"),
    topDesignersByObjects
  };
}
