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
      <ReportPageHeader title="Отчет по сделкам" description="Воронка, суммы, действия и причины проигрыша." report="deals" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/deals">
        <ReportFilterSelect name="stage" value={params.stage} placeholder="Все стадии" options={dealStageOptions} />
        <ReportFilterSelect name="source" value={params.source} placeholder="Все источники" options={dealSourceOptions} />
        <ReportFilterSelect name="probability" value={params.probability} placeholder="Все вероятности" options={dealProbabilityOptions} />
      </ReportPeriodFilter>
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownCard title="Сделки по стадиям" data={Object.fromEntries(Object.entries(report.byStage).map(([key, value]) => [dealStageLabels[key as keyof typeof dealStageLabels] ?? key, value]))} />
        <BreakdownCard title="Причины проигрыша" data={Object.fromEntries(Object.entries(report.lossReasons).map(([key, value]) => [dealLossReasonLabels[key as keyof typeof dealLossReasonLabels] ?? key, value]))} />
      </div>
      <TableCard title="Сделки">
        <TableHeader><TableRow><TableHead>Сделка</TableHead><TableHead>Стадия</TableHead><TableHead>Источник</TableHead><TableHead>Вероятность</TableHead><TableHead>Сумма</TableHead><TableHead>Ответственный</TableHead><TableHead>Следующий шаг</TableHead></TableRow></TableHeader>
        <TableBody>
          {report.deals.length === 0 ? <EmptyTableRow colSpan={7}>Сделки не найдены.</EmptyTableRow> : report.deals.map((deal) => <TableRow key={deal.id}><TableCell><Link href={`/deals/${deal.id}`} className="font-medium hover:underline">{deal.title}</Link><div className="text-xs text-muted-foreground">{deal.client.name} / {deal.projectObject.title}</div></TableCell><TableCell><Badge variant="outline">{dealStageLabels[deal.stage]}</Badge></TableCell><TableCell>{dealSourceLabels[deal.source]}</TableCell><TableCell>{deal.probability ? dealProbabilityLabels[deal.probability] : "Нет"}</TableCell><TableCell>{deal.potentialAmount ? `${deal.potentialAmount.toLocaleString("ru-RU")} ₽` : "Нет"}</TableCell><TableCell>{deal.responsible.name}</TableCell><TableCell>{formatRussianDate(deal.nextActionAt)}</TableCell></TableRow>)}
        </TableBody>
      </TableCard>
    </div>
  );
}
