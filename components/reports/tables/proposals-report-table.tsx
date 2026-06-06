import {
  BadgeCell,
  DateCell,
  EntityLinkCell,
  EmptyTableRow,
  MoneyCell,
  TableCard
} from "@/components/ui/data-table";
import { proposalStatusVariant } from "@/components/crm/status-variants";
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
            <EntityLinkCell cellLabel="КП" href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
            <BadgeCell cellLabel="Статус" variant={proposalStatusVariant(proposal.status)}>
              {commercialProposalStatusLabels[proposal.status]}
            </BadgeCell>
            <TableCell label="Клиент">{proposal.client.name}</TableCell>
            <TableCell label="Сделка">{proposal.deal.title}</TableCell>
            <MoneyCell cellLabel="Сумма" value={proposal.amount} />
            <DateCell cellLabel="Follow-up">{formatRussianDate(proposal.nextTouchAt)}</DateCell>
            <TableCell label="Ответственный">{proposal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
