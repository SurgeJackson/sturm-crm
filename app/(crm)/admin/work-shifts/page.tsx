import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterActions, FilterBar, FilterDateInput, FilterSelect } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableEmptyRow, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cancelWorkShiftAction, saveWorkShiftDirectAction } from "@/modules/time-clock/actions";
import { getEmployeeOptions, getWorkLocationOptions, getWorkShifts, type WorkShiftParams } from "@/modules/time-clock/queries";
import { workShiftStatusLabels } from "@/lib/constants";
import { canManageWorkShifts } from "@/permissions";

export default async function WorkShiftsPage({ searchParams }: { searchParams: Promise<WorkShiftParams & { saved?: string; error?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canManageWorkShifts(user)) redirect("/");
  const params = await searchParams;
  const [shifts, employees, locations] = await Promise.all([
    getWorkShifts(params),
    getEmployeeOptions(),
    getWorkLocationOptions()
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="График смен" description="Планирование смен сотрудников по рабочим точкам." />
      <PageNoticeStack notices={[
        { show: Boolean(params.saved), message: "Смена сохранена." },
        { show: Boolean(params.error), tone: "destructive", message: params.error ?? "Действие недоступно." }
      ]} />
      <Card>
        <CardHeader><CardTitle>Создать смену</CardTitle></CardHeader>
        <CardContent>
          <form action={saveWorkShiftDirectAction} className="grid gap-2 md:grid-cols-6">
            <NativeSelect name="employeeId" required aria-label="Сотрудник" className="md:col-span-2">
              <option value="">Сотрудник</option>
              {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.user.name}</option>)}
            </NativeSelect>
            <NativeSelect name="locationId" required aria-label="Точка" className="md:col-span-2">
              <option value="">Точка</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </NativeSelect>
            <Input name="date" type="date" required />
            <Input name="breakMinutes" type="number" min={0} max={600} defaultValue={0} placeholder="Перерыв" />
            <Input name="startsAt" type="time" required />
            <Input name="endsAt" type="time" required />
            <Button type="submit" className="md:col-span-4">Сохранить смену</Button>
          </form>
        </CardContent>
      </Card>
      <FilterBar resetHref="/admin/work-shifts">
        <FilterSelect name="employeeId" defaultValue={params.employeeId} placeholder="Все сотрудники">
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.user.name}</option>)}
        </FilterSelect>
        <FilterSelect name="locationId" defaultValue={params.locationId} placeholder="Все точки">
          {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </FilterSelect>
        <FilterSelect name="status" defaultValue={params.status} placeholder="Все статусы">
          {Object.entries(workShiftStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
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
                <TableHead>Статус</TableHead>
                <TableHead>Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.items.length ? shifts.items.map((shift) => (
                <TableRow key={shift.id}>
                  <TableCell label="Дата">{shift.date}</TableCell>
                  <TableCell label="Сотрудник">{shift.employee.user.name}</TableCell>
                  <TableCell label="Точка">{shift.location.name}</TableCell>
                  <TableCell label="План">{formatTime(shift.startsAt)} - {formatTime(shift.endsAt)} · перерыв {shift.breakMinutes} мин.</TableCell>
                  <TableCell label="Статус">{workShiftStatusLabels[shift.status]}</TableCell>
                  <TableCell label="Действия" actions>
                    <div className="space-y-2">
                      {shift.status !== "CANCELLED" ? (
                        <form action={cancelWorkShiftAction.bind(null, shift.id)}>
                          <Button variant="outline" size="sm">Отменить</Button>
                        </form>
                      ) : null}
                      <details>
                        <summary className="cursor-pointer text-xs text-muted-foreground">Редактировать</summary>
                        <form action={saveWorkShiftDirectAction} className="mt-2 grid gap-2">
                          <input type="hidden" name="id" value={shift.id} />
                          <NativeSelect name="employeeId" defaultValue={shift.employeeId} aria-label="Сотрудник">
                            {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.user.name}</option>)}
                          </NativeSelect>
                          <NativeSelect name="locationId" defaultValue={shift.locationId} aria-label="Точка">
                            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
                          </NativeSelect>
                          <Input name="date" type="date" defaultValue={shift.date} />
                          <Input name="startsAt" type="time" defaultValue={timeInput(shift.startsAt)} />
                          <Input name="endsAt" type="time" defaultValue={timeInput(shift.endsAt)} />
                          <Input name="breakMinutes" type="number" defaultValue={shift.breakMinutes} />
                          <Button size="sm">Сохранить</Button>
                        </form>
                      </details>
                    </div>
                  </TableCell>
                </TableRow>
              )) : <TableEmptyRow colSpan={6}>Смены не найдены</TableEmptyRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Pagination total={shifts.total} page={shifts.page} pageCount={shifts.pageCount} previousHref={shifts.page > 1 ? `/admin/work-shifts?page=${shifts.page - 1}` : undefined} nextHref={shifts.page < shifts.pageCount ? `/admin/work-shifts?page=${shifts.page + 1}` : undefined} />
    </div>
  );
}

function formatTime(value: Date) {
  return value.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function timeInput(value: Date) {
  return value.toISOString().slice(11, 16);
}
