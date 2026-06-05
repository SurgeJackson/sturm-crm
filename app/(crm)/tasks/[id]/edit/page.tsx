import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { TaskActivityForm } from "@/components/tasks/task-activity-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Редактировать запись</h1>
        <p className="mt-1 text-sm text-muted-foreground">{task.title}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Данные записи</CardTitle></CardHeader>
        <CardContent>
          <TaskActivityForm
            action={updateTaskAction.bind(null, id)}
            task={task}
            {...context}
            currentUserId={user.id}
            canChangeResponsible={canChangeTaskResponsible(user)}
            submitLabel="Сохранить"
          />
        </CardContent>
      </Card>
    </div>
  );
}
