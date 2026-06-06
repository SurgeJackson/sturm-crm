import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { crmSeverityVariant } from "@/components/crm/crm-discipline";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricsGrid, ReportPageHeader, ReportPeriodFilter } from "@/components/reports/report-widgets";
import { getCrmDisciplineReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";

type PageProps = { searchParams: Promise<ReportSearchParams> };
const severityLabels = { critical: "Критично", medium: "Средне", light: "Легко" };

export default async function CrmDisciplineReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getCrmDisciplineReport(params, user), getReportFilterOptions(user)]);

  return (
    <div className="space-y-6">
      <ReportPageHeader title="CRM-дисциплина" description="Score = 100 - критичные нарушения * 10 - средние * 5 - легкие * 2." report="crm-discipline" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/crm-discipline">
        <NativeSelect name="severity" defaultValue={params.severity ?? ""}>
          <option value="">Все нарушения</option>
          <option value="critical">Критичные</option>
          <option value="medium">Средние</option>
          <option value="low">Легкие</option>
        </NativeSelect>
        <NativeSelect name="entity" defaultValue={params.entity ?? ""}>
          <option value="">Все сущности</option>
          <option value="CLIENT">Клиенты</option>
          <option value="DESIGNER">Дизайнеры</option>
          <option value="OBJECT">Объекты</option>
          <option value="DEAL">Сделки</option>
          <option value="PROPOSAL">КП</option>
          <option value="TASK">Задачи</option>
        </NativeSelect>
        <input name="violationCode" defaultValue={params.violationCode ?? ""} placeholder="Код нарушения" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
      </ReportPeriodFilter>
      <MetricsGrid metrics={[
        { title: "Активные нарушения", value: report.summary.active, tone: report.summary.active ? "warning" : "secondary" },
        { title: "Критические", value: report.summary.critical, tone: report.summary.critical ? "warning" : "secondary" },
        { title: "Средние", value: report.summary.medium },
        { title: "Легкие", value: report.summary.low },
        { title: "Влияют на премирование", value: report.summary.bonus, tone: report.summary.bonus ? "warning" : "secondary" },
        { title: "Исправлено за период", value: report.summary.resolved, tone: "secondary" }
      ]} />
      <div className="grid gap-4 md:grid-cols-3">
        {report.scores.length === 0 ? (
          <Card><CardContent className="pt-5 text-sm text-muted-foreground">Нарушений нет. Score 100%.</CardContent></Card>
        ) : report.scores.map((score) => (
          <Card key={score.name}>
            <CardHeader><CardTitle>{score.name}</CardTitle></CardHeader>
            <CardContent>
              <div className="text-3xl font-semibold">{score.score}%</div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant={score.score < 60 ? "warning" : "secondary"}>{score.total} наруш.</Badge>
                <Badge variant="warning">Крит: {score.critical}</Badge>
                <Badge variant="outline">Сред: {score.medium}</Badge>
                <Badge variant="outline">Легк: {score.light}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Нарушения по сотрудникам</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {report.byEmployee.length === 0 ? <p className="text-muted-foreground">Нет данных.</p> : report.byEmployee.map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-3">
                <span>{row.name}</span>
                <span className="text-muted-foreground">{row.total} · крит. {row.critical} · премия {row.bonus}</span>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Нарушения по сущностям</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {report.byEntity.length === 0 ? <p className="text-muted-foreground">Нет данных.</p> : report.byEntity.map((row) => (
              <div key={row.name} className="flex items-center justify-between gap-3"><span>{row.name}</span><span className="text-muted-foreground">{row.count}</span></div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Самые частые нарушения</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {report.frequent.length === 0 ? <p className="text-muted-foreground">Нет данных.</p> : report.frequent.map((row) => (
              <div key={row.code} className="flex items-center justify-between gap-3"><span>{row.code}</span><span className="text-muted-foreground">{row.count}</span></div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Проблемные записи</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Раздел</TableHead><TableHead>Проблема</TableHead><TableHead>Серьезность</TableHead><TableHead>Ответственный</TableHead><TableHead>Код</TableHead><TableHead>Премирование</TableHead><TableHead>Запись</TableHead></TableRow></TableHeader>
            <TableBody>
              {report.problems.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">Нарушений нет.</TableCell></TableRow> : report.problems.map((problem) => (
                <TableRow key={`${problem.area}-${problem.href}-${problem.issue}`}>
                  <TableCell>{problem.area}</TableCell>
                  <TableCell>{problem.issue}</TableCell>
                  <TableCell><Badge variant={crmSeverityVariant(problem.severity)}>{severityLabels[problem.severity]}</Badge></TableCell>
                  <TableCell>{problem.responsibleName}</TableCell>
                  <TableCell>{problem.violationCode}</TableCell>
                  <TableCell>{problem.canAffectBonus ? "Влияет" : "Не влияет"}</TableCell>
                  <TableCell><Link className="font-medium hover:underline" href={problem.href}>{problem.entity}: {problem.title}</Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
