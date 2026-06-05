import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BreakdownCard, CsvButton, MetricsGrid, ReportPeriodFilter } from "@/components/reports/report-widgets";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-semibold">Дизайнеры / архитекторы</h1><p className="mt-1 text-sm text-muted-foreground">Развитие партнеров, касания, потенциал и переданные объекты.</p></div><div className="flex gap-2"><CsvButton report="designers" params={params} /><Button asChild variant="outline"><Link href="/reports">К отчетам</Link></Button></div></div>
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/designers">
        <select name="stage" defaultValue={params.stage ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Все этапы</option>{designerRelationshipStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <select name="probability" defaultValue={params.probability ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Весь потенциал</option>{designerPotentialOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <select name="status" defaultValue={params.status ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Вся лояльность</option>{designerLoyaltyOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      </ReportPeriodFilter>
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-3">
        <BreakdownCard title="По этапам" data={Object.fromEntries(Object.entries(report.byStage).map(([key, value]) => [designerRelationshipStageLabels[key as keyof typeof designerRelationshipStageLabels] ?? key, value]))} />
        <BreakdownCard title="По потенциалу" data={Object.fromEntries(Object.entries(report.byPotential).map(([key, value]) => [designerPotentialLabels[key as keyof typeof designerPotentialLabels] ?? key, value]))} />
        <BreakdownCard title="По лояльности" data={Object.fromEntries(Object.entries(report.byLoyalty).map(([key, value]) => [designerLoyaltyLabels[key as keyof typeof designerLoyaltyLabels] ?? key, value]))} />
      </div>
      <Card><CardHeader><CardTitle>Дизайнеры</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Дизайнер</TableHead><TableHead>Этап</TableHead><TableHead>Потенциал</TableHead><TableHead>Лояльность</TableHead><TableHead>Объекты</TableHead><TableHead>КП</TableHead><TableHead>Последнее касание</TableHead></TableRow></TableHeader><TableBody>{report.designers.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">Дизайнеры не найдены.</TableCell></TableRow> : report.designers.map((designer) => <TableRow key={designer.id}><TableCell><Link href={`/designers/${designer.id}`} className="font-medium hover:underline">{designer.name}</Link><div className="text-xs text-muted-foreground">{designer.studio}</div></TableCell><TableCell><Badge variant="outline">{designerRelationshipStageLabels[designer.relationshipStage]}</Badge></TableCell><TableCell>{designerPotentialLabels[designer.potential]}</TableCell><TableCell>{designerLoyaltyLabels[designer.loyalty]}</TableCell><TableCell>{designer.projectObjects.length}</TableCell><TableCell>{designer.proposals.length}</TableCell><TableCell>{formatRussianDate(designer.lastTouchAt)}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </div>
  );
}
