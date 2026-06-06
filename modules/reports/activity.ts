import type { Prisma, TaskActionType, UserRole } from "@/generated/prisma/client";
import { roleLabels, taskActionTypeLabels } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { closedTaskStatuses } from "@/modules/crm/domain-constants";
import { enumParam } from "@/modules/crm/param-parsing";
import { canViewAllData, type PermissionUser } from "@/permissions";
import { periodWhere, reportPeriod, type ReportSearchParams } from "./common";

type VisibleEmployee = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type OwnableRecord = {
  id: string;
  responsibleId: string;
  createdById: string;
};

type ProposalRecord = OwnableRecord & { amount: number };

type ActivityMaps = {
  clients: Map<string, number>;
  designers: Map<string, number>;
  objects: Map<string, number>;
  deals: Map<string, number>;
  proposals: Map<string, number>;
  proposalAmount: Map<string, number>;
  tasks: Map<string, number>;
  doneTasks: Map<string, number>;
  overdueTasks: Map<string, number>;
  touches: Map<string, number>;
  calls: Map<string, number>;
  meetings: Map<string, number>;
  email: Map<string, number>;
  messengers: Map<string, number>;
  followUps: Map<string, number>;
  presentations: Map<string, number>;
  outsideMeetings: Map<string, number>;
};

function increment(map: Map<string, number>, key: string, amount = 1) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

function countOwnableRecords(records: OwnableRecord[], visibleUserIds: Set<string>) {
  const counts = new Map<string, number>();
  for (const record of records) {
    const owners = new Set([record.responsibleId, record.createdById].filter((id) => visibleUserIds.has(id)));
    for (const ownerId of owners) increment(counts, ownerId);
  }
  return counts;
}

function sumProposalAmounts(records: ProposalRecord[], visibleUserIds: Set<string>) {
  const sums = new Map<string, number>();
  for (const record of records) {
    const owners = new Set([record.responsibleId, record.createdById].filter((id) => visibleUserIds.has(id)));
    for (const ownerId of owners) increment(sums, ownerId, record.amount);
  }
  return sums;
}

function countTaskGroups(rows: Array<{ responsibleId: string; _count: { _all: number } }>) {
  return new Map(rows.map((row) => [row.responsibleId, row._count._all]));
}

export function buildEmployeeActivityRows(employees: VisibleEmployee[], maps: ActivityMaps) {
  return employees.map((employee) => ({
    employee,
    clients: maps.clients.get(employee.id) ?? 0,
    designers: maps.designers.get(employee.id) ?? 0,
    objects: maps.objects.get(employee.id) ?? 0,
    deals: maps.deals.get(employee.id) ?? 0,
    proposals: maps.proposals.get(employee.id) ?? 0,
    proposalAmount: maps.proposalAmount.get(employee.id) ?? 0,
    tasks: maps.tasks.get(employee.id) ?? 0,
    doneTasks: maps.doneTasks.get(employee.id) ?? 0,
    overdueTasks: maps.overdueTasks.get(employee.id) ?? 0,
    touches: maps.touches.get(employee.id) ?? 0,
    calls: maps.calls.get(employee.id) ?? 0,
    meetings: maps.meetings.get(employee.id) ?? 0,
    email: maps.email.get(employee.id) ?? 0,
    messengers: maps.messengers.get(employee.id) ?? 0,
    followUps: maps.followUps.get(employee.id) ?? 0,
    presentations: maps.presentations.get(employee.id) ?? 0,
    outsideMeetings: maps.outsideMeetings.get(employee.id) ?? 0
  }));
}

