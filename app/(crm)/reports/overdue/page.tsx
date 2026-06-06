import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { getOverdueReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";
import { formatRussianDate, formatRussianDateTime } from "@/utils/date";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function OverdueReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getOverdueReport(params, user), getReportFilterOptions(user)]);
  return (
    <div className="space-y-6">
      <ReportPageHeader title="Просрочки" description="Задачи, follow-up, сделки, дизайнеры, объекты и клиенты без движения." report="overdue" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/overdue" />
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-2">
        <TableCard title="Просроченные задачи">
          <TableHeader>
            <TableRow>
              <TableHead>Задача</TableHead>
              <TableHead>Срок</TableHead>
              <TableHead>Ответственный</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.tasks.length === 0 ? (
              <EmptyTableRow colSpan={3}>Просроченных задач нет.</EmptyTableRow>
            ) : report.tasks.map((task) => (
              <TableRow key={task.id}>
                <TableCell><Link className="font-medium hover:underline" href={`/tasks/${task.id}`}>{task.title}</Link></TableCell>
                <TableCell>{formatRussianDateTime(task.dueAt)}</TableCell>
                <TableCell>{task.responsible.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableCard>

        <TableCard title="Просроченный follow-up КП">
          <TableHeader>
            <TableRow>
              <TableHead>КП</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead>Ответственный</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.proposalFollowUps.length === 0 ? (
              <EmptyTableRow colSpan={3}>Просроченных follow-up нет.</EmptyTableRow>
            ) : report.proposalFollowUps.map((proposal) => (
              <TableRow key={proposal.id}>
                <TableCell><Link className="font-medium hover:underline" href={`/proposals/${proposal.id}`}>{proposal.proposalNumber}</Link></TableCell>
                <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
                <TableCell>{proposal.responsible.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableCard>

        <TableCard title="Сделки с просроченным действием">
          <TableHeader>
            <TableRow>
              <TableHead>Сделка</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Ответственный</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.deals.length === 0 ? (
              <EmptyTableRow colSpan={3}>Таких сделок нет.</EmptyTableRow>
            ) : report.deals.map((deal) => (
              <TableRow key={deal.id}>
                <TableCell><Link className="font-medium hover:underline" href={`/deals/${deal.id}`}>{deal.title}</Link></TableCell>
                <TableCell>{formatRussianDate(deal.nextActionAt)}</TableCell>
                <TableCell>{deal.responsible.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableCard>

        <TableCard title="Дизайнеры без касаний">
          <TableHeader>
            <TableRow>
              <TableHead>Дизайнер</TableHead>
              <TableHead>Последнее касание</TableHead>
              <TableHead>Ответственный</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {report.designers.length === 0 ? (
              <EmptyTableRow colSpan={3}>Дизайнеров без касаний нет.</EmptyTableRow>
            ) : report.designers.map((designer) => (
              <TableRow key={designer.id}>
                <TableCell><Link className="font-medium hover:underline" href={`/designers/${designer.id}`}>{designer.name}</Link></TableCell>
                <TableCell>{formatRussianDate(designer.lastTouchAt)}</TableCell>
                <TableCell>{designer.responsible.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableCard>
      </div>
    </div>
  );
}
