import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { canViewAllData, type PermissionUser } from "@/permissions";

export type ReportSearchParams = {
  from?: string;
  to?: string;
  responsibleId?: string;
  role?: string;
  status?: string;
  stage?: string;
  source?: string;
  probability?: string;
  designerId?: string;
  objectId?: string;
  clientId?: string;
  city?: string;
  type?: string;
  actionType?: string;
  severity?: string;
};

export type Metric = {
  title: string;
  value: string | number;
  tone?: "default" | "secondary" | "warning" | "outline";
};

export type ProblemRow = {
  area: string;
  issue: string;
  severity: "critical" | "medium" | "light";
  responsibleId: string | null;
  responsibleName: string;
  entity: string;
  title: string;
  href: string;
};

const criticalStatuses = new Set(["DONE", "CANCELLED", "CLOSED"]);

function dateValue(value: string | undefined, fallback: Date) {
  if (!value) return fallback;
  const date = new Date(`${value}T00:00:00.000`);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function reportPeriod(params: ReportSearchParams) {
  const to = params.to ? new Date(`${params.to}T23:59:59.999`) : new Date();
  const fromFallback = new Date(to);
  fromFallback.setDate(fromFallback.getDate() - 7);
  const from = dateValue(params.from, fromFallback);
  return { from, to };
}

function ownership(user: PermissionUser): Prisma.StringFilter | string | undefined {
  return canViewAllData(user) ? undefined : user.id;
}

function ownerWhere(user: PermissionUser, responsibleId?: string) {
  if (canViewAllData(user)) {
    return responsibleId ? { responsibleId } : {};
  }
  return { OR: [{ responsibleId: user.id }, { createdById: user.id }] };
}

function taskOwnerWhere(user: PermissionUser, responsibleId?: string) {
  if (canViewAllData(user)) {
    return responsibleId ? { responsibleId } : {};
  }
  return { OR: [{ responsibleId: user.id }, { createdById: user.id }] };
}

function periodWhere(from: Date, to: Date): Prisma.DateTimeFilter {
  return { gte: from, lte: to };
}

function groupBy<T extends string | null | undefined>(items: T[]) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = item ?? "Не указано";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function sum(values: Array<number | null>) {
  return values.reduce<number>((acc, value) => acc + (value ?? 0), 0);
}

export async function getReportFilterOptions(user: PermissionUser) {
  const visible = ownerWhere(user);
  const [users, clients, designers, objects, deals] = await Promise.all([
    prisma.user.findMany({
      where: canViewAllData(user) ? { isActive: true } : { id: user.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, role: true }
    }),
    prisma.client.findMany({ where: visible, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.designer.findMany({ where: visible, orderBy: { name: "asc" }, select: { id: true, name: true, studio: true } }),
    prisma.projectObject.findMany({ where: visible, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.deal.findMany({ where: visible, orderBy: { title: "asc" }, select: { id: true, title: true } })
  ]);

  return { users, clients, designers, objects, deals };
}

export async function getManagerDashboardReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const responsibleId = canViewAllData(user) ? params.responsibleId : undefined;
  const owner = ownerWhere(user, responsibleId);
  const taskOwner = taskOwnerWhere(user, responsibleId);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const thinking7 = new Date();
  thinking7.setDate(thinking7.getDate() - 7);
  const activeDeal: Prisma.DealWhereInput = { archivedAt: null, stage: { notIn: ["LOST", "COMPLETED"] } };

  const [
    activeDeals,
    activeDealsAmount,
    periodProposals,
    periodProposalsAmount,
    acceptedProposals,
    declinedProposals,
    waitingDeals,
    negotiationDeals,
    dealsWithoutNextStep,
    newDesigners,
    activeDesigners,
    designersWithoutNextStep,
    designersWithoutTouch60,
    potentialADesigners,
    firstObjectDesigners,
    keyPartners,
    newObjects,
    calculationObjects,
    approvalObjects,
    frozenObjects,
    lostObjects,
    objectsWithoutTasks,
    tasksToday,
    overdueTasks,
    doneTasks,
    touches,
    proposalNoFollowUp,
    clientsWithoutNextContact,
    overdueByResponsible,
    proposalThinkingRows
  ] = await Promise.all([
    prisma.deal.count({ where: { AND: [owner, activeDeal] } }),
    prisma.deal.aggregate({ where: { AND: [owner, activeDeal] }, _sum: { potentialAmount: true } }),
    prisma.commercialProposal.count({ where: { AND: [owner, { createdAt: periodWhere(from, to) }] } }),
    prisma.commercialProposal.aggregate({ where: { AND: [owner, { createdAt: periodWhere(from, to) }] }, _sum: { amount: true } }),
    prisma.commercialProposal.count({ where: { AND: [owner, { status: "ACCEPTED", updatedAt: periodWhere(from, to) }] } }),
    prisma.commercialProposal.count({ where: { AND: [owner, { status: "DECLINED", updatedAt: periodWhere(from, to) }] } }),
    prisma.deal.count({ where: { AND: [owner, activeDeal, { stage: "WAITING_DECISION" }] } }),
    prisma.deal.count({ where: { AND: [owner, activeDeal, { stage: "NEGOTIATION" }] } }),
    prisma.deal.count({ where: { AND: [owner, activeDeal, { OR: [{ nextActionAt: null }, { nextActionText: null }] }] } }),
    prisma.designer.count({ where: { AND: [owner, { createdAt: periodWhere(from, to) }] } }),
    prisma.designer.count({ where: { AND: [owner, { status: "ACTIVE" }] } }),
    prisma.designer.count({ where: { AND: [owner, { OR: [{ nextStepAt: null }, { nextStepText: null }] }] } }),
    prisma.designer.count({ where: { AND: [owner, { OR: [{ lastTouchAt: null }, { lastTouchAt: { lt: sixtyDaysAgo } }] }] } }),
    prisma.designer.count({ where: { AND: [owner, { potential: "A" }] } }),
    prisma.designer.count({ where: { AND: [owner, { relationshipStage: "FIRST_OBJECT_RECEIVED" }] } }),
    prisma.designer.count({ where: { AND: [owner, { relationshipStage: "KEY_PARTNER" }] } }),
    prisma.projectObject.count({ where: { AND: [owner, { createdAt: periodWhere(from, to) }] } }),
    prisma.projectObject.count({ where: { AND: [owner, { stage: "CALCULATION" }] } }),
    prisma.projectObject.count({ where: { AND: [owner, { stage: "APPROVAL" }] } }),
    prisma.projectObject.count({ where: { AND: [owner, { OR: [{ status: "FROZEN" }, { stage: "FROZEN" }] }] } }),
    prisma.projectObject.count({ where: { AND: [owner, { OR: [{ status: "LOST" }, { stage: "LOST" }] }] } }),
    prisma.projectObject.count({ where: { AND: [owner, { status: "ACTIVE", tasks: { none: { archivedAt: null } } }] } }),
    prisma.taskActivity.count({ where: { AND: [taskOwner, { recordType: "TASK", archivedAt: null, dueAt: periodWhere(new Date(new Date().setHours(0, 0, 0, 0)), new Date(new Date().setHours(23, 59, 59, 999))) }] } }),
    prisma.taskActivity.count({ where: { AND: [taskOwner, { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { lt: new Date() } }] } }),
    prisma.taskActivity.count({ where: { AND: [taskOwner, { recordType: "TASK", status: "DONE", completedAt: periodWhere(from, to) }] } }),
    prisma.taskActivity.count({ where: { AND: [taskOwner, { recordType: "TOUCH", completedAt: periodWhere(from, to) }] } }),
    prisma.commercialProposal.count({ where: { AND: [owner, { archivedAt: null, nextTouchAt: null, status: { notIn: ["ACCEPTED", "DECLINED", "ARCHIVED"] } }] } }),
    prisma.client.count({ where: { AND: [owner, { status: "ACTIVE", nextContactAt: null }] } }),
    prisma.taskActivity.findMany({
      where: { AND: [taskOwner, { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { lt: new Date() } }] },
      select: { responsible: { select: { id: true, name: true } } }
    }),
    prisma.commercialProposal.findMany({
      where: { AND: [owner, { status: "CLIENT_THINKING", sentAt: { lt: thinking7 } }] },
      select: { id: true, proposalNumber: true, responsible: { select: { name: true } } },
      take: 10
    })
  ]);

  const overdueByUser = overdueByResponsible.reduce<Record<string, { name: string; count: number }>>((acc, task) => {
    acc[task.responsible.id] = {
      name: task.responsible.name,
      count: (acc[task.responsible.id]?.count ?? 0) + 1
    };
    return acc;
  }, {});

  return {
    period: { from, to },
    metrics: [
      { title: "Активные сделки", value: activeDeals },
      { title: "Сумма активных сделок", value: `${(activeDealsAmount._sum.potentialAmount ?? 0).toLocaleString("ru-RU")} ₽` },
      { title: "КП за период", value: periodProposals },
      { title: "Сумма КП за период", value: `${(periodProposalsAmount._sum.amount ?? 0).toLocaleString("ru-RU")} ₽` },
      { title: "Принятые КП", value: acceptedProposals, tone: "secondary" as const },
      { title: "Отклоненные КП", value: declinedProposals, tone: "warning" as const },
      { title: "Сделки ждут решения", value: waitingDeals },
      { title: "Сделки на согласовании", value: negotiationDeals },
      { title: "Сделки без шага", value: dealsWithoutNextStep, tone: "warning" as const },
      { title: "Новые дизайнеры", value: newDesigners },
      { title: "Активные дизайнеры", value: activeDesigners },
      { title: "Дизайнеры без шага", value: designersWithoutNextStep, tone: "warning" as const },
      { title: "Дизайнеры без касаний 60+", value: designersWithoutTouch60, tone: "warning" as const },
      { title: "Потенциал A", value: potentialADesigners },
      { title: "Первый объект получен", value: firstObjectDesigners },
      { title: "Ключевые партнеры", value: keyPartners },
      { title: "Новые объекты", value: newObjects },
      { title: "Объекты в расчете", value: calculationObjects },
      { title: "Объекты в согласовании", value: approvalObjects },
      { title: "Замороженные объекты", value: frozenObjects, tone: "warning" as const },
      { title: "Потерянные объекты", value: lostObjects, tone: "warning" as const },
      { title: "Объекты без задач", value: objectsWithoutTasks, tone: "warning" as const },
      { title: "Задачи на сегодня", value: tasksToday },
      { title: "Просроченные задачи", value: overdueTasks, tone: "warning" as const },
      { title: "Выполнено задач", value: doneTasks, tone: "secondary" as const },
      { title: "Касания", value: touches, tone: "secondary" as const },
      { title: "КП без follow-up", value: proposalNoFollowUp, tone: "warning" as const },
      { title: "Клиенты без контакта", value: clientsWithoutNextContact, tone: "warning" as const }
    ] satisfies Metric[],
    overdueByUser: Object.values(overdueByUser).sort((a, b) => b.count - a.count),
    proposalThinkingRows
  };
}

export async function getEmployeeActivityReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const visibleUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      ...(canViewAllData(user)
        ? {
            ...(params.responsibleId ? { id: params.responsibleId } : {}),
            ...(params.role ? { role: params.role as never } : {})
          }
        : { id: user.id })
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true, role: true }
  });

  const rows = await Promise.all(
    visibleUsers.map(async (employee) => {
      const own = { OR: [{ responsibleId: employee.id }, { createdById: employee.id }] };
      const actionFilter = params.actionType ? { actionType: params.actionType as never } : {};
      const [clients, designers, objects, deals, proposals, proposalAmount, tasks, doneTasks, taskRows, touches, calls, meetings, email, messengers, followUps, presentations, outsideMeetings] = await Promise.all([
        prisma.client.count({ where: { AND: [own, { createdAt: periodWhere(from, to) }] } }),
        prisma.designer.count({ where: { AND: [own, { createdAt: periodWhere(from, to) }] } }),
        prisma.projectObject.count({ where: { AND: [own, { createdAt: periodWhere(from, to) }] } }),
        prisma.deal.count({ where: { AND: [own, { createdAt: periodWhere(from, to) }] } }),
        prisma.commercialProposal.count({ where: { AND: [own, { createdAt: periodWhere(from, to) }] } }),
        prisma.commercialProposal.aggregate({ where: { AND: [own, { createdAt: periodWhere(from, to) }] }, _sum: { amount: true } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, recordType: "TASK", createdAt: periodWhere(from, to), ...actionFilter } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, recordType: "TASK", status: "DONE", completedAt: periodWhere(from, to), ...actionFilter } }),
        prisma.taskActivity.findMany({ where: { responsibleId: employee.id, recordType: "TASK", dueAt: { lt: new Date() }, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, ...actionFilter }, select: { id: true } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, recordType: "TOUCH", completedAt: periodWhere(from, to), ...actionFilter } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: { in: ["CALL", "INCOMING_CALL"] }, createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: { in: ["SHOWROOM_MEETING", "OUTSIDE_MEETING"] }, createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: "EMAIL", createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: { in: ["WHATSAPP", "TELEGRAM"] }, createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: "FOLLOW_UP", createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: "PRESENTATION", createdAt: periodWhere(from, to) } }),
        prisma.taskActivity.count({ where: { responsibleId: employee.id, actionType: "OUTSIDE_MEETING", createdAt: periodWhere(from, to) } })
      ]);

      return {
        employee,
        clients,
        designers,
        objects,
        deals,
        proposals,
        proposalAmount: proposalAmount._sum.amount ?? 0,
        tasks,
        doneTasks,
        overdueTasks: taskRows.length,
        touches,
        calls,
        meetings,
        email,
        messengers,
        followUps,
        presentations,
        outsideMeetings
      };
    })
  );

  return { period: { from, to }, rows };
}

