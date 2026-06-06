import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, MessageSquarePlus, Plus, Search } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FilterActions, FilterBar } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Pagination } from "@/components/ui/pagination";
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

      <FilterBar className="lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="q" defaultValue={params.q ?? ""} placeholder="Поиск по названию, описанию, результату" />
            </div>
            <NativeSelect name="recordType" defaultValue={params.recordType ?? ""}>
              <option value="">Все записи</option>
              {taskRecordTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
              <option value="">Все ответственные</option>
              {context.users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </NativeSelect>
            <NativeSelect name="status" defaultValue={params.status ?? ""}>
              <option value="">Все статусы</option>
              {taskStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <NativeSelect name="priority" defaultValue={params.priority ?? ""}>
              <option value="">Все приоритеты</option>
              {taskPriorityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </NativeSelect>
            <Input name="due" type="date" defaultValue={params.due ?? ""} />
            <FilterActions className="lg:col-span-4">
              <Button type="submit" variant="secondary">Применить</Button>
              <Button asChild variant="outline"><Link href="/tasks">Сбросить</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { today: "1", overdue: undefined, page: undefined })}>На сегодня</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { overdue: "1", today: undefined, page: undefined })}>Просроченные</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { noResult: "1", page: undefined })}>Без результата</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { recordType: "TASK", page: undefined })}>Только задачи</Link></Button>
              <Button asChild variant="outline"><Link href={currentUrl(params, { recordType: "TOUCH", page: undefined })}>Только касания</Link></Button>
            </FilterActions>
      </FilterBar>

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
