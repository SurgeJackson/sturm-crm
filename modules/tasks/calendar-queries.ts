import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { weekRange } from "@/modules/crm/date-ranges";
import type { PermissionUser } from "@/permissions";
import { taskAccessWhere, taskInclude, type TaskCalendarSearchParams } from "@/modules/tasks/query-shared";

export async function getTaskCalendar(params: TaskCalendarSearchParams, user: PermissionUser) {
  const range = weekRange(params.date);
  const filters: Prisma.TaskActivityWhereInput[] = [
    taskAccessWhere(user),
    { archivedAt: null, dueAt: { gte: range.start, lte: range.end } }
  ];
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.mine === "1") filters.push({ responsibleId: user.id });

  const items = await prisma.taskActivity.findMany({
    where: { AND: filters },
    orderBy: [{ dueAt: "asc" }, { priority: "desc" }],
    include: taskInclude()
  });

  const days = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(range.start);
    start.setDate(start.getDate() + index);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    return {
      date: start,
      items: items.filter((item) => item.dueAt && item.dueAt >= start && item.dueAt <= end)
    };
  });

  return { range, days };
}
