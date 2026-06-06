import { Prisma, type TaskActivity } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { closedTaskStatuses } from "@/modules/crm/domain-constants";
import { toAuditValue } from "@/modules/crm/form-utils";
import { syncTaskDiscipline } from "@/modules/crm-discipline/service";

export function nextStepTaskSyncData(source: TaskActivity) {
  return {
    recordType: "TASK" as const,
    actionType: "FOLLOW_UP" as const,
    title: source.nextStepText ?? "",
    description: `Следующий шаг после ${source.recordType === "TOUCH" ? "касания" : "задачи"}: ${source.title}`,
    responsibleId: source.responsibleId,
    clientId: source.clientId,
    designerId: source.designerId,
    objectId: source.objectId,
    dealId: source.dealId,
    proposalId: source.proposalId,
    objectParticipantId: source.objectParticipantId,
    nextStepSourceTaskId: source.id,
    priority: source.priority,
    dueAt: source.nextStepAt
  };
}

export function nextStepTaskCreateData(source: TaskActivity, userId: string) {
  return {
    ...nextStepTaskSyncData(source),
    createdById: userId,
    status: "NEW" as const
  };
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function createNextStepTask(source: TaskActivity, userId: string) {
  if (!source.nextStepText || !source.nextStepAt) return null;

  const existing = await prisma.taskActivity.findUnique({
    where: { nextStepSourceTaskId: source.id },
    select: { id: true, status: true, archivedAt: true }
  });
  if (existing) {
    if (existing.archivedAt || closedTaskStatuses.includes(existing.status)) return null;

    const updated = await prisma.taskActivity.update({
      where: { id: existing.id },
      data: nextStepTaskSyncData(source)
    });
    await syncTaskDiscipline(updated.id, userId);

    return updated;
  }

  let task;
  try {
    task = await prisma.taskActivity.create({
      data: nextStepTaskCreateData(source, userId)
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    return prisma.taskActivity.findUnique({ where: { nextStepSourceTaskId: source.id } });
  }

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
