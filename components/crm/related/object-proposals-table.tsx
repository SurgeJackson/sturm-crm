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
import { canViewSensitiveFields, type PermissionUser } from "@/permissions";
import { formatRussianDate } from "@/utils/date";

type ObjectDetail = Awaited<ReturnType<typeof getProjectObjectForUser>>;

export function ObjectProposalsTable({ proposals, user }: { proposals: ObjectDetail["proposals"]; user: PermissionUser }) {
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
            <EntityLinkCell cellLabel="КП" href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
            <TextLinkCell cellLabel="Сделка" href={`/deals/${proposal.deal.id}`}>{proposal.deal.title}</TextLinkCell>
            <BadgeCell cellLabel="Статус" variant={proposalStatusVariant(proposal.status)}>
              {commercialProposalStatusLabels[proposal.status]}
            </BadgeCell>
            <MoneyCell cellLabel="Сумма" value={canViewSensitiveFields(user, proposal) ? proposal.amount : null} emptyText="Скрыто" />
            <VersionCell cellLabel="Версия" value={proposal.version} />
            <DateCell cellLabel="Follow-up">{formatRussianDate(proposal.nextTouchAt)}</DateCell>
            <TableCell label="Ответственный">{proposal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