function severityWeight(severity: ProblemRow["severity"]) {
  if (severity === "critical") return 10;
  if (severity === "medium") return 5;
  return 2;
}

function scoreRows(problems: ProblemRow[]) {
  const grouped = problems.reduce<Record<string, { name: string; score: number; critical: number; medium: number; light: number; total: number }>>((acc, problem) => {
    const id = problem.responsibleId ?? "unknown";
    acc[id] ??= { name: problem.responsibleName, score: 100, critical: 0, medium: 0, light: 0, total: 0 };
    acc[id].score = Math.max(0, acc[id].score - severityWeight(problem.severity));
    acc[id][problem.severity] += 1;
    acc[id].total += 1;
    return acc;
  }, {});
  return Object.values(grouped).sort((a, b) => a.score - b.score);
}

export async function getCrmDisciplineReport(params: ReportSearchParams, user: PermissionUser) {
  const owner = ownerWhere(user, canViewAllData(user) ? params.responsibleId : undefined);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const thinking7 = new Date();
  thinking7.setDate(thinking7.getDate() - 7);

  const [clients, designers, objects, deals, proposals] = await Promise.all([
    prisma.client.findMany({ where: owner, include: { responsible: { select: { id: true, name: true } } } }),
    prisma.designer.findMany({ where: owner, include: { responsible: { select: { id: true, name: true } } } }),
    prisma.projectObject.findMany({ where: owner, include: { responsible: { select: { id: true, name: true } }, participants: { where: { archivedAt: null } }, tasks: { where: { archivedAt: null } } } }),
    prisma.deal.findMany({ where: owner, include: { responsible: { select: { id: true, name: true } } } }),
    prisma.commercialProposal.findMany({ where: owner, include: { responsible: { select: { id: true, name: true } } } })
  ]);

  const problems: ProblemRow[] = [];
  const add = (row: ProblemRow) => {
    if (!params.severity || params.severity === row.severity) problems.push(row);
  };

  for (const client of clients) {
    const base = { area: "Клиенты", responsibleId: client.responsibleId, responsibleName: client.responsible.name, entity: "Клиент", title: client.name, href: `/clients/${client.id}` };
    if (!client.phone && !client.messenger) add({ ...base, issue: "Нет телефона и мессенджера", severity: "critical" });
    if (client.status === "ACTIVE" && !client.nextContactAt) add({ ...base, issue: "Активный клиент без следующего контакта", severity: "medium" });
    if (!client.source) add({ ...base, issue: "Не указан источник", severity: "light" });
  }
  for (const designer of designers) {
    const base = { area: "Дизайнеры", responsibleId: designer.responsibleId, responsibleName: designer.responsible.name, entity: "Дизайнер", title: designer.name, href: `/designers/${designer.id}` };
    if (!designer.nextStepAt || !designer.nextStepText) add({ ...base, issue: "Нет следующего шага", severity: "medium" });
    if (!designer.lastTouchAt || designer.lastTouchAt < sixtyDaysAgo) add({ ...base, issue: "Нет касаний более 60 дней", severity: "critical" });
    if (designer.relationshipStage === "NEW_CONTACT" && designer.createdAt < fourteenDaysAgo) add({ ...base, issue: "Новый контакт более 14 дней", severity: "medium" });
  }
  for (const object of objects) {
    const base = { area: "Объекты", responsibleId: object.responsibleId, responsibleName: object.responsible.name, entity: "Объект", title: object.title, href: `/objects/${object.id}` };
    if (object.status === "ACTIVE" && object.tasks.length === 0) add({ ...base, issue: "Активный объект без задач", severity: "medium" });
    if (object.status === "FROZEN" && object.tasks.every((task) => task.autoRule !== "FROZEN_OBJECT_RETURN")) add({ ...base, issue: "Замороженный объект без даты возврата", severity: "critical" });
    if (object.participants.every((participant) => participant.participantType !== "PURCHASE_INFLUENCER")) add({ ...base, issue: "Нет участника закупки", severity: "light" });
    if (object.participants.every((participant) => participant.participantType !== "IMPLEMENTATION_CONTACT")) add({ ...base, issue: "Нет контактного лица реализации", severity: "light" });
  }
  for (const deal of deals) {
    const base = { area: "Сделки", responsibleId: deal.responsibleId, responsibleName: deal.responsible.name, entity: "Сделка", title: deal.title, href: `/deals/${deal.id}` };
    if (!["LOST", "COMPLETED"].includes(deal.stage) && (!deal.nextActionAt || !deal.nextActionText)) add({ ...base, issue: "Нет следующего шага", severity: "critical" });
    if (!deal.potentialAmount) add({ ...base, issue: "Нет суммы", severity: "medium" });
    if (deal.stage === "WAITING_DECISION" && deal.updatedAt < thinking7) add({ ...base, issue: "Ожидание решения более 7 дней", severity: "medium" });
    if (deal.stage === "LOST" && !deal.lossReason) add({ ...base, issue: "Проиграна без причины", severity: "critical" });
  }
  for (const proposal of proposals) {
    const base = { area: "КП", responsibleId: proposal.responsibleId, responsibleName: proposal.responsible.name, entity: "КП", title: proposal.proposalNumber, href: `/proposals/${proposal.id}` };
    if (!proposal.fileUrl) add({ ...base, issue: "Нет файла", severity: "critical" });
    if (!proposal.sentAt && proposal.status !== "DRAFT") add({ ...base, issue: "Нет даты отправки", severity: "medium" });
    if (!proposal.nextTouchAt && !["ACCEPTED", "DECLINED", "ARCHIVED"].includes(proposal.status)) add({ ...base, issue: "Нет следующего касания", severity: "critical" });
    if (proposal.status === "CLIENT_THINKING" && proposal.sentAt && proposal.sentAt < thinking7) add({ ...base, issue: "Клиент думает более 7 дней", severity: "medium" });
    if (proposal.status === "DECLINED" && !proposal.declineReason) add({ ...base, issue: "Отклонено без причины", severity: "critical" });
  }

  return { problems, scores: scoreRows(problems) };
}

