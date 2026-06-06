import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { weekRange } from "@/modules/crm/date-ranges";
import type { PermissionUser } from "@/permissions";
import { linkedEntityWhere, taskAccessWhere, taskInclude, type ActivityReportSearchParams } from "@/modules/tasks/query-shared";

export async function getActivityReport(params: ActivityReportSearchParams, user: PermissionUser) {
  const now = new Date();
  const fallback = weekRange();
  const from = params.from ? new Date(`${params.from}T00:00:00.000`) : fallback.start;
  const to = params.to ? new Date(`${params.to}T23:59:59.999`) : fallback.end;
  const filters: Prisma.TaskActivityWhereInput[] = [taskAccessWhere(user), { createdAt: { gte: from, lte: to } }];
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.actionType) filters.push({ actionType: params.actionType as never });
  const entityFilter = linkedEntityWhere(params.entityType, "__any__");
  if (entityFilter && params.entityType) {
    const field = Object.keys(entityFilter)[0] as keyof Prisma.TaskActivityWhereInput;
    filters.push({ [field]: { not: null } } as Prisma.TaskActivityWhereInput);
  }

  const where: Prisma.TaskActivityWhereInput = { AND: filters };
  const [items, users] = await Promise.all([
    prisma.taskActivity.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: taskInclude()
    }),
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } })
  ]);

  const byResponsible = items.reduce<Record<string, { name: string; created: number; done: number; overdue: number; touches: number }>>((acc, item) => {
    acc[item.responsibleId] ??= { name: item.responsible.name, created: 0, done: 0, overdue: 0, touches: 0 };
    acc[item.responsibleId].created += item.recordType === "TASK" ? 1 : 0;
    acc[item.responsibleId].done += item.status === "DONE" || item.status === "CLOSED" ? 1 : 0;
    acc[item.responsibleId].overdue += item.recordType === "TASK" && item.dueAt && item.dueAt < now && !["DONE", "CANCELLED", "CLOSED"].includes(item.status) ? 1 : 0;
    acc[item.responsibleId].touches += item.recordType === "TOUCH" ? 1 : 0;
    return acc;
  }, {});

  return {
    items,
    users,
    from,
    to,
    totals: {
      createdTasks: items.filter((item) => item.recordType === "TASK").length,
      doneTasks: items.filter((item) => item.status === "DONE").length,
      overdueTasks: items.filter((item) => item.recordType === "TASK" && item.dueAt && item.dueAt < now && !["DONE", "CANCELLED", "CLOSED"].includes(item.status)).length,
      touches: items.filter((item) => item.recordType === "TOUCH").length,
      calls: items.filter((item) => item.actionType === "CALL" || item.actionType === "INCOMING_CALL").length,
      meetings: items.filter((item) => item.actionType === "SHOWROOM_MEETING" || item.actionType === "OUTSIDE_MEETING").length,
      proposals: items.filter((item) => item.actionType === "PROPOSAL_SENT").length,
      followUps: items.filter((item) => item.actionType === "FOLLOW_UP").length
    },
    byResponsible: Object.values(byResponsible)
  };
}
