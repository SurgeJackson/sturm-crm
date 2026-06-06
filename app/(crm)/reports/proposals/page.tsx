import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { NativeSelect } from "@/components/ui/native-select";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BreakdownCard, ReportValueListCard } from "@/components/reports/cards";
import { ReportFilterSelect, ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
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
        <ReportValueListCard
          title="Сумма КП по сотрудникам"
          items={report.byResponsible}
          getKey={(row) => row.name}
          renderLabel={(row) => row.name}
          renderValue={(row) => `${row.count} / ${row.amount.toLocaleString("ru-RU")} ₽`}
        />
      </div>
      <TableCard title="КП">
        <TableHeader>
          <TableRow>
            <TableHead>КП</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Клиент</TableHead>
            <TableHead>Сделка</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Follow-up</TableHead>
            <TableHead>Ответственный</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {report.proposals.length === 0 ? (
            <EmptyTableRow colSpan={7}>КП не найдены.</EmptyTableRow>
          ) : report.proposals.map((proposal) => (
            <TableRow key={proposal.id}>
              <TableCell><Link href={`/proposals/${proposal.id}`} className="font-medium hover:underline">{proposal.proposalNumber}</Link></TableCell>
              <TableCell><Badge variant="outline">{commercialProposalStatusLabels[proposal.status]}</Badge></TableCell>
              <TableCell>{proposal.client.name}</TableCell>
              <TableCell>{proposal.deal.title}</TableCell>
              <TableCell>{proposal.amount.toLocaleString("ru-RU")} ₽</TableCell>
              <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
              <TableCell>{proposal.responsible.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>
    </div>
  );
}
