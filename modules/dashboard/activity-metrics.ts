import { prisma } from "@/lib/prisma";
import type { DashboardContext } from "@/modules/dashboard/context";

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
          { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { lt: ctx.now } }
        ]
      }
    }),
    prisma.taskActivity.count({
      where: {
        AND: [
          ctx.access.task,
          { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { gte: ctx.today.start, lte: ctx.today.end } }
        ]
      }
    }),
    prisma.taskActivity.count({ where: { AND: [ctx.access.task, { archivedAt: null, result: null }] } }),
    prisma.taskActivity.count({ where: { AND: [ctx.access.task, { recordType: "TASK", status: "DONE", completedAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.taskActivity.count({ where: { AND: [ctx.access.task, { recordType: "TOUCH", completedAt: { gte: ctx.sevenDaysAgo } }] } }),
    prisma.taskActivity.findMany({
      where: { AND: [ctx.access.task, { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { lt: ctx.now } }] },
      select: { responsible: { select: { id: true, name: true } } }
    }),
    prisma.taskActivity.count({
      where: {
        AND: [
          { responsibleId: ctx.user.id },
          { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { gte: ctx.today.start, lte: ctx.today.end } }
        ]
      }
    }),
    prisma.taskActivity.count({
      where: {
        AND: [
          { responsibleId: ctx.user.id },
          { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { lt: ctx.now } }
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
        status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }
      }
    }),
    prisma.taskActivity.findMany({
      where: { AND: [ctx.access.task, { createdAt: { gte: ctx.sevenDaysAgo } }] },
      select: {
        recordType: true,
        status: true,
        responsible: { select: { id: true, name: true } }
      }
    })
  ]);

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
    managerActivityCounts: Object.values(managerActivityCounts).sort((a, b) => b.tasks + b.touches - (a.tasks + a.touches))
  };
}
