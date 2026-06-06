import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { TaskActivityForm } from "@/components/tasks/task-activity-form";
import { updateTaskAction } from "@/modules/tasks/actions";
import { getTaskForUser, getTaskFormContext } from "@/modules/tasks/queries";
import { canChangeTaskResponsible, canEditRecord } from "@/permissions";

type EditTaskPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [task, context] = await Promise.all([
    getTaskForUser(id, user),
    getTaskFormContext(user)
  ]);
  if (!canEditRecord(user, task)) redirect(`/tasks/${id}`);

  return (
    <FormPageShell title="Редактировать запись" description={task.title} cardTitle="Данные записи">
      <TaskActivityForm
        action={updateTaskAction.bind(null, id)}
        task={task}
        {...context}
        currentUserId={user.id}
        canChangeResponsible={canChangeTaskResponsible(user)}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
