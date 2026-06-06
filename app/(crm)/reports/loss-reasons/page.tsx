import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BreakdownCard, MetricsGrid, ReportPageHeader, ReportPeriodFilter } from "@/components/reports/report-widgets";
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
        <BreakdownCard title="Причины проигрыша сделок" data={Object.fromEntries(Object.entries(report.dealReasons).map(([key, value]) => [dealLossReasonLabels[key as keyof typeof dealLossReasonLabels] ?? key, value]))} />
        <BreakdownCard title="Причины отклонения КП" data={Object.fromEntries(Object.entries(report.proposalReasons).map(([key, value]) => [proposalDeclineReasonLabels[key as keyof typeof proposalDeclineReasonLabels] ?? key, value]))} />
        <BreakdownCard title="По ответственным" data={report.byResponsible} />
        <BreakdownCard title="По дизайнерам" data={report.byDesigner} />
        <BreakdownCard title="По типам объектов" data={Object.fromEntries(Object.entries(report.byObjectType).map(([key, value]) => [objectTypeLabels[key as keyof typeof objectTypeLabels] ?? key, value]))} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Проигранные сделки</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Сделка</TableHead><TableHead>Причина</TableHead><TableHead>Сумма</TableHead><TableHead>Ответственный</TableHead></TableRow></TableHeader><TableBody>{report.lostDeals.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">Нет проигранных сделок.</TableCell></TableRow> : report.lostDeals.map((deal) => <TableRow key={deal.id}><TableCell><Link className="font-medium hover:underline" href={`/deals/${deal.id}`}>{deal.title}</Link></TableCell><TableCell>{deal.lossReason ? dealLossReasonLabels[deal.lossReason] : "Не указана"}</TableCell><TableCell>{deal.potentialAmount ? `${deal.potentialAmount.toLocaleString("ru-RU")} ₽` : "Нет"}</TableCell><TableCell>{deal.responsible.name}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        <Card><CardHeader><CardTitle>Отклоненные КП</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>КП</TableHead><TableHead>Причина</TableHead><TableHead>Сумма</TableHead><TableHead>Ответственный</TableHead></TableRow></TableHeader><TableBody>{report.declinedProposals.length === 0 ? <TableRow><TableCell colSpan={4} className="h-24 text-center text-sm text-muted-foreground">Нет отклоненных КП.</TableCell></TableRow> : report.declinedProposals.map((proposal) => <TableRow key={proposal.id}><TableCell><Link className="font-medium hover:underline" href={`/proposals/${proposal.id}`}>{proposal.proposalNumber}</Link></TableCell><TableCell>{proposal.declineReason ? proposalDeclineReasonLabels[proposal.declineReason] : "Не указана"}</TableCell><TableCell>{proposal.amount.toLocaleString("ru-RU")} ₽</TableCell><TableCell>{proposal.responsible.name}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      </div>
    </div>
  );
}
