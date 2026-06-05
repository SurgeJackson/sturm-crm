import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TaskActivityTable } from "@/components/tasks/task-activity-table";
import { getTaskCalendar, getTaskFormContext, type TaskCalendarSearchParams } from "@/modules/tasks/queries";
import { formatRussianDate } from "@/utils/date";

type TaskCalendarPageProps = {
  searchParams: Promise<TaskCalendarSearchParams>;
};

function shiftWeek(dateValue: string | undefined, delta: number) {
  const date = dateValue ? new Date(`${dateValue}T00:00:00.000`) : new Date();
  date.setDate(date.getDate() + delta * 7);
  return date.toISOString().slice(0, 10);
}

export default async function TaskCalendarPage({ searchParams }: TaskCalendarPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [calendar, context] = await Promise.all([
    getTaskCalendar(params, user),
    getTaskFormContext(user)
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Календарь задач</h1>
          <p className="mt-1 text-sm text-muted-foreground">Недельный список задач и касаний.</p>
        </div>
        <Button asChild variant="outline"><Link href="/tasks">К списку</Link></Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form className="grid gap-3 md:grid-cols-4">
            <Input name="date" type="date" defaultValue={params.date ?? new Date().toISOString().slice(0, 10)} />
            <select name="responsibleId" defaultValue={params.responsibleId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все ответственные</option>
              {context.users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <label className="flex h-10 items-center gap-2 rounded-md border px-3 text-sm">
              <input type="checkbox" name="mine" value="1" defaultChecked={params.mine === "1"} />
              Мои задачи
            </label>
            <div className="flex gap-2">
              <Button type="submit" variant="secondary">Показать</Button>
              <Button asChild variant="outline"><Link href="/tasks/calendar">Сбросить</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button asChild variant="outline" size="sm">
          <Link href={`/tasks/calendar?date=${shiftWeek(params.date, -1)}`}>
            <ChevronLeft className="h-4 w-4" />
            Предыдущая
          </Link>
        </Button>
        <div className="text-sm text-muted-foreground">{formatRussianDate(calendar.range.start)} — {formatRussianDate(calendar.range.end)}</div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/tasks/calendar?date=${shiftWeek(params.date, 1)}`}>
            Следующая
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4">
        {calendar.days.map((day) => (
          <Card key={day.date.toISOString()}>
            <CardHeader><CardTitle>{formatRussianDate(day.date)}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <TaskActivityTable items={day.items} emptyText="На сегодня задач нет" compact />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
