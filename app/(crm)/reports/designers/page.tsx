import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BreakdownCard } from "@/components/reports/cards";
import { ReportFilterSelect, ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { designerLoyaltyLabels, designerPotentialLabels, designerRelationshipStageLabels } from "@/lib/constants";
import { designerLoyaltyOptions, designerPotentialOptions, designerRelationshipStageOptions } from "@/modules/crm/options";
import { getDesignersReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";
import { formatRussianDate } from "@/utils/date";

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
        <BreakdownCard title="По этапам" data={Object.fromEntries(Object.entries(report.byStage).map(([key, value]) => [designerRelationshipStageLabels[key as keyof typeof designerRelationshipStageLabels] ?? key, value]))} />
        <BreakdownCard title="По потенциалу" data={Object.fromEntries(Object.entries(report.byPotential).map(([key, value]) => [designerPotentialLabels[key as keyof typeof designerPotentialLabels] ?? key, value]))} />
        <BreakdownCard title="По лояльности" data={Object.fromEntries(Object.entries(report.byLoyalty).map(([key, value]) => [designerLoyaltyLabels[key as keyof typeof designerLoyaltyLabels] ?? key, value]))} />
      </div>
      <TableCard title="Дизайнеры">
        <TableHeader><TableRow><TableHead>Дизайнер</TableHead><TableHead>Этап</TableHead><TableHead>Потенциал</TableHead><TableHead>Лояльность</TableHead><TableHead>Объекты</TableHead><TableHead>КП</TableHead><TableHead>Последнее касание</TableHead></TableRow></TableHeader>
        <TableBody>{report.designers.length === 0 ? <EmptyTableRow colSpan={7}>Дизайнеры не найдены.</EmptyTableRow> : report.designers.map((designer) => <TableRow key={designer.id}><TableCell><Link href={`/designers/${designer.id}`} className="font-medium hover:underline">{designer.name}</Link><div className="text-xs text-muted-foreground">{designer.studio}</div></TableCell><TableCell><Badge variant="outline">{designerRelationshipStageLabels[designer.relationshipStage]}</Badge></TableCell><TableCell>{designerPotentialLabels[designer.potential]}</TableCell><TableCell>{designerLoyaltyLabels[designer.loyalty]}</TableCell><TableCell>{designer.projectObjects.length}</TableCell><TableCell>{designer.proposals.length}</TableCell><TableCell>{formatRussianDate(designer.lastTouchAt)}</TableCell></TableRow>)}</TableBody>
      </TableCard>
    </div>
  );
}
