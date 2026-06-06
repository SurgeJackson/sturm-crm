import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsGrid, ReportPageHeader, ReportPeriodFilter } from "@/components/reports/report-widgets";
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
        <Card>
          <CardHeader><CardTitle>Просроченные задачи по сотрудникам</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {report.overdueByUser.length === 0 ? <p className="text-sm text-muted-foreground">Просроченных задач нет.</p> : report.overdueByUser.map((row) => (
              <div key={row.name} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <span>{row.name}</span><Badge variant="warning">{row.count}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>КП “клиент думает” 7+ дней</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {report.proposalThinkingRows.length === 0 ? <p className="text-sm text-muted-foreground">Зависших КП нет.</p> : report.proposalThinkingRows.map((proposal) => (
              <Link key={proposal.id} href={`/proposals/${proposal.id}`} className="flex items-center justify-between rounded-md border p-3 text-sm hover:border-primary">
                <span>{proposal.proposalNumber}</span><span className="text-muted-foreground">{proposal.responsible.name}</span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
