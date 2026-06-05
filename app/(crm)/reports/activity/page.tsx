import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { taskActionTypeLabels, taskRecordTypeLabels, taskStatusLabels } from "@/lib/constants";
import { taskActionTypeOptions } from "@/modules/crm/options";
import { getActivityReport, type ActivityReportSearchParams } from "@/modules/tasks/queries";
import { canViewReports } from "@/permissions";
import { formatRussianDateTime } from "@/utils/date";

type ActivityReportPageProps = {
  searchParams: Promise<ActivityReportSearchParams>;
};

export default async function ActivityReportPage({ searchParams }: ActivityReportPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canViewReports(user)) redirect("/reports");

  const params = await searchParams;
  const report = await getActivityReport(params, user);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Активность сотрудников</h1>
          <p className="mt-1 text-sm text-muted-foreground">Задачи, касания, звонки, встречи, КП и follow-up за период.</p>
        </div>
        <Button asChild variant="outline"><Link href="/reports">К отчетам</Link></Button>
      </div>

      <Card>
        <CardContent className="pt-5">
          <form className="grid gap-3 md:grid-cols-5">
            <Input name="from" type="date" defaultValue={params.from ?? report.from.toISOString().slice(0, 10)} />
            <Input name="to" type="date" defaultValue={params.to ?? report.to.toISOString().slice(0, 10)} />
            <select name="responsibleId" defaultValue={params.responsibleId ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все сотрудники</option>
              {report.users.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <select name="actionType" defaultValue={params.actionType ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все действия</option>
              {taskActionTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select name="entityType" defaultValue={params.entityType ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Все связи</option>
              <option value="client">Клиенты</option>
              <option value="designer">Дизайнеры</option>
              <option value="object">Объекты</option>
              <option value="deal">Сделки</option>
              <option value="proposal">КП</option>
            </select>
            <div className="flex gap-2 md:col-span-5">
              <Button type="submit" variant="secondary">Показать</Button>
              <Button asChild variant="outline"><Link href="/reports/activity">Сбросить</Link></Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle>Создано задач</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{report.totals.createdTasks}</CardContent></Card>
        <Card><CardHeader><CardTitle>Выполнено задач</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{report.totals.doneTasks}</CardContent></Card>
        <Card><CardHeader><CardTitle>Просрочено</CardTitle></CardHeader><CardContent className="text-2xl font-semibold text-warning">{report.totals.overdueTasks}</CardContent></Card>
        <Card><CardHeader><CardTitle>Касания</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{report.totals.touches}</CardContent></Card>
        <Card><CardHeader><CardTitle>Звонки</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{report.totals.calls}</CardContent></Card>
        <Card><CardHeader><CardTitle>Встречи</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{report.totals.meetings}</CardContent></Card>
        <Card><CardHeader><CardTitle>Отправки КП</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{report.totals.proposals}</CardContent></Card>
        <Card><CardHeader><CardTitle>Follow-up</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{report.totals.followUps}</CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Активность по сотрудникам</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Сотрудник</TableHead>
                <TableHead>Создано задач</TableHead>
                <TableHead>Выполнено</TableHead>
                <TableHead>Просрочено</TableHead>
                <TableHead>Касания</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.byResponsible.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">Активности за период нет.</TableCell></TableRow>
              ) : (
                report.byResponsible.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.created}</TableCell>
                    <TableCell>{row.done}</TableCell>
                    <TableCell>{row.overdue}</TableCell>
                    <TableCell>{row.touches}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Журнал активности</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Действие</TableHead>
                <TableHead>Название</TableHead>
                <TableHead>Ответственный</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">Записей за период нет.</TableCell></TableRow>
              ) : (
                report.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{formatRussianDateTime(item.createdAt)}</TableCell>
                    <TableCell>{taskRecordTypeLabels[item.recordType]}</TableCell>
                    <TableCell>{taskActionTypeLabels[item.actionType]}</TableCell>
                    <TableCell><Link href={`/tasks/${item.id}`} className="font-medium hover:underline">{item.title}</Link></TableCell>
                    <TableCell>{item.responsible.name}</TableCell>
                    <TableCell>{taskStatusLabels[item.status]}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
