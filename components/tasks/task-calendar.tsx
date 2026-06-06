import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FilterActions,
  FilterBar,
  FilterCheckbox,
  FilterDateInput,
  FilterSelect,
  filterShortcutHref,
  type ActiveFilter
} from "@/components/ui/filter-bar";
import { TaskActivityTable } from "@/components/tasks/task-activity-table";
import type { getTaskCalendar, getTaskFormContext, TaskCalendarSearchParams } from "@/modules/tasks/queries";
import { formatRussianDate } from "@/utils/date";

type TaskCalendar = Awaited<ReturnType<typeof getTaskCalendar>>;
type TaskFormContext = Awaited<ReturnType<typeof getTaskFormContext>>;

function shiftWeek(dateValue: string | undefined, delta: number) {
  const date = dateValue ? new Date(`${dateValue}T00:00:00.000`) : new Date();
  date.setDate(date.getDate() + delta * 7);
  return date.toISOString().slice(0, 10);
}

export function TaskCalendarFilters({
  params,
  users
}: {
  params: TaskCalendarSearchParams;
  users: TaskFormContext["users"];
}) {
  const activeFilters: ActiveFilter[] = [
    params.date ? { key: "date", label: "Неделя", value: params.date, href: filterShortcutHref("/tasks/calendar", params, { date: undefined }) } : null,
    params.responsibleId ? { key: "responsibleId", label: "Ответственный", value: users.find((user) => user.id === params.responsibleId)?.name ?? params.responsibleId, href: filterShortcutHref("/tasks/calendar", params, { responsibleId: undefined }) } : null,
    params.mine === "1" ? { key: "mine", label: "Режим", value: "Мои задачи", href: filterShortcutHref("/tasks/calendar", params, { mine: undefined }) } : null
  ].filter(Boolean) as ActiveFilter[];

  return (
    <FilterBar className="md:grid-cols-4" activeFilters={activeFilters} resetHref="/tasks/calendar">
      <FilterDateInput name="date" label="Дата недели" defaultValue={params.date ?? new Date().toISOString().slice(0, 10)} />
      <FilterSelect name="responsibleId" defaultValue={params.responsibleId} placeholder="Все ответственные">
            {users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </FilterSelect>
      <FilterCheckbox name="mine" defaultChecked={params.mine === "1"}>
        Мои задачи
      </FilterCheckbox>
      <FilterActions className="md:col-span-1">
        <Button type="submit" variant="secondary">Показать</Button>
        <Button asChild variant="outline"><Link href="/tasks/calendar">Сбросить</Link></Button>
      </FilterActions>
    </FilterBar>
  );
}

export function TaskCalendarRangeNav({
  params,
  range
}: {
  params: TaskCalendarSearchParams;
  range: TaskCalendar["range"];
}) {
  return (
    <div className="flex items-center justify-between">
      <Button asChild variant="outline" size="sm">
        <Link href={`/tasks/calendar?date=${shiftWeek(params.date, -1)}`}>
          <ChevronLeft className="h-4 w-4" />
          Предыдущая
        </Link>
      </Button>
      <div className="text-sm text-muted-foreground">{formatRussianDate(range.start)} — {formatRussianDate(range.end)}</div>
      <Button asChild variant="outline" size="sm">
        <Link href={`/tasks/calendar?date=${shiftWeek(params.date, 1)}`}>
          Следующая
          <ChevronRight className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}

export function TaskCalendarDayList({ days }: { days: TaskCalendar["days"] }) {
  return (
    <div className="grid gap-4">
      {days.map((day) => (
        <Card key={day.date.toISOString()}>
          <CardHeader><CardTitle>{formatRussianDate(day.date)}</CardTitle></CardHeader>
          <CardContent className="p-0">
            <TaskActivityTable items={day.items} emptyText="На сегодня задач нет" compact />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
