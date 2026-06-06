import type { Prisma } from "@/generated/prisma/client";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clientAccessWhere,
  dealAccessWhere,
  designerAccessWhere,
  objectAccessWhere,
  objectParticipantAccessWhere,
  proposalAccessWhere,
  taskAccessWhere
} from "@/modules/crm/access-where";
import { dateOnlyRange, weekRange } from "@/modules/crm/date-ranges";
import {
  clientNameSelect,
  dealTitleSelect,
  designerNameSelect,
  objectTitleSelect,
  proposalNumberSelect,
  userSummarySelect
} from "@/modules/crm/selects";
import { computeBonusEligibilityStatus, getActiveViolationsForEntity, getActiveViolationsMap } from "@/modules/crm-discipline/service";
import { canViewRecord, type PermissionUser } from "@/permissions";

export type TaskListSearchParams = {
  q?: string;
  recordType?: string;
  responsibleId?: string;
  status?: string;
  priority?: string;
  due?: string;
  today?: string;
  overdue?: string;
  noResult?: string;
  entityType?: string;
  entityId?: string;
  page?: string;
};

export type TaskCalendarSearchParams = {
  date?: string;
  responsibleId?: string;
  mine?: string;
};

export type ActivityReportSearchParams = {
  from?: string;
  to?: string;
  responsibleId?: string;
  actionType?: string;
  entityType?: string;
};

const PAGE_SIZE = 30;

export { taskAccessWhere };

export function activeTaskWhere(now = new Date()): Prisma.TaskActivityWhereInput {
  return {
    recordType: "TASK",
    archivedAt: null,
    status: { notIn: ["DONE", "CANCELLED", "CLOSED"] },
    dueAt: { lt: now }
  };
}

export function taskInclude() {
  return {
    responsible: { select: userSummarySelect },
    createdBy: { select: userSummarySelect },
    client: { select: clientNameSelect },
    designer: { select: designerNameSelect },
    projectObject: { select: objectTitleSelect },
    deal: { select: dealTitleSelect },
    proposal: { select: proposalNumberSelect },
    objectParticipant: { select: { id: true, fullName: true, objectId: true } }
  } satisfies Prisma.TaskActivityInclude;
}

function linkedEntityWhere(entityType?: string, entityId?: string): Prisma.TaskActivityWhereInput | null {
  if (!entityType || !entityId) return null;
  if (entityType === "client") return { clientId: entityId };
  if (entityType === "designer") return { designerId: entityId };
  if (entityType === "object") return { objectId: entityId };
  if (entityType === "deal") return { dealId: entityId };
  if (entityType === "proposal") return { proposalId: entityId };
  if (entityType === "participant") return { objectParticipantId: entityId };
  return null;
}

export async function getTasks(params: TaskListSearchParams, user: PermissionUser) {
  const page = Math.max(Number(params.page ?? "1") || 1, 1);
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
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: taskInclude()
    }),
    prisma.taskActivity.count({ where })
  ]);
  const violations = await getActiveViolationsMap("TASK", rows.map((item) => item.id));
  const items = rows.map((item) => {
    const crmViolations = violations.get(item.id) ?? [];
    return {
      ...item,
      crmViolations,
      bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations, false)
    };
  });

  return {
    items,
    total,
    page,
    pageSize: PAGE_SIZE,
    pageCount: Math.max(Math.ceil(total / PAGE_SIZE), 1)
  };
}

export async function getTaskForUser(id: string, user: PermissionUser) {
  const task = await prisma.taskActivity.findUnique({
    where: { id },
    include: taskInclude()
  });

  if (!task || !canViewRecord(user, task)) {
    notFound();
  }

  const crmViolations = await getActiveViolationsForEntity("TASK", task.id);
  return {
    ...task,
    crmViolations,
    bonusEligibilityStatus: computeBonusEligibilityStatus(crmViolations, false)
  };
}

export async function getTaskFormContext(user: PermissionUser) {
  const [users, clients, designers, objects, deals, proposals, participants] = await Promise.all([
    prisma.user.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: userSummarySelect }),
    prisma.client.findMany({ where: clientAccessWhere(user), orderBy: { name: "asc" }, select: { id: true, name: true, responsibleId: true } }),
    prisma.designer.findMany({ where: designerAccessWhere(user), orderBy: { name: "asc" }, select: { id: true, name: true, studio: true, responsibleId: true } }),
    prisma.projectObject.findMany({ where: objectAccessWhere(user), orderBy: { title: "asc" }, select: { id: true, title: true, clientId: true, designerId: true, responsibleId: true } }),
    prisma.deal.findMany({ where: dealAccessWhere(user), orderBy: { title: "asc" }, select: { id: true, title: true, clientId: true, objectId: true, designerId: true, responsibleId: true } }),
    prisma.commercialProposal.findMany({ where: proposalAccessWhere(user), orderBy: { createdAt: "desc" }, select: { id: true, proposalNumber: true, dealId: true, clientId: true, objectId: true, designerId: true, responsibleId: true } }),
    prisma.projectObjectParticipant.findMany({
      where: { AND: [objectParticipantAccessWhere(user), { archivedAt: null }] },
      orderBy: { fullName: "asc" },
      select: { id: true, fullName: true, objectId: true, responsibleId: true }
    })
  ]);

  return { users, clients, designers, objects, deals, proposals, participants };
}

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
