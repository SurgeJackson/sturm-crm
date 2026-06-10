import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { TimesheetMatrix } from "@/components/time-clock/timesheet-matrix";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterActions, FilterBar, FilterDateInput, FilterSelect } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/pagination";
import { PrintButton } from "@/components/ui/print-button";
import { Table, TableBody, TableCell, TableEmptyRow, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEmployeeOptions, getTimesheetDayDetail, getTimesheetDays, getTimesheetMatrix, getWorkLocationOptions, type TimesheetParams } from "@/modules/time-clock/queries";
import { timeEventStatusLabels, timeEventTypeLabels, timeRiskFlagLabels, timesheetDayStatusLabels } from "@/lib/constants";
import { canViewTimesheet } from "@/permissions";

type PageParams = TimesheetParams & { dayId?: string; view?: string; year?: string; month?: string };

const monthLabels = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь"
];

export default async function TimesheetPage({ searchParams }: { searchParams: Promise<PageParams> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canViewTimesheet(user)) redirect("/");
  const params = await searchParams;
  const isMatrixView = params.view !== "list";
  const [employees, locations] = await Promise.all([
    getEmployeeOptions(),
    getWorkLocationOptions(false)
  ]);
  const now = new Date();
  const selectedLocationId = params.locationId || locations.find((location) => location.isActive)?.id || locations[0]?.id || "";
  const selectedYear = params.year || String(now.getFullYear());
  const selectedMonth = params.month || String(now.getMonth() + 1);
  const [days, detail, matrix] = isMatrixView
    ? [null, null, await getTimesheetMatrix({ locationId: selectedLocationId, employeeId: params.employeeId, year: selectedYear, month: selectedMonth })]
    : await Promise.all([
        getTimesheetDays(params),
        params.dayId ? getTimesheetDayDetail(params.dayId) : null,
        Promise.resolve(null)
      ]);
  const exportParams = new URLSearchParams(Object.entries(params).filter(([_, value]) => Boolean(value)) as [string, string][]);
  exportParams.set("view", isMatrixView ? "matrix" : "list");
  if (isMatrixView) {
    exportParams.set("locationId", selectedLocationId);
    exportParams.set("year", selectedYear);
    exportParams.set("month", selectedMonth);
  }
  const csvExportParams = new URLSearchParams(exportParams);
  csvExportParams.set("format", "csv");
  const xlsxExportParams = new URLSearchParams(exportParams);
  xlsxExportParams.set("format", "xlsx");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Табель"
        description="План-факт рабочего времени, опоздания, ранние уходы и спорные события."
        actions={(
          <div className="flex flex-wrap gap-2">
            <Button asChild variant={isMatrixView ? "default" : "outline"}><Link href="/admin/timesheet">Матрица</Link></Button>
            <Button asChild variant={!isMatrixView ? "default" : "outline"}><Link href="/admin/timesheet?view=list">Список</Link></Button>
            {locations.length ? (
              <>
                <Button asChild variant="outline"><Link href={`/api/admin/timesheet/export?${csvExportParams.toString()}`}>CSV</Link></Button>
                <Button asChild variant="outline"><Link href={`/api/admin/timesheet/export?${xlsxExportParams.toString()}`}>XLSX</Link></Button>
                {isMatrixView ? <PrintButton /> : null}
              </>
            ) : null}
          </div>
        )}
      />
      {!locations.length ? (
        <Card>
          <CardContent className="flex min-h-32 items-center justify-center text-center text-sm text-muted-foreground">
            Сначала создайте рабочую точку. После этого табель сможет отобразить план-факт по сотрудникам и сменам.
          </CardContent>
        </Card>
      ) : null}
      {locations.length ? (isMatrixView ? (
        <>
          <FilterBar resetHref="/admin/timesheet">
            <input type="hidden" name="view" value="matrix" />
            <FilterSelect name="locationId" defaultValue={selectedLocationId} placeholder="Все точки">
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </FilterSelect>
            <FilterSelect name="employeeId" defaultValue={params.employeeId} placeholder="Все сотрудники">
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.user.name}</option>)}
            </FilterSelect>
            <FilterSelect name="month" defaultValue={selectedMonth} placeholder="Месяц">
              {monthLabels.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
            </FilterSelect>
            <Input name="year" type="number" min={2020} max={2100} defaultValue={selectedYear} aria-label="Год" />
            <FilterActions><Button type="submit" variant="secondary">Показать</Button></FilterActions>
          </FilterBar>
          {matrix ? <TimesheetMatrix data={matrix} /> : null}
        </>
      ) : (
        <>
          <FilterBar resetHref="/admin/timesheet?view=list">
            <input type="hidden" name="view" value="list" />
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
                  {days?.items.length ? days.items.map((day) => (
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
                      <TableCell label="Детали" actions><Button asChild variant="outline" size="sm"><Link href={`/admin/timesheet?view=list&dayId=${day.id}`}>Открыть</Link></Button></TableCell>
                    </TableRow>
                  )) : <TableEmptyRow colSpan={8}>Нет данных табеля</TableEmptyRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          {days ? <Pagination total={days.total} page={days.page} pageCount={days.pageCount} previousHref={days.page > 1 ? `/admin/timesheet?view=list&page=${days.page - 1}` : undefined} nextHref={days.page < days.pageCount ? `/admin/timesheet?view=list&page=${days.page + 1}` : undefined} /> : null}
        </>
      )) : null}
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