export async function getDealsReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const filters: Prisma.DealWhereInput[] = [ownerWhere(user, canViewAllData(user) ? params.responsibleId : undefined)];
  if (params.stage) filters.push({ stage: params.stage as never });
  if (params.source) filters.push({ source: params.source as never });
  if (params.probability) filters.push({ probability: params.probability as never });
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (params.objectId) filters.push({ objectId: params.objectId });
  filters.push({ createdAt: periodWhere(from, to) });
  const where = { AND: filters };
  const deals = await prisma.deal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { responsible: { select: { name: true } }, client: { select: { name: true } }, projectObject: { select: { title: true } }, designer: { select: { name: true } } }
  });
  const active = deals.filter((deal) => !["LOST", "COMPLETED"].includes(deal.stage));
  return {
    period: { from, to },
    deals,
    metrics: [
      { title: "Активные сделки", value: active.length },
      { title: "Сумма активных сделок", value: `${sum(active.map((deal) => deal.potentialAmount)).toLocaleString("ru-RU")} ₽` },
      { title: "Без следующего шага", value: active.filter((deal) => !deal.nextActionAt || !deal.nextActionText).length, tone: "warning" as const },
      { title: "Просроченное действие", value: active.filter((deal) => deal.nextActionAt && deal.nextActionAt < new Date()).length, tone: "warning" as const },
      { title: "Ожидают решения", value: active.filter((deal) => deal.stage === "WAITING_DECISION").length },
      { title: "Завершены", value: deals.filter((deal) => deal.stage === "COMPLETED").length, tone: "secondary" as const },
      { title: "Проиграны", value: deals.filter((deal) => deal.stage === "LOST").length, tone: "warning" as const }
    ] satisfies Metric[],
    byStage: groupBy(deals.map((deal) => deal.stage)),
    lossReasons: groupBy(deals.filter((deal) => deal.stage === "LOST").map((deal) => deal.lossReason))
  };
}

