import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { dateOnlyRange } from "@/modules/crm/date-ranges";
import { pageFromParam, paginatedResult } from "@/modules/crm/pagination";
import { withCrmViolations } from "@/modules/crm/violation-enrichment";
import type { PermissionUser } from "@/permissions";
import {
  activeTaskWhere,
  linkedEntityWhere,
  taskAccessWhere,
  taskInclude,
  TASK_PAGE_SIZE,
  type TaskListSearchParams
} from "@/modules/tasks/query-shared";

export async function getTasks(params: TaskListSearchParams, user: PermissionUser) {
  const page = pageFromParam(params.page);
  const now = new Date();
  const filters: Prisma.TaskActivityWhereInput[] = [taskAccessWhere(user), { archivedAt: null }];

  if (params.q) {
    filters.push({
      OR: [
        { title: { contains: params.q, mode: "insensitive" } },
        { description: { contains: params.q, mode: "insensitive" } },
        { result: { contains: params.q, mode: "insensitive" } }
      ]
    });
  }
  if (params.recordType) filters.push({ recordType: params.recordType as never });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (params.status) filters.push({ status: params.status as never });
  if (params.priority) filters.push({ priority: params.priority as never });
  if (params.noResult === "1") filters.push({ result: null });
  if (params.today === "1") {
    const range = dateOnlyRange();
    if (range) filters.push({ dueAt: { gte: range.start, lte: range.end } });
  }
  if (params.overdue === "1") filters.push(activeTaskWhere(now));
  if (params.due) {
    const range = dateOnlyRange(params.due);
    if (range) filters.push({ dueAt: { gte: range.start, lte: range.end } });
  }
  const entityFilter = linkedEntityWhere(params.entityType, params.entityId);
  if (entityFilter) filters.push(entityFilter);

  const where: Prisma.TaskActivityWhereInput = { AND: filters };
  const [rows, total] = await Promise.all([
    prisma.taskActivity.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * TASK_PAGE_SIZE,
      take: TASK_PAGE_SIZE,
      include: taskInclude()
    }),
    prisma.taskActivity.count({ where })
  ]);
  const items = await withCrmViolations("TASK", rows, false);
  return paginatedResult(items, total, page, TASK_PAGE_SIZE);
}
