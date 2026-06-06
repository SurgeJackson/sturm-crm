import {
  DateCell,
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
              <EntityLinkCell cellLabel="Задача" href={`/tasks/${task.id}`} title={task.title} />
              <DateCell cellLabel="Срок">{formatRussianDateTime(task.dueAt)}</DateCell>
              <TableCell label="Ответственный">{task.responsible.name}</TableCell>
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
              <EntityLinkCell cellLabel="КП" href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
              <DateCell cellLabel="Follow-up">{formatRussianDate(proposal.nextTouchAt)}</DateCell>
              <TableCell label="Ответственный">{proposal.responsible.name}</TableCell>
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
              <EntityLinkCell cellLabel="Сделка" href={`/deals/${deal.id}`} title={deal.title} />
              <DateCell cellLabel="Дата">{formatRussianDate(deal.nextActionAt)}</DateCell>
              <TableCell label="Ответственный">{deal.responsible.name}</TableCell>
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
              <EntityLinkCell cellLabel="Дизайнер" href={`/designers/${designer.id}`} title={designer.name} />
              <DateCell cellLabel="Последнее касание">{formatRussianDate(designer.lastTouchAt)}</DateCell>
              <TableCell label="Ответственный">{designer.responsible.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>
    </ReportTablesGrid>
  );
}
