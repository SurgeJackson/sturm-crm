import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { OverdueReportTables } from "@/components/reports/tables";
import { getOverdueReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function OverdueReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getOverdueReport(params, user), getReportFilterOptions(user)]);
  return (
    <div className="space-y-6">
      <ReportPageHeader title="Просрочки" description="Задачи, follow-up, сделки, дизайнеры, объекты и клиенты без движения." report="overdue" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/overdue" />
      <MetricsGrid metrics={report.metrics} />
      <OverdueReportTables report={report} />
    </div>
  );
}
