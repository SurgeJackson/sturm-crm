import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CsvButton, MetricsGrid, ReportPeriodFilter } from "@/components/reports/report-widgets";
import { bonusEligibilityLabels, type BonusEligibilityStatus } from "@/modules/crm-discipline/service";
import { getBonusEligibilityReport, getReportFilterOptions, type BonusEligibilityRow, type ReportSearchParams } from "@/modules/reports/queries";
import { formatRussianDate } from "@/utils/date";

type PageProps = { searchParams: Promise<ReportSearchParams> };

const entityTabs = [
  { value: "DEAL", label: "Сделки" },
  { value: "PROPOSAL", label: "КП" },
  { value: "CLIENT", label: "Клиенты" },
  { value: "OBJECT", label: "Объекты" }
] as const;

function statusVariant(status: BonusEligibilityStatus) {
  if (status === "NOT_ELIGIBLE") return "warning" as const;
  if (status === "NEEDS_FIX") return "outline" as const;
  return "secondary" as const;
}

function RowsTable({ rows }: { rows: BonusEligibilityRow[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Сущность</TableHead>
          <TableHead>Название</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Статус учета</TableHead>
          <TableHead>Нарушения</TableHead>
          <TableHead>Влияет на премию</TableHead>
          <TableHead>Дата обнаружения</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">Записей нет.</TableCell></TableRow>
        ) : rows.map((row) => (
          <TableRow key={`${row.entityType}-${row.href}`}>
            <TableCell>{row.entity}</TableCell>
            <TableCell><Link className="font-medium hover:underline" href={row.href}>{row.title}</Link></TableCell>
            <TableCell>{row.responsibleName}</TableCell>
            <TableCell><Badge variant={statusVariant(row.status)}>{bonusEligibilityLabels[row.status]}</Badge></TableCell>
            <TableCell>{row.violations.length ? row.violations.join("; ") : "Нет активных нарушений"}</TableCell>
            <TableCell>{row.affectsBonus ? "Да" : "Нет"}</TableCell>
            <TableCell>{formatRussianDate(row.detectedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default async function BonusEligibilityReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [report, filters] = await Promise.all([getBonusEligibilityReport(params, user), getReportFilterOptions(user)]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Премиальный статус CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">Какие записи готовы к управленческому учету, а какие требуют исправления.</p>
        </div>
        <div className="flex gap-2">
          <CsvButton report="bonus-eligibility" params={params} />
          <Button asChild variant="outline"><Link href="/reports">К отчетам</Link></Button>
        </div>
      </div>

      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/bonus-eligibility">
        <select name="entity" defaultValue={params.entity ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Все сущности</option>
          {entityTabs.map((tab) => <option key={tab.value} value={tab.value}>{tab.label}</option>)}
        </select>
        <select name="bonusStatus" defaultValue={params.bonusStatus ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Все статусы учета</option>
          <option value="ELIGIBLE">Учитывается</option>
          <option value="NEEDS_FIX">Требует исправления</option>
          <option value="NOT_ELIGIBLE">Не учитывается</option>
        </select>
        <select name="severity" defaultValue={params.severity ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
          <option value="">Любая серьезность</option>
          <option value="critical">Критические</option>
          <option value="medium">Средние</option>
          <option value="low">Легкие</option>
        </select>
        <input name="violationCode" defaultValue={params.violationCode ?? ""} placeholder="Код нарушения" className="h-10 rounded-md border border-input bg-background px-3 text-sm" />
      </ReportPeriodFilter>

      <MetricsGrid metrics={report.metrics} />

      <Card>
        <CardHeader><CardTitle>Записи по статусу учета</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="DEAL">
            <div className="p-4 pb-0">
              <TabsList className="flex-wrap">
                {entityTabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
              </TabsList>
            </div>
            {entityTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                <RowsTable rows={report.rows.filter((row) => row.entityType === tab.value)} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
