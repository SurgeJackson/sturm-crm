import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BreakdownCard, MetricsGrid, ReportFilterSelect, ReportPageHeader, ReportPeriodFilter } from "@/components/reports/report-widgets";
import { commercialProposalStatusLabels, proposalDeclineReasonLabels } from "@/lib/constants";
import { commercialProposalStatusOptions } from "@/modules/crm/options";
import { getProposalsReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";
import { formatRussianDate } from "@/utils/date";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function ProposalsReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getProposalsReport(params, user), getReportFilterOptions(user)]);
  return (
    <div className="space-y-6">
      <ReportPageHeader title="Отчет по КП" description="Потенциальная выручка, статусы, follow-up и причины отказов." report="proposals" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/proposals">
        <ReportFilterSelect name="status" value={params.status} placeholder="Все статусы" options={commercialProposalStatusOptions} />
        <NativeSelect name="clientId" defaultValue={params.clientId ?? ""}><option value="">Все клиенты</option>{filters.clients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect>
        <NativeSelect name="designerId" defaultValue={params.designerId ?? ""}><option value="">Все дизайнеры</option>{filters.designers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</NativeSelect>
      </ReportPeriodFilter>
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-3">
        <BreakdownCard title="КП по статусам" data={Object.fromEntries(Object.entries(report.byStatus).map(([key, value]) => [commercialProposalStatusLabels[key as keyof typeof commercialProposalStatusLabels] ?? key, value]))} />
        <BreakdownCard title="Причины отклонения" data={Object.fromEntries(Object.entries(report.declineReasons).map(([key, value]) => [proposalDeclineReasonLabels[key as keyof typeof proposalDeclineReasonLabels] ?? key, value]))} />
        <Card><CardHeader><CardTitle>Сумма КП по сотрудникам</CardTitle></CardHeader><CardContent className="space-y-2">{report.byResponsible.length === 0 ? <p className="text-sm text-muted-foreground">Данных нет.</p> : report.byResponsible.map((row) => <div key={row.name} className="flex items-center justify-between rounded-md border p-3 text-sm"><span>{row.name}</span><Badge variant="secondary">{row.count} / {row.amount.toLocaleString("ru-RU")} ₽</Badge></div>)}</CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>КП</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>КП</TableHead><TableHead>Статус</TableHead><TableHead>Клиент</TableHead><TableHead>Сделка</TableHead><TableHead>Сумма</TableHead><TableHead>Follow-up</TableHead><TableHead>Ответственный</TableHead></TableRow></TableHeader><TableBody>{report.proposals.length === 0 ? <TableRow><TableCell colSpan={7} className="h-24 text-center text-sm text-muted-foreground">КП не найдены.</TableCell></TableRow> : report.proposals.map((proposal) => <TableRow key={proposal.id}><TableCell><Link href={`/proposals/${proposal.id}`} className="font-medium hover:underline">{proposal.proposalNumber}</Link></TableCell><TableCell><Badge variant="outline">{commercialProposalStatusLabels[proposal.status]}</Badge></TableCell><TableCell>{proposal.client.name}</TableCell><TableCell>{proposal.deal.title}</TableCell><TableCell>{proposal.amount.toLocaleString("ru-RU")} ₽</TableCell><TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell><TableCell>{proposal.responsible.name}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </div>
  );
}
