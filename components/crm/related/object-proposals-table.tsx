import { proposalStatusVariant } from "@/components/crm/status-variants";
import {
  BadgeCell,
  DateCell,
  EmptyTableRow,
  EntityLinkCell,
  MoneyCell,
  TableCard,
  TextLinkCell,
  VersionCell
} from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { commercialProposalStatusLabels } from "@/lib/constants";
import type { getProjectObjectForUser } from "@/modules/objects/queries";
import { formatRussianDate } from "@/utils/date";

type ObjectDetail = Awaited<ReturnType<typeof getProjectObjectForUser>>;

export function ObjectProposalsTable({ proposals }: { proposals: ObjectDetail["proposals"] }) {
  return (
    <TableCard title="КП">
      <TableHeader>
        <TableRow>
          <TableHead>КП</TableHead>
          <TableHead>Сделка</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Версия</TableHead>
          <TableHead>Follow-up</TableHead>
          <TableHead>Ответственный</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.length === 0 ? (
          <EmptyTableRow colSpan={7}>По объекту пока нет КП</EmptyTableRow>
        ) : proposals.map((proposal) => (
          <TableRow key={proposal.id}>
            <EntityLinkCell href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
            <TextLinkCell href={`/deals/${proposal.deal.id}`}>{proposal.deal.title}</TextLinkCell>
            <BadgeCell variant={proposalStatusVariant(proposal.status)}>
              {commercialProposalStatusLabels[proposal.status]}
            </BadgeCell>
            <MoneyCell value={proposal.amount} />
            <VersionCell value={proposal.version} />
            <DateCell>{formatRussianDate(proposal.nextTouchAt)}</DateCell>
            <TableCell>{proposal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
