import type { TaskActivity } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog } from "@/modules/crm/audit-helpers";
import { expireViolationsForEntity } from "@/modules/crm-discipline/service";
import { toTaskDocument, type TaskFormData } from "@/modules/tasks/form";
import type { resolveTaskLinks } from "@/modules/tasks/link-resolver";
import { createNextStepTask } from "@/modules/tasks/next-step-service";
import { syncTaskAndLinkedEntities } from "@/modules/tasks/linked-entity-sync";
import { refreshTouchDates } from "@/modules/tasks/touch-service";

type TaskLinks = Awaited<ReturnType<typeof resolveTaskLinks>>;

export function getTaskForMutation(id: string) {
  return prisma.taskActivity.findUnique({ where: { id } });
}

export function taskAuditAction(
  before: Pick<TaskActivity, "status"> | null,
  after: Pick<TaskActivity, "recordType" | "status">
) {
  if (!before) return after.recordType === "TOUCH" ? "CREATE_TOUCH" : "CREATE_TASK";
  return after.status === "DONE" && before.status !== "DONE" ? "CLOSE_TASK" : "UPDATE";
}

export async function createTaskActivity(data: TaskFormData, links: TaskLinks, userId: string) {
  const task = await prisma.$transaction(async (tx) => {
    const created = await tx.taskActivity.create({
      data: {
        ...toTaskDocument(data, links),
        createdById: userId
      }
    });

    await writeEntityAuditLog({
      entityType: "TASK",
      entityId: created.id,
      action: taskAuditAction(null, created),
      userId,
      after: created,
      client: tx
    });

    return created;
  });

  await refreshTouchDates(task);
  await createNextStepTask(task, userId);
  await syncTaskAndLinkedEntities(task, userId);

  return task;
}

export async function updateTaskActivity(
  id: string,
  before: TaskActivity,
  data: TaskFormData,
  links: TaskLinks,
  responsibleId: string,
  userId: string
) {
  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.taskActivity.update({
      where: { id },
      data: toTaskDocument(data, links, responsibleId)
    });

    await writeEntityAuditLog({
      entityType: "TASK",
      entityId: updated.id,
      action: taskAuditAction(before, updated),
      userId,
      before,
      after: updated,
      client: tx
    });

    return updated;
  });

  await refreshTouchDates(after);
  await createNextStepTask(after, userId);
  await syncTaskAndLinkedEntities(after, userId);

  return after;
}

export async function cancelTaskActivity(id: string, before: TaskActivity, userId: string) {
  const after = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.taskActivity.update({
      where: { id },
      data: { status: "CANCELLED", archivedAt: new Date() }
    });

    await writeEntityAuditLog({
      entityType: "TASK",
      entityId: id,
      action: "CANCEL",
      userId,
      before,
      after: cancelled,
      client: tx
    });

    return cancelled;
  });

  await expireViolationsForEntity("TASK", id, userId);
  return after;
}
