import {
  EntityLinkCell,
  EmptyTableRow,
  MoneyCell,
  TableCard
} from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dealLossReasonLabels, proposalDeclineReasonLabels } from "@/lib/constants";
import type { getLossReasonsReport } from "@/modules/reports/queries";
import { ReportTablesGrid } from "./report-tables-grid";

type LossReasonsReport = Awaited<ReturnType<typeof getLossReasonsReport>>;

export function LossReasonsReportTables({
  lostDeals,
  declinedProposals
}: {
  lostDeals: LossReasonsReport["lostDeals"];
  declinedProposals: LossReasonsReport["declinedProposals"];
}) {
  return (
    <ReportTablesGrid>
      <TableCard title="Проигранные сделки">
        <TableHeader>
          <TableRow>
            <TableHead>Сделка</TableHead>
            <TableHead>Причина</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Ответственный</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lostDeals.length === 0 ? (
            <EmptyTableRow colSpan={4}>Нет проигранных сделок.</EmptyTableRow>
          ) : lostDeals.map((deal) => (
            <TableRow key={deal.id}>
              <EntityLinkCell href={`/deals/${deal.id}`} title={deal.title} />
              <TableCell>{deal.lossReason ? dealLossReasonLabels[deal.lossReason] : "Не указана"}</TableCell>
              <MoneyCell value={deal.potentialAmount} emptyText="Нет" />
              <TableCell>{deal.responsible.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>

      <TableCard title="Отклоненные КП">
        <TableHeader>
          <TableRow>
            <TableHead>КП</TableHead>
            <TableHead>Причина</TableHead>
            <TableHead>Сумма</TableHead>
            <TableHead>Ответственный</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {declinedProposals.length === 0 ? (
            <EmptyTableRow colSpan={4}>Нет отклоненных КП.</EmptyTableRow>
          ) : declinedProposals.map((proposal) => (
            <TableRow key={proposal.id}>
              <EntityLinkCell href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
              <TableCell>{proposal.declineReason ? proposalDeclineReasonLabels[proposal.declineReason] : "Не указана"}</TableCell>
              <MoneyCell value={proposal.amount} />
              <TableCell>{proposal.responsible.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </TableCard>
    </ReportTablesGrid>
  );
}
