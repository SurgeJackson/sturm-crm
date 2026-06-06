import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { BreakdownCard } from "@/components/reports/cards";
import { ReportFilterSelect, ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { ObjectsReportTable } from "@/components/reports/tables";
import { objectStageLabels, objectTypeLabels } from "@/lib/constants";
import { objectStageOptions, objectStatusOptions, objectTypeOptions } from "@/modules/crm/options";
import { getObjectsReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function ObjectsReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getObjectsReport(params, user), getReportFilterOptions(user)]);
  return (
    <div className="space-y-6">
      <ReportPageHeader title="Отчет по объектам" description="Стадии, типы, участники и объекты без движения." report="objects" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/objects">
        <ReportFilterSelect name="stage" value={params.stage} placeholder="Все стадии" options={objectStageOptions} />
        <ReportFilterSelect name="status" value={params.status} placeholder="Все статусы" options={objectStatusOptions} />
        <ReportFilterSelect name="type" value={params.type} placeholder="Все типы" options={objectTypeOptions} />
      </ReportPeriodFilter>
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownCard
          title="Объекты по стадиям"
          data={report.byStage}
          labelFor={(key) => objectStageLabels[key as keyof typeof objectStageLabels] ?? key}
        />
        <BreakdownCard
          title="Объекты по типам"
          data={report.byType}
          labelFor={(key) => objectTypeLabels[key as keyof typeof objectTypeLabels] ?? key}
        />
      </div>
      <ObjectsReportTable objects={report.objects} />
    </div>
  );
}
