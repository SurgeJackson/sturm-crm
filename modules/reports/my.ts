import { prisma } from "@/lib/prisma";
import type { PermissionUser } from "@/permissions";
import { periodWhere, type Metric } from "./common";
import { getCrmDisciplineReport } from "./crm-discipline";

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
