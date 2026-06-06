import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { daysAgo, dayRange } from "@/modules/crm/date-ranges";
import type { PermissionUser } from "@/permissions";
import { periodWhere, reportOwnerWhere, reportPeriod, reportTaskOwnerWhere, type Metric, type ReportSearchParams } from "./common";

export async function getManagerDashboardReport(params: ReportSearchParams, user: PermissionUser) {
  const { from, to } = reportPeriod(params);
  const owner = reportOwnerWhere(user, params);
  const taskOwner = reportTaskOwnerWhere(user, params);
  const now = new Date();
  const today = dayRange(now);
  const sixtyDaysAgo = daysAgo(60, now);
  const thinking7 = daysAgo(7, now);
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
    overdueByResponsibleRows,
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
    prisma.taskActivity.count({ where: { AND: [taskOwner, { recordType: "TASK", archivedAt: null, dueAt: periodWhere(today.start, today.end) }] } }),
    prisma.taskActivity.count({ where: { AND: [taskOwner, { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { lt: now } }] } }),
    prisma.taskActivity.count({ where: { AND: [taskOwner, { recordType: "TASK", status: "DONE", completedAt: periodWhere(from, to) }] } }),
    prisma.taskActivity.count({ where: { AND: [taskOwner, { recordType: "TOUCH", completedAt: periodWhere(from, to) }] } }),
    prisma.commercialProposal.count({ where: { AND: [owner, { archivedAt: null, nextTouchAt: null, status: { notIn: ["ACCEPTED", "DECLINED", "ARCHIVED"] } }] } }),
    prisma.client.count({ where: { AND: [owner, { status: "ACTIVE", nextContactAt: null }] } }),
    prisma.taskActivity.groupBy({
      by: ["responsibleId"],
      where: { AND: [taskOwner, { recordType: "TASK", archivedAt: null, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }, dueAt: { lt: now } }] },
      _count: { _all: true }
    }),
    prisma.commercialProposal.findMany({
      where: { AND: [owner, { status: "CLIENT_THINKING", sentAt: { lt: thinking7 } }] },
      select: { id: true, proposalNumber: true, responsible: { select: { name: true } } },
      take: 10
    })
  ]);

  const overdueResponsibles = await prisma.user.findMany({
    where: { id: { in: overdueByResponsibleRows.map((row) => row.responsibleId) } },
    select: { id: true, name: true }
  });
  const overdueResponsibleNames = new Map(overdueResponsibles.map((responsible) => [responsible.id, responsible.name]));
  const overdueByUser = overdueByResponsibleRows.map((row) => ({
    name: overdueResponsibleNames.get(row.responsibleId) ?? "Не указан",
    count: row._count._all
  }));

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
    overdueByUser: overdueByUser.sort((a, b) => b.count - a.count),
    proposalThinkingRows
  };
}