export async function getProposalsReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const filters: Prisma.CommercialProposalWhereInput[] = [ownerWhere(user, canViewAllData(user) ? params.responsibleId : undefined), { createdAt: periodWhere(from, to) }];
  if (params.status) filters.push({ status: params.status as never });
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (params.objectId) filters.push({ objectId: params.objectId });
  if (params.clientId) filters.push({ clientId: params.clientId });
  const proposals = await prisma.commercialProposal.findMany({
    where: { AND: filters },
    orderBy: { createdAt: "desc" },
    include: { responsible: { select: { name: true } }, client: { select: { name: true } }, deal: { select: { title: true } }, projectObject: { select: { title: true } }, designer: { select: { name: true } } }
  });
  const amount = sum(proposals.map((proposal) => proposal.amount));
  const byResponsible = proposals.reduce<Record<string, { name: string; amount: number; count: number }>>((acc, proposal) => {
    acc[proposal.responsibleId] ??= { name: proposal.responsible.name, amount: 0, count: 0 };
    acc[proposal.responsibleId].amount += proposal.amount;
    acc[proposal.responsibleId].count += 1;
    return acc;
  }, {});
  const thinking7 = new Date();
  thinking7.setDate(thinking7.getDate() - 7);
  return {
    period: { from, to },
    proposals,
    metrics: [
      { title: "КП за период", value: proposals.length },
      { title: "Сумма КП", value: `${amount.toLocaleString("ru-RU")} ₽` },
      { title: "Средняя сумма КП", value: `${Math.round(amount / Math.max(proposals.length, 1)).toLocaleString("ru-RU")} ₽` },
      { title: "Принятые КП", value: proposals.filter((proposal) => proposal.status === "ACCEPTED").length, tone: "secondary" as const },
      { title: "Отклоненные КП", value: proposals.filter((proposal) => proposal.status === "DECLINED").length, tone: "warning" as const },
      { title: "Без follow-up", value: proposals.filter((proposal) => !proposal.nextTouchAt && !["ACCEPTED", "DECLINED", "ARCHIVED"].includes(proposal.status)).length, tone: "warning" as const },
      { title: "Без файла", value: proposals.filter((proposal) => !proposal.fileUrl).length, tone: "warning" as const },
      { title: "Думает 7+ дней", value: proposals.filter((proposal) => proposal.status === "CLIENT_THINKING" && proposal.sentAt && proposal.sentAt < thinking7).length, tone: "warning" as const }
    ] satisfies Metric[],
    byStatus: groupBy(proposals.map((proposal) => proposal.status)),
    declineReasons: groupBy(proposals.filter((proposal) => proposal.status === "DECLINED").map((proposal) => proposal.declineReason)),
    byResponsible: Object.values(byResponsible).sort((a, b) => b.amount - a.amount)
  };
}

