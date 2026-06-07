"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ensureAutomaticTasksForUser } from "@/modules/tasks/automatic-tasks";
import { parseTaskForm } from "@/modules/tasks/form";
import { resolveTaskLinks } from "@/modules/tasks/link-resolver";
import {
  cancelTaskActivity,
  createTaskActivity,
  getTaskForMutation,
  updateTaskActivity
} from "@/modules/tasks/workflow-service";
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
  const task = await createTaskActivity(parsed.data, links, user.id);
  redirect(`/tasks/${task.id}?saved=1`);
}

export async function updateTaskAction(id: string, _prevState: TaskActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { message: "Необходима авторизация" };

  const before = await getTaskForMutation(id);
  if (!before || !canEditRecord(user, before)) return { message: "Недостаточно прав для редактирования задачи" };

  const parsed = parseTaskForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const links = await resolveTaskLinks(parsed.data);
  const responsibleId = canChangeTaskResponsible(user) ? parsed.data.responsibleId : before.responsibleId;
  const after = await updateTaskActivity(id, before, parsed.data, links, responsibleId, user.id);
  redirect(`/tasks/${after.id}?saved=1`);
}

export async function cancelTaskAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return;

  const before = await getTaskForMutation(id);
  if (!before || !canCancelTask(user, before)) return;

  await cancelTaskActivity(id, before, user.id);

  revalidatePath("/tasks");
  redirect("/tasks?cancelled=1");
}

export async function ensureAutomaticTasks() {
  const user = await getCurrentUser();
  if (!user || !canCreateTask(user)) return;

  await ensureAutomaticTasksForUser(user.id);
}
