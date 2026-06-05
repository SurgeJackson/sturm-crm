import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CsvButton, ReportPeriodFilter } from "@/components/reports/report-widgets";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">CRM-дисциплина</h1>
          <p className="mt-1 text-sm text-muted-foreground">Score = 100 - критичные нарушения * 10 - средние * 5 - легкие * 2.</p>
        </div>
        <div className="flex gap-2"><CsvButton report="crm-discipline" params={params} /><Button asChild variant="outline"><Link href="/reports">К отчетам</Link></Button></div>
      </div>
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/crm-discipline">
        <select name="severity" defaultValue={params.severity ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Все нарушения</option>
          <option value="critical">Критичные</option>
          <option value="medium">Средние</option>
          <option value="light">Легкие</option>
        </select>
      </ReportPeriodFilter>
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
      <Card>
        <CardHeader><CardTitle>Проблемные записи</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Раздел</TableHead><TableHead>Проблема</TableHead><TableHead>Серьезность</TableHead><TableHead>Ответственный</TableHead><TableHead>Запись</TableHead></TableRow></TableHeader>
            <TableBody>
              {report.problems.length === 0 ? <TableRow><TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">Нарушений нет.</TableCell></TableRow> : report.problems.map((problem) => (
                <TableRow key={`${problem.area}-${problem.href}-${problem.issue}`}>
                  <TableCell>{problem.area}</TableCell><TableCell>{problem.issue}</TableCell><TableCell><Badge variant={problem.severity === "critical" ? "warning" : "outline"}>{severityLabels[problem.severity]}</Badge></TableCell><TableCell>{problem.responsibleName}</TableCell><TableCell><Link className="font-medium hover:underline" href={problem.href}>{problem.entity}: {problem.title}</Link></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
