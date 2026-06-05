import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, MessageSquarePlus, Plus, Search } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TaskActivityTable } from "@/components/tasks/task-activity-table";
import { taskPriorityOptions, taskRecordTypeOptions, taskStatusOptions } from "@/modules/crm/options";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Задачи / касания</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ежедневные действия, факты контактов и контроль просрочек.</p>
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form className="grid gap-3 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по названию, описанию, результату" />
            </div>
            <select name="recordType" defaultValue={params.recordType ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все записи</option>
              {taskRecordTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select name="responsibleId" defaultValue={params.responsibleId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все ответственные</option>
              {context.users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select name="status" defaultValue={params.status ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все статусы</option>
              {taskStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select name="priority" defaultValue={params.priority ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все приоритеты</option>
              {taskPriorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <Input name="due" type="date" defaultValue={params.due ?? ""} />
            <div className="flex flex-wrap gap-2 lg:col-span-4">
              <Button type="submit" variant="secondary">Применить</Button>
              <Button asChild variant="outline"><Link href="/tasks">Сбросить</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { today: "1", overdue: undefined, page: undefined })}>На сегодня</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { overdue: "1", today: undefined, page: undefined })}>Просроченные</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { noResult: "1", page: undefined })}>Без результата</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { recordType: "TASK", page: undefined })}>Только задачи</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { recordType: "TOUCH", page: undefined })}>Только касания</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <TaskActivityTable items={tasks.items} emptyText={params.today === "1" ? "На сегодня задач нет" : params.overdue === "1" ? "Просроченных задач нет" : "Задачи и касания не найдены"} />
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Всего: {tasks.total}</span>
        <div className="flex gap-2">
          {tasks.page > 1 ? <Button asChild variant="outline" size="sm"><Link href={currentUrl(params, { page: String(tasks.page - 1) })}>Назад</Link></Button> : null}
          {tasks.page < tasks.pageCount ? <Button asChild variant="outline" size="sm"><Link href={currentUrl(params, { page: String(tasks.page + 1) })}>Вперед</Link></Button> : null}
        </div>
      </div>
    </div>
  );
}
