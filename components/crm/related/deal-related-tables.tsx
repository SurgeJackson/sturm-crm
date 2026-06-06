import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  BadgeCell,
  EmptyTableRow,
  EntityLinkCell,
  FileLinkCell,
  MoneyCell,
  TableCard
} from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { commercialProposalStatusLabels } from "@/lib/constants";
import type { getDealForUser } from "@/modules/deals/queries";
import { formatRussianDate } from "@/utils/date";

type DealDetail = Awaited<ReturnType<typeof getDealForUser>>;

export function DealProposalsTable({
  dealId,
  proposals
}: {
  dealId: string;
  proposals: DealDetail["proposals"];
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
            <EntityLinkCell href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
            <TableCell>v{proposal.version}</TableCell>
            <BadgeCell>{commercialProposalStatusLabels[proposal.status]}</BadgeCell>
            <MoneyCell value={proposal.amount} />
            <TableCell>{formatRussianDate(proposal.sentAt)}</TableCell>
            <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
            <FileLinkCell href={proposal.fileUrl} />
            <TableCell>{proposal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
