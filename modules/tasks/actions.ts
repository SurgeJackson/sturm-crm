"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog } from "@/modules/crm/audit-helpers";
import { expireViolationsForEntity } from "@/modules/crm-discipline/service";
import { parseTaskForm, toTaskDocument } from "@/modules/tasks/form";
import { resolveTaskLinks } from "@/modules/tasks/link-resolver";
import { createNextStepTask, ensureAutomaticTasksForUser, refreshTouchDates, syncTaskAndLinkedEntities } from "@/modules/tasks/service";
import {
  canCancelTask,
  canChangeTaskResponsible,
  canCreateTask,
  canCreateTouch,
  canEditRecord
} from "@/permissions";

export type TaskActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createTaskAction(_prevState: TaskActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { message: "Необходима авторизация" };

  const recordType = formData.get("recordType");
  if (recordType === "TOUCH" ? !canCreateTouch(user) : !canCreateTask(user)) {
    return { message: "Недостаточно прав для создания задачи или касания" };
  }

  const parsed = parseTaskForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const links = await resolveTaskLinks(parsed.data);
  const document = toTaskDocument(parsed.data, links);
  const task = await prisma.taskActivity.create({
    data: {
      ...document,
      createdById: user.id
    }
  });

  await writeEntityAuditLog({
    entityType: "TASK",
    entityId: task.id,
    action: task.recordType === "TOUCH" ? "CREATE_TOUCH" : "CREATE_TASK",
    userId: user.id,
    after: task
  });

  await refreshTouchDates(task);
  await createNextStepTask(task, user.id);
  await syncTaskAndLinkedEntities(task, user.id);
  redirect(`/tasks/${task.id}?saved=1`);
}

export async function updateTaskAction(id: string, _prevState: TaskActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { message: "Необходима авторизация" };

  const before = await prisma.taskActivity.findUnique({ where: { id } });
  if (!before || !canEditRecord(user, before)) return { message: "Недостаточно прав для редактирования задачи" };

  const parsed = parseTaskForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const links = await resolveTaskLinks(parsed.data);
  const responsibleId = canChangeTaskResponsible(user) ? parsed.data.responsibleId : before.responsibleId;
  const document = toTaskDocument(parsed.data, links, responsibleId);

  const after = await prisma.taskActivity.update({
    where: { id },
    data: document
  });

  await writeEntityAuditLog({
    entityType: "TASK",
    entityId: after.id,
    action: after.status === "DONE" && before.status !== "DONE" ? "CLOSE_TASK" : "UPDATE",
    userId: user.id,
    before,
    after
  });

  await refreshTouchDates(after);
  await createNextStepTask(after, user.id);
  await syncTaskAndLinkedEntities(after, user.id);
  redirect(`/tasks/${after.id}?saved=1`);
}

export async function cancelTaskAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const before = await prisma.taskActivity.findUnique({ where: { id } });
  if (!before || !canCancelTask(user, before)) return;

  const after = await prisma.taskActivity.update({
    where: { id },
    data: { status: "CANCELLED", archivedAt: new Date() }
  });

  await writeEntityAuditLog({
    entityType: "TASK",
    entityId: id,
    action: "CANCEL",
    userId: user.id,
    before,
    after
  });

  await expireViolationsForEntity("TASK", id, user.id);

  revalidatePath("/tasks");
  redirect("/tasks?cancelled=1");
}

export async function ensureAutomaticTasks() {
  const user = await getCurrentUser();
  if (!user || !canCreateTask(user)) return;

  await ensureAutomaticTasksForUser(user.id);
}
