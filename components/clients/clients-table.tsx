import { BonusEligibilityCell, CrmDisciplineCell } from "@/components/crm/table-cells";
import { BadgeCell, DateCell, EmptyTableRow, EntityLinkCell, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { clientSourceLabels, clientStatusLabels, clientTypeLabels } from "@/lib/constants";
import type { getClients } from "@/modules/clients/queries";
import { formatRussianDate } from "@/utils/date";

type ClientItem = Awaited<ReturnType<typeof getClients>>["items"][number];

export function ClientsTable({ clients }: { clients: ClientItem[] }) {
  return (
    <TableCard>
      <TableHeader>
        <TableRow>
          <TableHead>Клиент</TableHead>
          <TableHead>Контакты</TableHead>
          <TableHead>Тип / источник</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Следующий контакт</TableHead>
          <TableHead>CRM-дисциплина</TableHead>
          <TableHead>Учет в премии</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.length === 0 ? (
          <EmptyTableRow colSpan={8}>Клиенты не найдены.</EmptyTableRow>
        ) : (
          clients.map((client) => (
            <TableRow key={client.id}>
              <EntityLinkCell href={`/clients/${client.id}`} title={client.name} description={client.city ?? "Город не указан"} />
              <TableCell>
                <div>{client.phone ?? client.messenger ?? "Нет контакта"}</div>
                <div className="text-xs text-muted-foreground">{client.email ?? ""}</div>
              </TableCell>
              <TableCell>
                <div>{clientTypeLabels[client.clientType]}</div>
                <div className="text-xs text-muted-foreground">{clientSourceLabels[client.source]}</div>
              </TableCell>
              <BadgeCell variant={client.status === "ARCHIVED" ? "outline" : "secondary"}>{clientStatusLabels[client.status]}</BadgeCell>
              <TableCell>{client.responsible.name}</TableCell>
              <DateCell>{formatRussianDate(client.nextContactAt)}</DateCell>
              <CrmDisciplineCell violations={client.crmViolations} />
              <BonusEligibilityCell violations={client.crmViolations} />
            </TableRow>
          ))
        )}
      </TableBody>
    </TableCard>
  );
}
