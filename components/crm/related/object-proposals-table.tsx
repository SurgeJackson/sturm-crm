import { proposalStatusVariant } from "@/components/crm/status-variants";
import {
  BadgeCell,
  EmptyTableRow,
  EntityLinkCell,
  MoneyCell,
  TableCard,
  TextLinkCell
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
            <TableCell>v{proposal.version}</TableCell>
            <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
            <TableCell>{proposal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
