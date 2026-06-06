import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { BreakdownCard } from "@/components/reports/cards";
import { ReportFilterSelect, ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { DealsReportTable } from "@/components/reports/tables";
import { dealLossReasonLabels, dealStageLabels } from "@/lib/constants";
import { dealProbabilityOptions, dealSourceOptions, dealStageOptions } from "@/modules/crm/options";
import { getDealsReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function DealsReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getDealsReport(params, user), getReportFilterOptions(user)]);

  return (
    <div className="space-y-6">
      <ReportPageHeader title="Отчет по сделкам" description="Воронка, суммы, действия и причины проигрыша." report="deals" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/deals">
        <ReportFilterSelect name="stage" value={params.stage} placeholder="Все стадии" options={dealStageOptions} />
        <ReportFilterSelect name="source" value={params.source} placeholder="Все источники" options={dealSourceOptions} />
        <ReportFilterSelect name="probability" value={params.probability} placeholder="Все вероятности" options={dealProbabilityOptions} />
      </ReportPeriodFilter>
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownCard
          title="Сделки по стадиям"
          data={report.byStage}
          labelFor={(key) => dealStageLabels[key as keyof typeof dealStageLabels] ?? key}
        />
        <BreakdownCard
          title="Причины проигрыша"
          data={report.lossReasons}
          labelFor={(key) => dealLossReasonLabels[key as keyof typeof dealLossReasonLabels] ?? key}
        />
      </div>
      <DealsReportTable deals={report.deals} />
    </div>
  );
}
