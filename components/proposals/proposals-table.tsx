import Link from "next/link";
import { BonusEligibilityBadge, CrmDisciplineBadge } from "@/components/crm/discipline/badges";
import { proposalStatusVariant } from "@/components/crm/status-variants";
import { Badge } from "@/components/ui/badge";
import { DateCell, EmptyTableRow, EntityLinkCell, MoneyCell, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { commercialProposalStatusLabels } from "@/lib/constants";
import type { getProposals } from "@/modules/proposals/queries";
import { formatRussianDate } from "@/utils/date";

type ProposalItem = Awaited<ReturnType<typeof getProposals>>["items"][number];

export function ProposalsTable({ proposals }: { proposals: ProposalItem[] }) {
  return (
    <TableCard>
      <TableHeader>
        <TableRow>
          <TableHead>КП</TableHead>
          <TableHead>Сделка</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Версия</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Отправлено</TableHead>
          <TableHead>Follow-up</TableHead>
          <TableHead>Файл</TableHead>
          <TableHead>CRM-дисциплина</TableHead>
          <TableHead>Учет в премии</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.length === 0 ? (
          <EmptyTableRow colSpan={11}>КП не найдены.</EmptyTableRow>
        ) : (
          proposals.map((proposal) => (
            <TableRow key={proposal.id}>
              <EntityLinkCell href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} description={proposal.projectObject.title} />
              <TableCell><Link href={`/deals/${proposal.deal.id}`} className="hover:underline">{proposal.deal.title}</Link></TableCell>
              <TableCell><Link href={`/clients/${proposal.client.id}`} className="hover:underline">{proposal.client.name}</Link></TableCell>
              <TableCell><Badge variant={proposalStatusVariant(proposal.status)}>{commercialProposalStatusLabels[proposal.status]}</Badge></TableCell>
              <TableCell>v{proposal.version}</TableCell>
              <MoneyCell value={proposal.amount} />
              <DateCell>{formatRussianDate(proposal.sentAt)}</DateCell>
              <DateCell>{formatRussianDate(proposal.nextTouchAt)}</DateCell>
              <TableCell>{proposal.fileUrl ? <Link className="hover:underline" href={proposal.fileUrl}>Скачать</Link> : "Нет файла"}</TableCell>
              <TableCell><CrmDisciplineBadge violations={proposal.crmViolations} /></TableCell>
              <TableCell><BonusEligibilityBadge violations={proposal.crmViolations} /></TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </TableCard>
  );
}
