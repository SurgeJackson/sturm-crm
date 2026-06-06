import type { TaskActivity, TaskAutoRule } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { daysAgo, daysFromNow } from "@/modules/crm/date-ranges";
import { closedDealStages, closedTaskStatuses } from "@/modules/crm/domain-constants";
import { toAuditValue } from "@/modules/crm/form-utils";
import { syncClientDiscipline, syncDesignerDiscipline, syncTaskDiscipline } from "@/modules/crm-discipline/service";

export async function createNextStepTask(source: TaskActivity, userId: string) {
  if (!source.nextStepText || !source.nextStepAt) return null;

  const existing = await prisma.taskActivity.findFirst({
    where: {
      recordType: "TASK",
      title: source.nextStepText,
      dueAt: source.nextStepAt,
      responsibleId: source.responsibleId,
      clientId: source.clientId,
      designerId: source.designerId,
      objectId: source.objectId,
      dealId: source.dealId,
      proposalId: source.proposalId,
      objectParticipantId: source.objectParticipantId
    },
    select: { id: true }
  });
  if (existing) return null;

  const task = await prisma.taskActivity.create({
    data: {
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: source.nextStepText,
      description: `Следующий шаг после ${source.recordType === "TOUCH" ? "касания" : "задачи"}: ${source.title}`,
      responsibleId: source.responsibleId,
      createdById: userId,
      clientId: source.clientId,
      designerId: source.designerId,
      objectId: source.objectId,
      dealId: source.dealId,
      proposalId: source.proposalId,
      objectParticipantId: source.objectParticipantId,
      status: "NEW",
      priority: source.priority,
      dueAt: source.nextStepAt
    }
  });

  await writeAuditLog({
    entityType: "TASK",
    entityId: task.id,
    action: "CREATE_NEXT_STEP",
    userId,
    after: toAuditValue(task)
  });

  await syncTaskDiscipline(task.id, userId);

  return task;
}

export async function refreshTouchDates(task: TaskActivity) {
  if (task.recordType !== "TOUCH") return;
  const touchedAt = task.completedAt ?? task.dueAt ?? new Date();

  await Promise.all([
    task.clientId
      ? prisma.client.update({
          where: { id: task.clientId },
          data: { lastContactAt: touchedAt }
        })
      : null,
    task.designerId
      ? prisma.designer.update({
          where: { id: task.designerId },
          data: { lastTouchAt: touchedAt }
        })
      : null
  ]);
}

export async function syncTaskAndLinkedEntities(task: TaskActivity, userId: string) {
  await syncTaskDiscipline(task.id, userId);
  if (task.clientId) await syncClientDiscipline(task.clientId, userId);
  if (task.designerId) await syncDesignerDiscipline(task.designerId, userId);
}

async function createAutomaticTask(input: {
  title: string;
  responsibleId: string;
  createdById: string;
  dueAt: Date;
  autoRule: TaskAutoRule;
  clientId?: string | null;
  designerId?: string | null;
  objectId?: string | null;
  dealId?: string | null;
  proposalId?: string | null;
}) {
  const exists = await prisma.taskActivity.findFirst({
    where: {
      archivedAt: null,
      status: { notIn: closedTaskStatuses },
      autoRule: input.autoRule,
      clientId: input.clientId ?? undefined,
      designerId: input.designerId ?? undefined,
      objectId: input.objectId ?? undefined,
      dealId: input.dealId ?? undefined,
      proposalId: input.proposalId ?? undefined
    },
    select: { id: true }
  });
  if (exists) return null;

  const task = await prisma.taskActivity.create({
    data: {
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: input.title,
      responsibleId: input.responsibleId,
      createdById: input.createdById,
      dueAt: input.dueAt,
      status: "NEW",
      priority: "NORMAL",
      isAutoCreated: true,
      autoRule: input.autoRule,
      clientId: input.clientId ?? null,
      designerId: input.designerId ?? null,
      objectId: input.objectId ?? null,
      dealId: input.dealId ?? null,
      proposalId: input.proposalId ?? null
    }
  });

  await writeAuditLog({
    entityType: "TASK",
    entityId: task.id,
    action: "CREATE_AUTO",
    userId: input.createdById,
    after: toAuditValue(task)
  });

  await syncTaskDiscipline(task.id, input.createdById);

  return task;
}

export async function ensureAutomaticTasksForUser(userId: string, now = new Date()) {
  const tomorrow = daysFromNow(1, now);
  const inThirtyDays = daysFromNow(30, now);
  const sixtyDaysAgo = daysAgo(60, now);

  const [designers, frozenObjects, deals, clients] = await Promise.all([
    prisma.designer.findMany({
      where: {
        relationshipStage: { not: "LOST_OR_IRRELEVANT" },
        archivedAt: null,
        OR: [{ lastTouchAt: null }, { lastTouchAt: { lt: sixtyDaysAgo } }]
      },
      select: { id: true, name: true, responsibleId: true }
    }),
    prisma.projectObject.findMany({
      where: { archivedAt: null, OR: [{ status: "FROZEN" }, { stage: "FROZEN" }] },
      select: { id: true, title: true, clientId: true, designerId: true, responsibleId: true }
    }),
    prisma.deal.findMany({
      where: {
        archivedAt: null,
        stage: { notIn: closedDealStages },
        OR: [{ nextActionAt: null }, { nextActionText: null }]
      },
      select: { id: true, title: true, clientId: true, objectId: true, designerId: true, responsibleId: true }
    }),
    prisma.client.findMany({
      where: { archivedAt: null, status: "ACTIVE", nextContactAt: null },
      select: { id: true, name: true, responsibleId: true }
    })
  ]);

  await Promise.all([
    ...designers.map((designer) =>
      createAutomaticTask({
        title: `Связаться с дизайнером ${designer.name} для реактивации контакта`,
        responsibleId: designer.responsibleId,
        createdById: userId,
        dueAt: tomorrow,
        autoRule: "DESIGNER_REACTIVATION",
        designerId: designer.id
      })
    ),
    ...frozenObjects.map((object) =>
      createAutomaticTask({
        title: `Вернуться к объекту ${object.title}`,
        responsibleId: object.responsibleId,
        createdById: userId,
        dueAt: inThirtyDays,
        autoRule: "FROZEN_OBJECT_RETURN",
        clientId: object.clientId,
        designerId: object.designerId,
        objectId: object.id
      })
    ),
    ...deals.map((deal) =>
      createAutomaticTask({
        title: `Запланировать следующий шаг по сделке ${deal.title}`,
        responsibleId: deal.responsibleId,
        createdById: userId,
        dueAt: tomorrow,
        autoRule: "DEAL_WITHOUT_NEXT_STEP",
        clientId: deal.clientId,
        designerId: deal.designerId,
        objectId: deal.objectId,
        dealId: deal.id
      })
    ),
    ...clients.map((client) =>
      createAutomaticTask({
        title: `Запланировать следующий контакт с клиентом ${client.name}`,
        responsibleId: client.responsibleId,
        createdById: userId,
        dueAt: tomorrow,
        autoRule: "CLIENT_WITHOUT_NEXT_CONTACT",
        clientId: client.id
      })
    )
  ]);
}
