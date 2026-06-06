import { prisma } from "@/lib/prisma";
import { ownerRecordWhere } from "@/modules/crm/access-where";
import { daysAgo, dayRange } from "@/modules/crm/date-ranges";
import type { PermissionUser } from "@/permissions";
import { periodWhere, type Metric } from "./common";
import { getCrmDisciplineReport } from "./crm-discipline";

export async function getMyReport(user: PermissionUser) {
  const now = new Date();
  const today = dayRange(now);
  const sixtyDaysAgo = daysAgo(60, now);
  const own = ownerRecordWhere(user);
  const [discipline, tasksToday, overdueTasks, doneTasks, clients, designers, objects, deals, proposals, proposalsNoFollowUp, designersNoTouch, clientsNoContact] = await Promise.all([
    getCrmDisciplineReport({}, user),
    prisma.taskActivity.count({ where: { responsibleId: user.id, recordType: "TASK", archivedAt: null, dueAt: periodWhere(today.start, today.end) } }),
    prisma.taskActivity.count({ where: { responsibleId: user.id, recordType: "TASK", archivedAt: null, dueAt: { lt: now }, status: { notIn: ["DONE", "CANCELLED", "CLOSED"] } } }),
    prisma.taskActivity.count({ where: { responsibleId: user.id, recordType: "TASK", status: "DONE" } }),
    prisma.client.count({ where: own }),
    prisma.designer.count({ where: own }),
    prisma.projectObject.count({ where: own }),
    prisma.deal.count({ where: own }),
    prisma.commercialProposal.count({ where: own }),
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
