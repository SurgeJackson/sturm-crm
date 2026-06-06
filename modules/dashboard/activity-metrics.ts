import { prisma } from "@/lib/prisma";
import type { DashboardContext } from "@/modules/dashboard/context";
import { closedTaskStatuses } from "@/modules/crm/domain-constants";
import { getUserNameMap, namedCountRows, uniqueIds } from "@/modules/dashboard/utils";

export async function getActivityMetrics(ctx: DashboardContext) {
  const [
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
    managerActivity
  ] = await Promise.all([
    prisma.taskActivity.count({
      where: {
        AND: [
          ctx.access.task,
          { recordType: "TASK", archivedAt: null, status: { notIn: closedTaskStatuses }, dueAt: { lt: ctx.now } }
        ]
      }
    }),
    prisma.taskActivity.count({
      where: {
        AND: [
          ctx.access.task,
          { recordType: "TASK", archivedAt: null, status: { notIn: closedTaskStatuses }, dueAt: { gte: ctx.today.start, lte: ctx.today.end } }
        ]
      }
    }),
    prisma.taskActivity.count({ where: { AND: [ctx.access.task, { archivedAt: null, result: null }] } }),
    prisma.taskActivity.count({ where: { AND: [ctx.access.task, { recordType: "TASK", status: "DONE", completedAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.taskActivity.count({ where: { AND: [ctx.access.task, { recordType: "TOUCH", completedAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.taskActivity.groupBy({
      by: ["responsibleId"],
      where: { AND: [ctx.access.task, { recordType: "TASK", archivedAt: null, status: { notIn: closedTaskStatuses }, dueAt: { lt: ctx.now } }] },
      _count: { _all: true }
    }),
    prisma.taskActivity.count({
      where: {
        AND: [
          { responsibleId: ctx.user.id },
          { recordType: "TASK", archivedAt: null, status: { notIn: closedTaskStatuses }, dueAt: { gte: ctx.today.start, lte: ctx.today.end } }
        ]
      }
    }),
    prisma.taskActivity.count({
      where: {
        AND: [
          { responsibleId: ctx.user.id },
          { recordType: "TASK", archivedAt: null, status: { notIn: closedTaskStatuses }, dueAt: { lt: ctx.now } }
        ]
      }
    }),
    prisma.taskActivity.count({
      where: {
        AND: [
          { responsibleId: ctx.user.id },
          { recordType: "TASK", archivedAt: null, dueAt: { gte: ctx.today.start, lte: ctx.weekEnd } }
        ]
      }
    }),
    prisma.taskActivity.count({ where: { responsibleId: ctx.user.id, recordType: "TOUCH", completedAt: { gte: ctx.sevenDaysAgo } } }),
    prisma.taskActivity.count({
      where: {
        responsibleId: ctx.user.id,
        recordType: "TASK",
        actionType: "FOLLOW_UP",
        archivedAt: null,
        status: { notIn: closedTaskStatuses }
      }
    }),
    prisma.taskActivity.groupBy({
      by: ["responsibleId", "recordType", "status"],
      where: { AND: [ctx.access.task, { createdAt: { gte: ctx.sevenDaysAgo } }] },
      _count: { _all: true }
    })
  ]);

  const responsibleIds = uniqueIds([
    ...overdueTasksByResponsible.map((row) => row.responsibleId),
    ...managerActivity.map((row) => row.responsibleId)
  ]);
  const responsibleNames = await getUserNameMap(responsibleIds);

  const managerActivityCounts = managerActivity.reduce<Record<string, { name: string; tasks: number; done: number; touches: number }>>((acc, item) => {
    acc[item.responsibleId] ??= { name: responsibleNames.get(item.responsibleId) ?? "Не назначен", tasks: 0, done: 0, touches: 0 };
    if (item.recordType === "TASK") acc[item.responsibleId].tasks += item._count._all;
    if (item.status === "DONE" || item.status === "CLOSED") acc[item.responsibleId].done += item._count._all;
    if (item.recordType === "TOUCH") acc[item.responsibleId].touches += item._count._all;
    return acc;
  }, {});

  return {
    overdueTasks,
    tasksToday,
    tasksWithoutResult,
    doneTasksPeriod,
    touchesPeriod,
    overdueTaskResponsibleCounts: namedCountRows(overdueTasksByResponsible, responsibleNames),
    myTasksToday,
    myOverdueTasks,
    myTasksWeek,
    myRecentTouches,
    myFollowUps,
    managerActivityCounts: Object.values(managerActivityCounts).sort((a, b) => b.tasks + b.touches - (a.tasks + a.touches))
  };
}
