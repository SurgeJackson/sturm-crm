import {
  BadgeCell,
  DateCell,
  EmptyTableRow,
  EntityLinkCell,
  MoneyCell,
  TableCard,
  TextLinkCell
} from "@/components/ui/data-table";
import { dealStageVariant, objectStatusVariant, proposalStatusVariant } from "@/components/crm/status-variants";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  commercialProposalStatusLabels,
  dealStageLabels,
  objectStageLabels,
  objectStatusLabels
} from "@/lib/constants";
import type { getClientForUser } from "@/modules/clients/queries";
import { canViewSensitiveFields, type PermissionUser } from "@/permissions";
import { formatRussianDate } from "@/utils/date";

type ClientDetail = Awaited<ReturnType<typeof getClientForUser>>;

export function ClientRelatedTables({ client, user }: { client: ClientDetail; user: PermissionUser }) {
  return (
    <div className="grid gap-4">
      <ClientRelatedObjectsTable objects={client.projectObjects} />
      <ClientRelatedDealsTable deals={client.deals} />
      <ClientRelatedProposalsTable proposals={client.proposals} user={user} />
    </div>
  );
}

function ClientRelatedObjectsTable({ objects }: { objects: ClientDetail["projectObjects"] }) {
  return (
    <TableCard title="Связанные объекты">
      <TableHeader>
        <TableRow>
          <TableHead>Объект</TableHead>
          <TableHead>Дизайнер</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {objects.length === 0 ? (
          <EmptyTableRow colSpan={5}>У клиента пока нет связанных объектов.</EmptyTableRow>
        ) : objects.map((object) => (
          <TableRow key={object.id}>
            <EntityLinkCell cellLabel="Объект" href={`/objects/${object.id}`} title={object.title} />
            <TableCell label="Дизайнер">{object.designer?.name || "Не выбран"}</TableCell>
            <TableCell label="Ответственный">{object.responsible.name}</TableCell>
            <BadgeCell cellLabel="Стадия">{objectStageLabels[object.stage]}</BadgeCell>
            <BadgeCell cellLabel="Статус" variant={objectStatusVariant(object.status)}>{objectStatusLabels[object.status]}</BadgeCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

function ClientRelatedDealsTable({ deals }: { deals: ClientDetail["deals"] }) {
  return (
    <TableCard title="Связанные сделки">
      <TableHeader>
        <TableRow>
          <TableHead>Сделка</TableHead>
          <TableHead>Объект</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Следующее действие</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.length === 0 ? (
          <EmptyTableRow colSpan={6}>У клиента пока нет связанных сделок.</EmptyTableRow>
        ) : deals.map((deal) => (
          <TableRow key={deal.id}>
            <EntityLinkCell cellLabel="Сделка" href={`/deals/${deal.id}`} title={deal.title} />
            <TextLinkCell cellLabel="Объект" href={`/objects/${deal.projectObject.id}`}>{deal.projectObject.title}</TextLinkCell>
            <BadgeCell cellLabel="Стадия" variant={dealStageVariant(deal.stage)}>{dealStageLabels[deal.stage]}</BadgeCell>
            <MoneyCell cellLabel="Сумма" value={deal.potentialAmount} />
            <TableCell label="Ответственный">{deal.responsible.name}</TableCell>
            <DateCell cellLabel="Следующее действие">{formatRussianDate(deal.nextActionAt)}</DateCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

function ClientRelatedProposalsTable({ proposals, user }: { proposals: ClientDetail["proposals"]; user: PermissionUser }) {
  return (
    <TableCard title="Связанные КП">
      <TableHeader>
        <TableRow>
          <TableHead>КП</TableHead>
          <TableHead>Сделка</TableHead>
          <TableHead>Объект</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Follow-up</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.length === 0 ? (
          <EmptyTableRow colSpan={6}>По клиенту пока нет КП</EmptyTableRow>
        ) : proposals.map((proposal) => (
          <TableRow key={proposal.id}>
            <EntityLinkCell cellLabel="КП" href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
            <TextLinkCell cellLabel="Сделка" href={`/deals/${proposal.deal.id}`}>{proposal.deal.title}</TextLinkCell>
            <TextLinkCell cellLabel="Объект" href={`/objects/${proposal.projectObject.id}`}>{proposal.projectObject.title}</TextLinkCell>
            <BadgeCell cellLabel="Статус" variant={proposalStatusVariant(proposal.status)}>
              {commercialProposalStatusLabels[proposal.status]}
            </BadgeCell>
            <MoneyCell cellLabel="Сумма" value={canViewSensitiveFields(user, proposal) ? proposal.amount : null} emptyText="Скрыто" />
            <DateCell cellLabel="Follow-up">{formatRussianDate(proposal.nextTouchAt)}</DateCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
