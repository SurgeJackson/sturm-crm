import {
  EntityLinkCell,
  EmptyTableRow,
  MoneyCell,
  TableCard
} from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { roleLabels } from "@/lib/constants";
import type { getEmployeeActivityReport } from "@/modules/reports/queries";

type ActivityReport = Awaited<ReturnType<typeof getEmployeeActivityReport>>;

export function ActivityReportTable({ rows }: { rows: ActivityReport["rows"] }) {
  return (
    <TableCard title="Таблица активности">
      <TableHeader>
        <TableRow>
          <TableHead>Сотрудник</TableHead>
          <TableHead>Клиенты</TableHead>
          <TableHead>Дизайнеры</TableHead>
          <TableHead>Объекты</TableHead>
          <TableHead>Сделки</TableHead>
          <TableHead>КП</TableHead>
          <TableHead>Сумма КП</TableHead>
          <TableHead>Задачи</TableHead>
          <TableHead>Выполнено</TableHead>
          <TableHead>Просрочено</TableHead>
          <TableHead>Касания</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyTableRow colSpan={11}>Активности за период нет.</EmptyTableRow>
        ) : rows.map((row) => (
          <TableRow key={row.employee.id}>
            <EntityLinkCell
              href={`/reports/activity?responsibleId=${row.employee.id}`}
              title={row.employee.name}
              description={roleLabels[row.employee.role]}
            />
            <TableCell>{row.clients}</TableCell>
            <TableCell>{row.designers}</TableCell>
            <TableCell>{row.objects}</TableCell>
            <TableCell>{row.deals}</TableCell>
            <TableCell>{row.proposals}</TableCell>
            <MoneyCell value={row.proposalAmount} />
            <TableCell>{row.tasks}</TableCell>
            <TableCell>{row.doneTasks}</TableCell>
            <TableCell>{row.overdueTasks}</TableCell>
            <TableCell>{row.touches}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
