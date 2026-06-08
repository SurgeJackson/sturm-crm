import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterActions, FilterBar, FilterDateInput, FilterSelect } from "@/components/ui/filter-bar";
import { Table, TableBody, TableCell, TableEmptyRow, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getEmployeeOptions, getTimeReports, getWorkLocationOptions, type TimesheetParams } from "@/modules/time-clock/queries";
import { canViewTimesheet } from "@/permissions";

export default async function TimeReportsPage({ searchParams }: { searchParams: Promise<TimesheetParams> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canViewTimesheet(user)) redirect("/");
  const params = await searchParams;
  const [employees, locations, reports] = await Promise.all([
    getEmployeeOptions(),
    getWorkLocationOptions(false),
    getTimeReports(params)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Отчеты учета времени" description="Опоздания, нарушения по точкам и план-факт по сотрудникам." />
      <FilterBar resetHref="/admin/time-reports">
        <FilterSelect name="employeeId" defaultValue={params.employeeId} placeholder="Все сотрудники">
          {employees.map((employee) => <option key={employee.id} value={employee.id}>{employee.user.name}</option>)}
        </FilterSelect>
        <FilterSelect name="locationId" defaultValue={params.locationId} placeholder="Все точки">
          {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </FilterSelect>
        <FilterDateInput name="from" label="Дата с" defaultValue={params.from} />
        <FilterDateInput name="to" label="Дата по" defaultValue={params.to} />
        <FilterActions><Button type="submit" variant="secondary">Показать</Button></FilterActions>
      </FilterBar>
      <ReportCard title="Опоздания" headers={["Сотрудник", "Кол-во", "Минуты"]} rows={reports.lateReport.map((row) => [row.employee, row.lateCount, row.lateMinutes])} />
      <ReportCard title="По точкам" headers={["Точка", "Смены", "Нарушения", "Pending"]} rows={reports.locationReport.map((row) => [row.location, row.shifts, row.violations, row.pending])} />
      <ReportCard title="По сотрудникам" headers={["Сотрудник", "План", "Факт", "Опоздания", "Ранние уходы", "Pending"]} rows={reports.employeeReport.map((row) => [row.employee, row.planned, row.worked, row.late, row.early, row.pending])} />
    </div>
  );
}

function ReportCard({ title, headers, rows }: { title: string; headers: string[]; rows: Array<Array<string | number>> }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>{headers.map((header) => <TableHead key={header}>{header}</TableHead>)}</TableRow></TableHeader>
          <TableBody>
            {rows.length ? rows.map((row, index) => (
              <TableRow key={`${title}-${index}`}>{row.map((cell, cellIndex) => <TableCell key={headers[cellIndex]} label={headers[cellIndex]}>{cell}</TableCell>)}</TableRow>
            )) : <TableEmptyRow colSpan={headers.length}>Нет данных</TableEmptyRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
