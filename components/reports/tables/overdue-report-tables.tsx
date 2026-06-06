import {
  EntityLinkCell,
  EmptyTableRow,
  TableCard
} from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { getOverdueReport } from "@/modules/reports/queries";
import { formatRussianDate, formatRussianDateTime } from "@/utils/date";
import { ReportTablesGrid } from "./report-tables-grid";

type OverdueReport = Awaited<ReturnType<typeof getOverdueReport>>;

export function OverdueReportTables({ report }: { report: OverdueReport }) {
  return (
    <ReportTablesGrid>
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
              <EntityLinkCell href={`/tasks/${task.id}`} title={task.title} />
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
              <EntityLinkCell href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
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
              <EntityLinkCell href={`/deals/${deal.id}`} title={deal.title} />
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
              <EntityLinkCell href={`/designers/${designer.id}`} title={designer.name} />
              <TableCell>{formatRussianDate(designer.lastTouchAt)}</TableCell>
              <TableCell>{designer.responsible.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>
    </ReportTablesGrid>
  );
}
