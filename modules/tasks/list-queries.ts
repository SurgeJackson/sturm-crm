import type { Prisma } from "@/generated/prisma/client";
import { taskPriorityLabels, taskRecordTypeLabels, taskStatusLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { dateOnlyRange } from "@/modules/crm/date-ranges";
import { paginatedQuery } from "@/modules/crm/list-query";
import { enumParam, flagParam } from "@/modules/crm/param-parsing";
import { pageFromParam } from "@/modules/crm/pagination";
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
  const recordType = enumParam(params.recordType, taskRecordTypeLabels);
  const status = enumParam(params.status, taskStatusLabels);
  const priority = enumParam(params.priority, taskPriorityLabels);
  if (recordType) filters.push({ recordType });
  if (params.responsibleId) filters.push({ responsibleId: params.responsibleId });
  if (status) filters.push({ status });
  if (priority) filters.push({ priority });
  if (flagParam(params.noResult)) filters.push({ result: null });
  if (flagParam(params.today)) {
    const range = dateOnlyRange();
    if (range) filters.push({ dueAt: { gte: range.start, lte: range.end } });
  }
  if (flagParam(params.overdue)) filters.push(activeTaskWhere(now));
  if (params.due) {
    const range = dateOnlyRange(params.due);
    if (range) filters.push({ dueAt: { gte: range.start, lte: range.end } });
  }
  const entityFilter = linkedEntityWhere(params.entityType, params.entityId);
  if (entityFilter) filters.push(entityFilter);

  const where: Prisma.TaskActivityWhereInput = { AND: filters };
  return paginatedQuery({
    page,
    pageSize: TASK_PAGE_SIZE,
    findRows: () => prisma.taskActivity.findMany({
      where,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * TASK_PAGE_SIZE,
      take: TASK_PAGE_SIZE,
      include: taskInclude()
    }),
    countRows: () => prisma.taskActivity.count({ where }),
    mapRows: (rows) => withCrmViolations("TASK", rows, false)
  });
}
