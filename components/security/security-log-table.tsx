import { BadgeCell, DateCell, EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { securityActionLabels, securitySeverityLabels, type getSecurityDashboard } from "@/modules/security/queries";
import { formatRussianDateTime } from "@/utils/date";

type SecurityLogs = Awaited<ReturnType<typeof getSecurityDashboard>>["logs"]["items"];

function severityVariant(severity: SecurityLogs[number]["severity"]) {
  if (severity === "CRITICAL" || severity === "WARNING") return "warning";
  return "outline";
}

export function SecurityLogTable({ logs }: { logs: SecurityLogs }) {
  return (
    <TableCard title="Журнал безопасности">
      <TableHeader>
        <TableRow>
          <TableHead>Дата</TableHead>
          <TableHead>Событие</TableHead>
          <TableHead>Пользователь</TableHead>
          <TableHead>Сущность</TableHead>
          <TableHead>IP</TableHead>
          <TableHead>Уровень</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.length === 0 ? <EmptyTableRow colSpan={6}>Событий нет</EmptyTableRow> : logs.map((log) => (
          <TableRow key={log.id}>
            <DateCell cellLabel="Дата">{formatRussianDateTime(log.createdAt)}</DateCell>
            <TableCell label="Событие">{securityActionLabels[log.action] ?? log.action}</TableCell>
            <TableCell label="Пользователь">{log.user?.name ?? "Система"}</TableCell>
            <TableCell label="Сущность">{log.entityType ? `${log.entityType}${log.entityId ? ` / ${log.entityId}` : ""}` : "Нет"}</TableCell>
            <TableCell label="IP">{log.ipAddress ?? "Нет"}</TableCell>
            <BadgeCell cellLabel="Уровень" variant={severityVariant(log.severity)}>{securitySeverityLabels[log.severity]}</BadgeCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
