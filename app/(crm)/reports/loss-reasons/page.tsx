import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { BreakdownCard } from "@/components/reports/cards";
import { ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { LossReasonsReportTables } from "@/components/reports/report-tables";
import { dealLossReasonLabels, objectTypeLabels, proposalDeclineReasonLabels } from "@/lib/constants";
import { getLossReasonsReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function LossReasonsReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getLossReasonsReport(params, user), getReportFilterOptions(user)]);
  return (
    <div className="space-y-6">
      <ReportPageHeader title="Причины проигрышей" description="Сделки, отклоненные КП и потерянные объекты." report="loss-reasons" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/loss-reasons" />
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-3">
        <BreakdownCard
          title="Причины проигрыша сделок"
          data={report.dealReasons}
          labelFor={(key) => dealLossReasonLabels[key as keyof typeof dealLossReasonLabels] ?? key}
        />
        <BreakdownCard
          title="Причины отклонения КП"
          data={report.proposalReasons}
          labelFor={(key) => proposalDeclineReasonLabels[key as keyof typeof proposalDeclineReasonLabels] ?? key}
        />
        <BreakdownCard title="По ответственным" data={report.byResponsible} />
        <BreakdownCard title="По дизайнерам" data={report.byDesigner} />
        <BreakdownCard
          title="По типам объектов"
          data={report.byObjectType}
          labelFor={(key) => objectTypeLabels[key as keyof typeof objectTypeLabels] ?? key}
        />
      </div>
      <LossReasonsReportTables lostDeals={report.lostDeals} declinedProposals={report.declinedProposals} />
    </div>
  );
}
