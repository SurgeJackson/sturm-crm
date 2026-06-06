import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/modules/crm/date-ranges";
import { canViewAllData, type PermissionUser } from "@/permissions";
import { ownerWhere, taskOwnerWhere, type Metric, type ReportSearchParams } from "./common";

export async function getOverdueReport(params: ReportSearchParams, user: PermissionUser) {
  const responsibleId = canViewAllData(user) ? params.responsibleId : undefined;
  const owner = ownerWhere(user, responsibleId);
  const taskOwner = taskOwnerWhere(user, responsibleId);
  const now = new Date();
  const sixtyDaysAgo = daysAgo(60, now);
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