export async function getDesignersReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const filters: Prisma.DesignerWhereInput[] = [ownerWhere(user, canViewAllData(user) ? params.responsibleId : undefined)];
  if (params.stage) filters.push({ relationshipStage: params.stage as never });
  if (params.probability) filters.push({ potential: params.probability as never });
  if (params.status) filters.push({ loyalty: params.status as never });
  if (params.city) filters.push({ city: { contains: params.city, mode: "insensitive" } });
  if (params.source) filters.push({ source: params.source as never });
  filters.push({ createdAt: periodWhere(from, to) });
  const designers = await prisma.designer.findMany({
    where: { AND: filters },
    include: { responsible: { select: { name: true } }, projectObjects: { where: { archivedAt: null } }, proposals: { where: { archivedAt: null } } },
    orderBy: { createdAt: "desc" }
  });
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  return {
    period: { from, to },
    designers,
    metrics: [
      { title: "Новые дизайнеры", value: designers.length },
      { title: "Без касаний", value: designers.filter((designer) => !designer.lastTouchAt || designer.lastTouchAt < sixtyDaysAgo).length, tone: "warning" as const },
      { title: "Без следующего шага", value: designers.filter((designer) => !designer.nextStepAt || !designer.nextStepText).length, tone: "warning" as const },
      { title: "Передали объект", value: designers.filter((designer) => designer.projectObjects.length > 0).length },
      { title: "Ключевые партнеры", value: designers.filter((designer) => designer.relationshipStage === "KEY_PARTNER").length, tone: "secondary" as const }
    ] satisfies Metric[],
    byStage: groupBy(designers.map((designer) => designer.relationshipStage)),
    byPotential: groupBy(designers.map((designer) => designer.potential)),
    byLoyalty: groupBy(designers.map((designer) => designer.loyalty)),
    topByObjects: [...designers].sort((a, b) => b.projectObjects.length - a.projectObjects.length).slice(0, 10),
    topByProposalAmount: [...designers].sort((a, b) => sum(b.proposals.map((proposal) => proposal.amount)) - sum(a.proposals.map((proposal) => proposal.amount))).slice(0, 10)
  };
}

