import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { BreakdownCard } from "@/components/reports/cards";
import { ReportFilterSelect, ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { DesignersReportTable } from "@/components/reports/report-tables";
import { designerLoyaltyLabels, designerPotentialLabels, designerRelationshipStageLabels } from "@/lib/constants";
import { designerLoyaltyOptions, designerPotentialOptions, designerRelationshipStageOptions } from "@/modules/crm/options";
import { getDesignersReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function DesignersReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getDesignersReport(params, user), getReportFilterOptions(user)]);
  return (
    <div className="space-y-6">
      <ReportPageHeader title="Дизайнеры / архитекторы" description="Развитие партнеров, касания, потенциал и переданные объекты." report="designers" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/designers">
        <ReportFilterSelect name="stage" value={params.stage} placeholder="Все этапы" options={designerRelationshipStageOptions} />
        <ReportFilterSelect name="probability" value={params.probability} placeholder="Весь потенциал" options={designerPotentialOptions} />
        <ReportFilterSelect name="status" value={params.status} placeholder="Вся лояльность" options={designerLoyaltyOptions} />
      </ReportPeriodFilter>
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-3">
        <BreakdownCard
          title="По этапам"
          data={report.byStage}
          labelFor={(key) => designerRelationshipStageLabels[key as keyof typeof designerRelationshipStageLabels] ?? key}
        />
        <BreakdownCard
          title="По потенциалу"
          data={report.byPotential}
          labelFor={(key) => designerPotentialLabels[key as keyof typeof designerPotentialLabels] ?? key}
        />
        <BreakdownCard
          title="По лояльности"
          data={report.byLoyalty}
          labelFor={(key) => designerLoyaltyLabels[key as keyof typeof designerLoyaltyLabels] ?? key}
        />
      </div>
      <DesignersReportTable designers={report.designers} />
    </div>
  );
}
