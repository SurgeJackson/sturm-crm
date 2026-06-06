import type { TaskActivity } from "@/generated/prisma/client";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import { toAuditValue } from "@/modules/crm/form-utils";
import { syncTaskDiscipline } from "@/modules/crm-discipline/service";

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