export async function getObjectsReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const filters: Prisma.ProjectObjectWhereInput[] = [ownerWhere(user, canViewAllData(user) ? params.responsibleId : undefined), { createdAt: periodWhere(from, to) }];
  if (params.designerId) filters.push({ designerId: params.designerId });
  if (params.clientId) filters.push({ clientId: params.clientId });
  if (params.stage) filters.push({ stage: params.stage as never });
  if (params.status) filters.push({ status: params.status as never });
  if (params.type) filters.push({ objectType: params.type as never });
  if (params.city) filters.push({ city: { contains: params.city, mode: "insensitive" } });
  const objects = await prisma.projectObject.findMany({
    where: { AND: filters },
    include: { responsible: { select: { name: true } }, client: { select: { name: true } }, designer: { select: { name: true } }, tasks: { where: { archivedAt: null } }, participants: { where: { archivedAt: null } } },
    orderBy: { createdAt: "desc" }
  });
  return {
    period: { from, to },
    objects,
    metrics: [
      { title: "Новые объекты", value: objects.length },
      { title: "Активные объекты", value: objects.filter((object) => object.status === "ACTIVE").length },
      { title: "От дизайнеров", value: objects.filter((object) => object.designerId).length },
      { title: "В расчете", value: objects.filter((object) => object.stage === "CALCULATION").length },
      { title: "В согласовании", value: objects.filter((object) => object.stage === "APPROVAL").length },
      { title: "Заморожены", value: objects.filter((object) => object.status === "FROZEN" || object.stage === "FROZEN").length, tone: "warning" as const },
      { title: "Потеряны", value: objects.filter((object) => object.status === "LOST" || object.stage === "LOST").length, tone: "warning" as const },
      { title: "Без задач", value: objects.filter((object) => object.tasks.length === 0).length, tone: "warning" as const },
      { title: "Без закупщика", value: objects.filter((object) => object.participants.every((participant) => participant.participantType !== "PURCHASE_INFLUENCER")).length, tone: "warning" as const },
      { title: "Без контакта реализации", value: objects.filter((object) => object.participants.every((participant) => participant.participantType !== "IMPLEMENTATION_CONTACT")).length, tone: "warning" as const }
    ] satisfies Metric[],
    byStage: groupBy(objects.map((object) => object.stage)),
    byType: groupBy(objects.map((object) => object.objectType))
  };
}

