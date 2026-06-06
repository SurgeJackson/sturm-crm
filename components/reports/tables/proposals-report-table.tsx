import {
  BadgeCell,
  EntityLinkCell,
  EmptyTableRow,
  MoneyCell,
  TableCard
} from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { commercialProposalStatusLabels } from "@/lib/constants";
import type { getProposalsReport } from "@/modules/reports/queries";
import { formatRussianDate } from "@/utils/date";

type ProposalsReport = Awaited<ReturnType<typeof getProposalsReport>>;

export function ProposalsReportTable({ proposals }: { proposals: ProposalsReport["proposals"] }) {
  return (
    <TableCard title="КП">
      <TableHeader>
        <TableRow>
          <TableHead>КП</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Сделка</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Follow-up</TableHead>
          <TableHead>Ответственный</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.length === 0 ? (
          <EmptyTableRow colSpan={7}>КП не найдены.</EmptyTableRow>
        ) : proposals.map((proposal) => (
          <TableRow key={proposal.id}>
            <EntityLinkCell href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
            <BadgeCell>{commercialProposalStatusLabels[proposal.status]}</BadgeCell>
            <TableCell>{proposal.client.name}</TableCell>
            <TableCell>{proposal.deal.title}</TableCell>
            <MoneyCell value={proposal.amount} />
            <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
            <TableCell>{proposal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
