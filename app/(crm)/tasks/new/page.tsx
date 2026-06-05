import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { TaskActivityForm, type TaskFormDefaults } from "@/components/tasks/task-activity-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{defaults.recordType === "TOUCH" ? "Зафиксировать касание" : "Создать задачу"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Свяжите действие с клиентом, дизайнером, объектом, сделкой, КП или участником объекта.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Данные записи</CardTitle></CardHeader>
        <CardContent>
          <TaskActivityForm
            action={createTaskAction}
            {...context}
            currentUserId={user.id}
            canChangeResponsible={canChangeTaskResponsible(user)}
            defaults={defaults}
            submitLabel="Сохранить"
          />
        </CardContent>
      </Card>
    </div>
  );
}
