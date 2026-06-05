import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BreakdownCard, CsvButton, MetricsGrid, ReportPeriodFilter } from "@/components/reports/report-widgets";
import { dealStageLabels, dealSourceLabels, dealProbabilityLabels, dealLossReasonLabels } from "@/lib/constants";
import { dealProbabilityOptions, dealSourceOptions, dealStageOptions } from "@/modules/crm/options";
import { getDealsReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";
import { formatRussianDate } from "@/utils/date";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function DealsReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getDealsReport(params, user), getReportFilterOptions(user)]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-semibold">Отчет по сделкам</h1><p className="mt-1 text-sm text-muted-foreground">Воронка, суммы, действия и причины проигрыша.</p></div>
        <div className="flex gap-2"><CsvButton report="deals" params={params} /><Button asChild variant="outline"><Link href="/reports">К отчетам</Link></Button></div>
      </div>
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/deals">
        <select name="stage" defaultValue={params.stage ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Все стадии</option>{dealStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <select name="source" defaultValue={params.source ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Все источники</option>{dealSourceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <select name="probability" defaultValue={params.probability ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Все вероятности</option>{dealProbabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      </ReportPeriodFilter>
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownCard title="Сделки по стадиям" data={Object.fromEntries(Object.entries(report.byStage).map(([key, value]) => [dealStageLabels[key as keyof typeof dealStageLabels] ?? key, value]))} />
        <BreakdownCard title="Причины проигрыша" data={Object.fromEntries(Object.entries(report.lossReasons).map(([key, value]) => [dealLossReasonLabels[key as keyof typeof dealLossReasonLabels] ?? key, value]))} />
      </div>
      <Card><CardHeader><CardTitle>Сделки</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Сделка</TableHead><TableHead>Стадия</TableHead><TableHead>Источник</TableHead><TableHead>Вероятность</TableHead><TableHead>Сумма</TableHead><TableHead>Ответственный</TableHead><TableHead>Следующий шаг</TableHead></TableRow></TableHeader><TableBody>
        {report.deals.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">Сделки не найдены.</TableCell></TableRow> : report.deals.map((deal) => <TableRow key={deal.id}><TableCell><Link href={`/deals/${deal.id}`} className="font-medium hover:underline">{deal.title}</Link><div className="text-xs text-muted-foreground">{deal.client.name} / {deal.projectObject.title}</div></TableCell><TableCell><Badge variant="outline">{dealStageLabels[deal.stage]}</Badge></TableCell><TableCell>{dealSourceLabels[deal.source]}</TableCell><TableCell>{deal.probability ? dealProbabilityLabels[deal.probability] : "Нет"}</TableCell><TableCell>{deal.potentialAmount ? `${deal.potentialAmount.toLocaleString("ru-RU")} ₽` : "Нет"}</TableCell><TableCell>{deal.responsible.name}</TableCell><TableCell>{formatRussianDate(deal.nextActionAt)}</TableCell></TableRow>)}
      </TableBody></Table></CardContent></Card>
    </div>
  );
}
