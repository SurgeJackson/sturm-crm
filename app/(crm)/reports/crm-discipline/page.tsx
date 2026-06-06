import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Input } from "@/components/ui/input";
import { CrmDisciplineBreakdowns, CrmProblemsTable, CrmScoreGrid } from "@/components/reports/crm-discipline";
import { ReportFilterSelect, ReportPeriodFilter } from "@/components/reports/filters";
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
        <ReportFilterSelect
          name="severity"
          value={params.severity}
          placeholder="Все нарушения"
          options={[
            { value: "critical", label: "Критичные" },
            { value: "medium", label: "Средние" },
            { value: "low", label: "Легкие" }
          ]}
        />
        <ReportFilterSelect
          name="entity"
          value={params.entity}
          placeholder="Все сущности"
          options={[
            { value: "CLIENT", label: "Клиенты" },
            { value: "DESIGNER", label: "Дизайнеры" },
            { value: "OBJECT", label: "Объекты" },
            { value: "DEAL", label: "Сделки" },
            { value: "PROPOSAL", label: "КП" },
            { value: "TASK", label: "Задачи" }
          ]}
        />
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
