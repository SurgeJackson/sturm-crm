import {
  CountCell,
  EntityLinkCell,
  EmptyTableRow,
  MoneyCell,
  TableCard
} from "@/components/ui/data-table";
import { TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
              cellLabel="Сотрудник"
              href={`/reports/activity?responsibleId=${row.employee.id}`}
              title={row.employee.name}
              description={roleLabels[row.employee.role]}
            />
            <CountCell cellLabel="Клиенты" value={row.clients} />
            <CountCell cellLabel="Дизайнеры" value={row.designers} />
            <CountCell cellLabel="Объекты" value={row.objects} />
            <CountCell cellLabel="Сделки" value={row.deals} />
            <CountCell cellLabel="КП" value={row.proposals} />
            <MoneyCell cellLabel="Сумма КП" value={row.proposalAmount} />
            <CountCell cellLabel="Задачи" value={row.tasks} />
            <CountCell cellLabel="Выполнено" value={row.doneTasks} />
            <CountCell cellLabel="Просрочено" value={row.overdueTasks} />
            <CountCell cellLabel="Касания" value={row.touches} />
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