export async function getLossReasonsReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const owner = ownerWhere(user, canViewAllData(user) ? params.responsibleId : undefined);
  const [lostDeals, declinedProposals, lostObjects] = await Promise.all([
    prisma.deal.findMany({ where: { AND: [owner, { stage: "LOST", updatedAt: periodWhere(from, to) }] }, include: { responsible: { select: { name: true } }, designer: { select: { name: true } }, projectObject: { select: { objectType: true } } } }),
    prisma.commercialProposal.findMany({ where: { AND: [owner, { status: "DECLINED", updatedAt: periodWhere(from, to) }] }, include: { responsible: { select: { name: true } }, designer: { select: { name: true } }, projectObject: { select: { objectType: true } } } }),
    prisma.projectObject.findMany({ where: { AND: [owner, { OR: [{ status: "LOST" }, { stage: "LOST" }], updatedAt: periodWhere(from, to) }] }, include: { responsible: { select: { name: true } }, designer: { select: { name: true } } } })
  ]);
  return {
    period: { from, to },
    lostDeals,
    declinedProposals,
    lostObjects,
    metrics: [
      { title: "Проигранные сделки", value: lostDeals.length, tone: "warning" as const },
      { title: "Отклоненные КП", value: declinedProposals.length, tone: "warning" as const },
      { title: "Потерянные объекты", value: lostObjects.length, tone: "warning" as const },
      { title: "Потенциальная потеря сделок", value: `${sum(lostDeals.map((deal) => deal.potentialAmount)).toLocaleString("ru-RU")} ₽`, tone: "warning" as const },
      { title: "Сумма отклоненных КП", value: `${sum(declinedProposals.map((proposal) => proposal.amount)).toLocaleString("ru-RU")} ₽`, tone: "warning" as const }
    ] satisfies Metric[],
    dealReasons: groupBy(lostDeals.map((deal) => deal.lossReason)),
    proposalReasons: groupBy(declinedProposals.map((proposal) => proposal.declineReason)),
    byResponsible: groupBy([...lostDeals.map((deal) => deal.responsible.name), ...declinedProposals.map((proposal) => proposal.responsible.name), ...lostObjects.map((object) => object.responsible.name)]),
    byDesigner: groupBy([...lostDeals.map((deal) => deal.designer?.name), ...declinedProposals.map((proposal) => proposal.designer?.name), ...lostObjects.map((object) => object.designer?.name)]),
    byObjectType: groupBy([...lostDeals.map((deal) => deal.projectObject.objectType), ...declinedProposals.map((proposal) => proposal.projectObject.objectType)])
  };
}

