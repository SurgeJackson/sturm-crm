import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterActions, FilterBar, FilterDateInput, FilterSelect } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableEmptyRow, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEmployeeOptions, getTimesheetDayDetail, getTimesheetDays, getWorkLocationOptions, type TimesheetParams } from "@/modules/time-clock/queries";
import { timeEventStatusLabels, timeEventTypeLabels, timeRiskFlagLabels, timesheetDayStatusLabels } from "@/lib/constants";
import { canViewTimesheet } from "@/permissions";

type PageParams = TimesheetParams & { dayId?: string };

export default async function TimesheetPage({ searchParams }: { searchParams: Promise<PageParams> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canViewTimesheet(user)) redirect("/");
  const params = await searchParams;
  const [days, employees, locations, detail] = await Promise.all([
    getTimesheetDays(params),
    getEmployeeOptions(),
    getWorkLocationOptions(false),
    params.dayId ? getTimesheetDayDetail(params.dayId) : null
  ]);
  const exportHref = `/api/admin/timesheet/export?${new URLSearchParams(Object.entries(params).filter(([_, value]) => Boolean(value)) as [string, string][]).toString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Табель"
        description="План-факт рабочего времени, опоздания, ранние уходы и спорные события."
        actions={<Button asChild variant="outline"><Link href={exportHref}>Экспорт CSV</Link></Button>}
      />
      <FilterBar resetHref="/admin/timesheet">
        <FilterSelect name="employeeId" defaultValue={params.employeeId} placeholder="Все сотрудники">
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.user.name}</option>)}
        </FilterSelect>
        <FilterSelect name="locationId" defaultValue={params.locationId} placeholder="Все точки">
          {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </FilterSelect>
        <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы">
          {Object.entries(timesheetDayStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </FilterSelect>
        <FilterDateInput name="from" label="Дата с" defaultValue={params.from} />
        <FilterDateInput name="to" label="Дата по" defaultValue={params.to} />
        <FilterActions><Button type="submit" variant="secondary">Показать</Button></FilterActions>
      </FilterBar>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Сотрудник</TableHead>
                <TableHead>Точка</TableHead>
                <TableHead>План</TableHead>
                <TableHead>Факт</TableHead>
                <TableHead>Минуты</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Детали</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {days.items.length ? days.items.map((day) => (
                <TableRow key={day.id}>
                  <TableCell label="Дата">{day.date}</TableCell>
                  <TableCell label="Сотрудник">{day.employee.user.name}</TableCell>
                  <TableCell label="Точка">{day.location?.name ?? "Не назначена"}</TableCell>
                  <TableCell label="План">{day.plannedStart && day.plannedEnd ? `${formatTime(day.plannedStart)} - ${formatTime(day.plannedEnd)}` : "Нет"}</TableCell>
                  <TableCell label="Факт">{day.actualCheckIn ? formatTime(day.actualCheckIn) : "Нет"} / {day.actualCheckOut ? formatTime(day.actualCheckOut) : "Нет"}</TableCell>
                  <TableCell label="Минуты">
                    <div>Работа: {day.workedMinutes}</div>
                    <div className="text-xs text-muted-foreground">Опозд.: {day.lateMinutes}, ранний уход: {day.earlyLeaveMinutes}, перераб.: {day.overtimeMinutes}</div>
                  </TableCell>
                  <TableCell label="Статус">
                    <Badge variant={day.hasPendingEvents ? "warning" : "outline"}>{timesheetDayStatusLabels[day.status]}</Badge>
                  </TableCell>
                  <TableCell label="Детали" actions><Button asChild variant="outline" size="sm"><Link href={`/admin/timesheet?dayId=${day.id}`}>Открыть</Link></Button></TableCell>
                </TableRow>
              )) : <TableEmptyRow colSpan={8}>Нет данных табеля</TableEmptyRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pagination total={days.total} page={days.page} pageCount={days.pageCount} previousHref={days.page > 1 ? `/admin/timesheet?page=${days.page - 1}` : undefined} nextHref={days.page < days.pageCount ? `/admin/timesheet?page=${days.page + 1}` : undefined} />
      {detail ? (
        <Card>
          <CardHeader><CardTitle>Детализация дня: {detail.day.employee.user.name}, {detail.day.date}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 md:grid-cols-4">
              <Info label="Смена" value={detail.day.shift ? `${formatTime(detail.day.shift.startsAt)} - ${formatTime(detail.day.shift.endsAt)}` : "Не назначена"} />
              <Info label="Точка" value={detail.day.location?.name ?? "Не назначена"} />
              <Info label="Статус" value={timesheetDayStatusLabels[detail.day.status]} />
              <Info label="Pending" value={detail.day.hasPendingEvents ? "Да" : "Нет"} />
            </div>
            <div className="space-y-2">
              {detail.events.map((event) => (
                <div key={event.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-medium">{timeEventTypeLabels[event.type]} · {formatTime(event.occurredAt)}</div>
                    <Badge variant={event.status === "PENDING_REVIEW" ? "warning" : "outline"}>{timeEventStatusLabels[event.status]}</Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {event.distanceFromLocationMeters != null ? `Расстояние ${Math.round(event.distanceFromLocationMeters)} м. ` : ""}
                    {event.accuracy != null ? `Точность ${Math.round(event.accuracy)} м. ` : ""}
                    {event.ipAddress ? `IP ${event.ipAddress}.` : ""}
                  </div>
                  {event.riskFlags.length ? <div className="mt-2 text-sm">Риски: {event.riskFlags.map((flag) => timeRiskFlagLabels[flag] ?? flag).join("; ")}</div> : null}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function formatTime(value: Date) {
  return value.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}
