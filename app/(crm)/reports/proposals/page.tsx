import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { BreakdownCard, ReportValueListCard } from "@/components/reports/cards";
import { ReportFilterSelect, ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { ProposalsReportTable } from "@/components/reports/tables";
import { commercialProposalStatusLabels, proposalDeclineReasonLabels } from "@/lib/constants";
import { commercialProposalStatusOptions } from "@/modules/crm/options";
import { getProposalsReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";
import { formatMoney } from "@/utils/money";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function ProposalsReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([
    getProposalsReport(params, user),
    getReportFilterOptions(user, { clients: true, designers: true })
  ]);
  return (
    <div className="space-y-6">
      <ReportPageHeader title="Отчет по КП" description="Потенциальная выручка, статусы, follow-up и причины отказов." report="proposals" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/proposals">
        <ReportFilterSelect name="status" value={params.status} placeholder="Все статусы" options={commercialProposalStatusOptions} />
        <ReportFilterSelect
          name="clientId"
          value={params.clientId}
          placeholder="Все клиенты"
          options={filters.clients.map((item) => ({ value: item.id, label: item.name }))}
        />
        <ReportFilterSelect
          name="designerId"
          value={params.designerId}
          placeholder="Все дизайнеры"
          options={filters.designers.map((item) => ({ value: item.id, label: item.name }))}
        />
      </ReportPeriodFilter>
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-3">
        <BreakdownCard
          title="КП по статусам"
          data={report.byStatus}
          labelFor={(key) => commercialProposalStatusLabels[key as keyof typeof commercialProposalStatusLabels] ?? key}
        />
        <BreakdownCard
          title="Причины отклонения"
          data={report.declineReasons}
          labelFor={(key) => proposalDeclineReasonLabels[key as keyof typeof proposalDeclineReasonLabels] ?? key}
        />
        <ReportValueListCard
          title="Сумма КП по сотрудникам"
          items={report.byResponsible}
          getKey={(row) => row.name}
          renderLabel={(row) => row.name}
          renderValue={(row) => `${row.count} / ${formatMoney(row.amount, "0 ₽")}`}
        />
      </div>
      <ProposalsReportTable proposals={report.proposals} />
    </div>
  );
}
