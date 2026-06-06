import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ReportValueListCard } from "@/components/reports/cards";
import { ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { getManagerDashboardReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function ManagerDashboardReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getManagerDashboardReport(params, user), getReportFilterOptions(user)]);

  return (
    <div className="space-y-6">
      <ReportPageHeader title="Дашборд руководителя" description="Продажи, потенциал, дизайнеры, объекты, задачи и дисциплина." report="manager-dashboard" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/manager-dashboard" />
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-2">
        <ReportValueListCard
          title="Просроченные задачи по сотрудникам"
          items={report.overdueByUser}
          emptyText="Просроченных задач нет."
          getKey={(row) => row.name}
          renderLabel={(row) => row.name}
          renderValue={(row) => row.count}
          valueVariant="warning"
        />
        <ReportValueListCard
          title="КП “клиент думает” 7+ дней"
          items={report.proposalThinkingRows}
          emptyText="Зависших КП нет."
          getKey={(proposal) => proposal.id}
          renderLabel={(proposal) => proposal.proposalNumber}
          renderValue={(proposal) => proposal.responsible.name}
          valueVariant="outline"
          hrefFor={(proposal) => `/proposals/${proposal.id}`}
        />
      </div>
    </div>
  );
}
