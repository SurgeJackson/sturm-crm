import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { TaskActivityForm, type TaskFormDefaults } from "@/components/tasks/task-activity-form";
import { createTaskAction } from "@/modules/tasks/actions";
import { getTaskFormContext } from "@/modules/tasks/queries";
import { canChangeTaskResponsible, canCreateTask } from "@/permissions";

type NewTaskPageProps = {
  searchParams: Promise<TaskFormDefaults>;
};

export default async function NewTaskPage({ searchParams }: NewTaskPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreateTask(user)) redirect("/tasks");

  const defaults = await searchParams;
  const context = await getTaskFormContext(user);

  return (
    <FormPageShell
      title={defaults.recordType === "TOUCH" ? "Зафиксировать касание" : "Создать задачу"}
      description="Свяжите действие с клиентом, дизайнером, объектом, сделкой, КП или участником объекта."
      cardTitle="Данные записи"
    >
      <TaskActivityForm
        action={createTaskAction}
        {...context}
        currentUserId={user.id}
        canChangeResponsible={canChangeTaskResponsible(user)}
        defaults={defaults}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
