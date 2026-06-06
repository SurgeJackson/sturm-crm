import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { CrmDisciplineBreakdowns, CrmProblemsTable, CrmScoreGrid } from "@/components/reports/crm-discipline";
import { ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { getCrmDisciplineReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";

type PageProps = { searchParams: Promise<ReportSearchParams> };

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
        <Input name="violationCode" defaultValue={params.violationCode ?? ""} placeholder="Код нарушения" />
      </ReportPeriodFilter>
      <MetricsGrid metrics={[
        { title: "Активные нарушения", value: report.summary.active, tone: report.summary.active ? "warning" : "secondary" },
        { title: "Критические", value: report.summary.critical, tone: report.summary.critical ? "warning" : "secondary" },
        { title: "Средние", value: report.summary.medium },
        { title: "Легкие", value: report.summary.low },
        { title: "Влияют на премирование", value: report.summary.bonus, tone: report.summary.bonus ? "warning" : "secondary" },
        { title: "Исправлено за период", value: report.summary.resolved, tone: "secondary" }
      ]} />
      <CrmScoreGrid scores={report.scores} />
      <CrmDisciplineBreakdowns byEmployee={report.byEmployee} byEntity={report.byEntity} frequent={report.frequent} />
      <CrmProblemsTable problems={report.problems} />
    </div>
  );
}