export async function getOverdueReport(params: ReportSearchParams, user: PermissionUser) {
  const responsibleId = canViewAllData(user) ? params.responsibleId : undefined;
  const owner = ownerWhere(user, responsibleId);
  const taskOwner = taskOwnerWhere(user, responsibleId);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const now = new Date();
  const [tasks, proposalFollowUps, deals, designers, objects, clients] = await Promise.all([
    prisma.taskActivity.findMany({ where: { AND: [taskOwner, { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { lt: now } }] }, include: { responsible: { select: { name: true } } }, take: 50 }),
    prisma.commercialProposal.findMany({ where: { AND: [owner, { archivedAt: null, nextTouchAt: { lt: now }, status: { notIn: ["ACCEPTED", "DECLINED", "ARCHIVED"] } }] }, include: { responsible: { select: { name: true } } }, take: 50 }),
    prisma.deal.findMany({ where: { AND: [owner, { archivedAt: null, nextActionAt: { lt: now }, stage: { notIn: ["LOST", "COMPLETED"] } }] }, include: { responsible: { select: { name: true } } }, take: 50 }),
    prisma.designer.findMany({ where: { AND: [owner, { archivedAt: null, OR: [{ lastTouchAt: null }, { lastTouchAt: { lt: sixtyDaysAgo } }] }] }, include: { responsible: { select: { name: true } } }, take: 50 }),
    prisma.projectObject.findMany({ where: { AND: [owner, { status: "ACTIVE", tasks: { none: { archivedAt: null } } }] }, include: { responsible: { select: { name: true } } }, take: 50 }),
    prisma.client.findMany({ where: { AND: [owner, { status: "ACTIVE", nextContactAt: null }] }, include: { responsible: { select: { name: true } } }, take: 50 })
  ]);
  return {
    metrics: [
      { title: "Просроченные задачи", value: tasks.length, tone: "warning" as const },
      { title: "Просроченный follow-up КП", value: proposalFollowUps.length, tone: "warning" as const },
      { title: "Сделки с просроченным действием", value: deals.length, tone: "warning" as const },
      { title: "Дизайнеры без касаний", value: designers.length, tone: "warning" as const },
      { title: "Объекты без движения", value: objects.length, tone: "warning" as const },
      { title: "Клиенты без контакта", value: clients.length, tone: "warning" as const }
    ] satisfies Metric[],
    tasks,
    proposalFollowUps,
    deals,
    designers,
    objects,
    clients
  };
}

export async function getMyReport(user: PermissionUser) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const [discipline, tasksToday, overdueTasks, doneTasks, clients, designers, objects, deals, proposals, proposalsNoFollowUp, designersNoTouch, clientsNoContact] = await Promise.all([
    getCrmDisciplineReport({}, user),
    prisma.taskActivity.count({ where: { responsibleId: user.id, recordType: "TASK", archivedAt: null, dueAt: periodWhere(todayStart, todayEnd) } }),
    prisma.taskActivity.count({ where: { responsibleId: user.id, recordType: "TASK", archivedAt: null, dueAt: { lt: new Date() }, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] } } }),
    prisma.taskActivity.count({ where: { responsibleId: user.id, recordType: "TASK", status: "DONE" } }),
    prisma.client.count({ where: { OR: [{ responsibleId: user.id }, { createdById: user.id }] } }),
    prisma.designer.count({ where: { OR: [{ responsibleId: user.id }, { createdById: user.id }] } }),
    prisma.projectObject.count({ where: { OR: [{ responsibleId: user.id }, { createdById: user.id }] } }),
    prisma.deal.count({ where: { OR: [{ responsibleId: user.id }, { createdById: user.id }] } }),
    prisma.commercialProposal.count({ where: { OR: [{ responsibleId: user.id }, { createdById: user.id }] } }),
    prisma.commercialProposal.count({ where: { responsibleId: user.id, nextTouchAt: null, status: { notIn: ["ACCEPTED", "DECLINED", "ARCHIVED"] } } }),
    prisma.designer.count({ where: { responsibleId: user.id, OR: [{ lastTouchAt: null }, { lastTouchAt: { lt: sixtyDaysAgo } }] } }),
    prisma.client.count({ where: { responsibleId: user.id, status: "ACTIVE", nextContactAt: null } })
  ]);
  const ownScore = discipline.scores.find((score) => score.name) ?? { score: 100 };
  return {
    metrics: [
      { title: "Мои задачи на сегодня", value: tasksToday },
      { title: "Мои просроченные задачи", value: overdueTasks, tone: "warning" as const },
      { title: "Мои выполненные задачи", value: doneTasks, tone: "secondary" as const },
      { title: "Мои клиенты", value: clients },
      { title: "Мои дизайнеры", value: designers },
      { title: "Мои объекты", value: objects },
      { title: "Мои сделки", value: deals },
      { title: "Мои КП", value: proposals },
      { title: "Мои КП без follow-up", value: proposalsNoFollowUp, tone: "warning" as const },
      { title: "Мои дизайнеры без касаний", value: designersNoTouch, tone: "warning" as const },
      { title: "Мои клиенты без контакта", value: clientsNoContact, tone: "warning" as const },
      { title: "Мой CRM Discipline Score", value: `${ownScore.score}%`, tone: ownScore.score < 60 ? "warning" as const : "secondary" as const }
    ] satisfies Metric[],
    discipline
  };
}

export function rowsToCsv(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  const escape = (value: string | number | null | undefined) => {
    const raw = value == null ? "" : String(value);
    return `"${raw.replaceAll("\"", "\"\"")}"`;
  };
  return [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join("\n");
}