export async function getEmployeeActivityReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const role = enumParam(params.role, roleLabels);
  const actionType = enumParam(params.actionType, taskActionTypeLabels);
  const visibleUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(canViewAllData(user)
        ? {
            ...(params.responsibleId ? { id: params.responsibleId } : {}),
            ...(role ? { role } : {})
          }
        : { id: user.id })
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true }
  });
  const visibleUserIds = new Set(visibleUsers.map((employee) => employee.id));
  const visibleOwnerWhere = {
    OR: [
      { responsibleId: { in: [...visibleUserIds] } },
      { createdById: { in: [...visibleUserIds] } }
    ]
  };
  const taskResponsibleWhere = { responsibleId: { in: [...visibleUserIds] } };
  const period = periodWhere(from, to);
  const actionFilter = actionType ? { actionType } satisfies Pick<Prisma.TaskActivityWhereInput, "actionType"> : {};
  const now = new Date();

  if (visibleUsers.length === 0) {
    return { period: { from, to }, rows: [] };
  }

  const [
    clients,
    designers,
    objects,
    deals,
    proposals,
    tasks,
    doneTasks,
    overdueTasks,
    touches,
    calls,
    meetings,
    email,
    messengers,
    followUps,
    presentations,
    outsideMeetings
  ] = await Promise.all([
    prisma.client.findMany({ where: { AND: [visibleOwnerWhere, { createdAt: period }] }, select: { id: true, responsibleId: true, createdById: true } }),
    prisma.designer.findMany({ where: { AND: [visibleOwnerWhere, { createdAt: period }] }, select: { id: true, responsibleId: true, createdById: true } }),
    prisma.projectObject.findMany({ where: { AND: [visibleOwnerWhere, { createdAt: period }] }, select: { id: true, responsibleId: true, createdById: true } }),
    prisma.deal.findMany({ where: { AND: [visibleOwnerWhere, { createdAt: period }] }, select: { id: true, responsibleId: true, createdById: true } }),
    prisma.commercialProposal.findMany({ where: { AND: [visibleOwnerWhere, { createdAt: period }] }, select: { id: true, responsibleId: true, createdById: true, amount: true } }),
    prisma.taskActivity.groupBy({ by: ["responsibleId"], where: { ...taskResponsibleWhere, recordType: "TASK", createdAt: period, ...actionFilter }, _count: { _all: true } }),
    prisma.taskActivity.groupBy({ by: ["responsibleId"], where: { ...taskResponsibleWhere, recordType: "TASK", status: "DONE", completedAt: period, ...actionFilter }, _count: { _all: true } }),
    prisma.taskActivity.groupBy({ by: ["responsibleId"], where: { ...taskResponsibleWhere, recordType: "TASK", dueAt: { lt: now }, status: { notIn: closedTaskStatuses }, ...actionFilter }, _count: { _all: true } }),
    prisma.taskActivity.groupBy({ by: ["responsibleId"], where: { ...taskResponsibleWhere, recordType: "TOUCH", completedAt: period, ...actionFilter }, _count: { _all: true } }),
    prisma.taskActivity.groupBy({ by: ["responsibleId"], where: { ...taskResponsibleWhere, actionType: { in: ["CALL", "INCOMING_CALL"] as TaskActionType[] }, createdAt: period }, _count: { _all: true } }),
    prisma.taskActivity.groupBy({ by: ["responsibleId"], where: { ...taskResponsibleWhere, actionType: { in: ["SHOWROOM_MEETING", "OUTSIDE_MEETING"] as TaskActionType[] }, createdAt: period }, _count: { _all: true } }),
    prisma.taskActivity.groupBy({ by: ["responsibleId"], where: { ...taskResponsibleWhere, actionType: "EMAIL", createdAt: period }, _count: { _all: true } }),
    prisma.taskActivity.groupBy({ by: ["responsibleId"], where: { ...taskResponsibleWhere, actionType: { in: ["WHATSAPP", "TELEGRAM"] as TaskActionType[] }, createdAt: period }, _count: { _all: true } }),
    prisma.taskActivity.groupBy({ by: ["responsibleId"], where: { ...taskResponsibleWhere, actionType: "FOLLOW_UP", createdAt: period }, _count: { _all: true } }),
    prisma.taskActivity.groupBy({ by: ["responsibleId"], where: { ...taskResponsibleWhere, actionType: "PRESENTATION", createdAt: period }, _count: { _all: true } }),
    prisma.taskActivity.groupBy({ by: ["responsibleId"], where: { ...taskResponsibleWhere, actionType: "OUTSIDE_MEETING", createdAt: period }, _count: { _all: true } })
  ]);

  return {
    period: { from, to },
    rows: buildEmployeeActivityRows(visibleUsers, {
      clients: countOwnableRecords(clients, visibleUserIds),
      designers: countOwnableRecords(designers, visibleUserIds),
      objects: countOwnableRecords(objects, visibleUserIds),
      deals: countOwnableRecords(deals, visibleUserIds),
      proposals: countOwnableRecords(proposals, visibleUserIds),
      proposalAmount: sumProposalAmounts(proposals, visibleUserIds),
      tasks: countTaskGroups(tasks),
      doneTasks: countTaskGroups(doneTasks),
      overdueTasks: countTaskGroups(overdueTasks),
      touches: countTaskGroups(touches),
      calls: countTaskGroups(calls),
      meetings: countTaskGroups(meetings),
      email: countTaskGroups(email),
      messengers: countTaskGroups(messengers),
      followUps: countTaskGroups(followUps),
      presentations: countTaskGroups(presentations),
      outsideMeetings: countTaskGroups(outsideMeetings)
    })
  };
}
