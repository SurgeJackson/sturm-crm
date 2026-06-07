import Link from "next/link";
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
import type { getDealForUser } from "@/modules/deals/queries";
import { canViewSensitiveFields, type PermissionUser } from "@/permissions";
import { formatRussianDate } from "@/utils/date";

type DealDetail = Awaited<ReturnType<typeof getDealForUser>>;

export function DealProposalsTable({
  dealId,
  proposals,
  user
}: {
  dealId: string;
  proposals: DealDetail["proposals"];
  user: PermissionUser;
}) {
  return (
    <TableCard
      title="КП"
      actions={
        <Button asChild size="sm">
          <Link href={`/proposals/new?dealId=${dealId}`}>Создать КП по сделке</Link>
        </Button>
      }
    >
      <TableHeader>
        <TableRow>
          <TableHead>Номер</TableHead>
          <TableHead>Версия</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Отправлено</TableHead>
          <TableHead>Follow-up</TableHead>
          <TableHead>Файл</TableHead>
          <TableHead>Ответственный</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.length === 0 ? (
          <EmptyTableRow colSpan={8}>По сделке пока нет КП</EmptyTableRow>
        ) : proposals.map((proposal) => (
          <TableRow key={proposal.id}>
            <EntityLinkCell cellLabel="Номер" href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
            <VersionCell cellLabel="Версия" value={proposal.version} />
            <BadgeCell cellLabel="Статус" variant={proposalStatusVariant(proposal.status)}>
              {commercialProposalStatusLabels[proposal.status]}
            </BadgeCell>
            <MoneyCell cellLabel="Сумма" value={canViewSensitiveFields(user, proposal) ? proposal.amount : null} emptyText="Скрыто" />
            <DateCell cellLabel="Отправлено">{formatRussianDate(proposal.sentAt)}</DateCell>
            <DateCell cellLabel="Follow-up">{formatRussianDate(proposal.nextTouchAt)}</DateCell>
            <FileLinkCell cellLabel="Файл" href={proposal.fileUrl ? `/api/proposals/${proposal.id}/download` : null} />
            <TableCell label="Ответственный">{proposal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
