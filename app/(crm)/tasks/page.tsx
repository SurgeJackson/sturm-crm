import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, MessageSquarePlus, Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/ui/pagination";
import { TaskActivityTable } from "@/components/tasks/task-activity-table";
import { TasksFilters } from "@/components/tasks/tasks-filters";
import { ensureAutomaticTasks } from "@/modules/tasks/actions";
import { getTaskFormContext, getTasks, type TaskListSearchParams } from "@/modules/tasks/queries";
import { canCreateTask } from "@/permissions";

type TasksPageProps = {
  searchParams: Promise<TaskListSearchParams>;
};

function currentUrl(params: TaskListSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  return `/tasks?${next.toString()}`;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await ensureAutomaticTasks();
  const params = await searchParams;
  const [tasks, context] = await Promise.all([
    getTasks(params, user),
    getTaskFormContext(user)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Задачи / касания"
        description="Ежедневные действия, факты контактов и контроль просрочек."
        actions={
          <>
          <Button asChild variant="outline">
            <Link href="/tasks/calendar">
              <CalendarDays className="h-4 w-4" />
              Календарь
            </Link>
          </Button>
          {canCreateTask(user) ? (
            <>
              <Button asChild variant="secondary">
                <Link href="/tasks/new?recordType=TOUCH">
                  <MessageSquarePlus className="h-4 w-4" />
                  Зафиксировать касание
                </Link>
              </Button>
              <Button asChild>
                <Link href="/tasks/new">
                  <Plus className="h-4 w-4" />
                  Создать задачу
                </Link>
              </Button>
            </>
          ) : null}
          </>
        }
      />

      <TasksFilters params={params} users={context.users} />

      <Card>
        <CardContent className="p-0">
          <TaskActivityTable items={tasks.items} emptyText={params.today === "1" ? "На сегодня задач нет" : params.overdue === "1" ? "Просроченных задач нет" : "Задачи и касания не найдены"} />
        </CardContent>
      </Card>

      <Pagination
        total={tasks.total}
        page={tasks.page}
        pageCount={tasks.pageCount}
        previousHref={tasks.page > 1 ? currentUrl(params, { page: String(tasks.page - 1) }) : undefined}
        nextHref={tasks.page < tasks.pageCount ? currentUrl(params, { page: String(tasks.page + 1) }) : undefined}
      />
    </div>
  );
}
