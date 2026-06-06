import { proposalStatusVariant } from "@/components/crm/status-variants";
import { Button } from "@/components/ui/button";
import {
  BadgeCell,
  DateCell,
  EmptyTableRow,
  EntityLinkCell,
  FileLinkCell,
  MoneyCell,
  TableCard,
  VersionCell
} from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { commercialProposalStatusLabels } from "@/lib/constants";
import type { getProposalVersionGroup } from "@/modules/proposals/queries";
import { formatRussianDate } from "@/utils/date";

type ProposalVersion = Awaited<ReturnType<typeof getProposalVersionGroup>>[number];

export function ProposalVersionsTable({
  versions,
  canCreateVersion,
  createVersionAction
}: {
  versions: ProposalVersion[];
  canCreateVersion: boolean;
  createVersionAction: () => Promise<void>;
}) {
  return (
    <TableCard
      title="Версии КП"
      actions={canCreateVersion ? (
        <form action={createVersionAction}>
          <Button type="submit" size="sm">Создать новую версию</Button>
        </form>
      ) : null}
    >
      <TableHeader>
        <TableRow>
          <TableHead>Номер</TableHead>
          <TableHead>Версия</TableHead>
          <TableHead>Дата</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Файл</TableHead>
          <TableHead>Ответственный</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {versions.length === 0 ? (
          <EmptyTableRow colSpan={7}>Версий КП пока нет</EmptyTableRow>
        ) : versions.map((item) => (
          <TableRow key={item.id}>
            <EntityLinkCell href={`/proposals/${item.id}`} title={item.proposalNumber} />
            <VersionCell value={item.version} />
            <DateCell>{formatRussianDate(item.createdAt)}</DateCell>
            <MoneyCell value={item.amount} />
            <BadgeCell variant={proposalStatusVariant(item.status)}>
              {commercialProposalStatusLabels[item.status]}
            </BadgeCell>
            <FileLinkCell href={item.fileUrl} />
            <TableCell>{item.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
