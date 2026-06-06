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
import { formatRussianDate } from "@/utils/date";

type ClientDetail = Awaited<ReturnType<typeof getClientForUser>>;

export function ClientRelatedTables({ client }: { client: ClientDetail }) {
  return (
    <div className="grid gap-4">
      <ClientRelatedObjectsTable objects={client.projectObjects} />
      <ClientRelatedDealsTable deals={client.deals} />
      <ClientRelatedProposalsTable proposals={client.proposals} />
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
            <EntityLinkCell href={`/objects/${object.id}`} title={object.title} />
            <TableCell>{object.designer?.name || "Не выбран"}</TableCell>
            <TableCell>{object.responsible.name}</TableCell>
            <BadgeCell>{objectStageLabels[object.stage]}</BadgeCell>
            <BadgeCell variant={objectStatusVariant(object.status)}>{objectStatusLabels[object.status]}</BadgeCell>
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
            <EntityLinkCell href={`/deals/${deal.id}`} title={deal.title} />
            <TextLinkCell href={`/objects/${deal.projectObject.id}`}>{deal.projectObject.title}</TextLinkCell>
            <BadgeCell variant={dealStageVariant(deal.stage)}>{dealStageLabels[deal.stage]}</BadgeCell>
            <MoneyCell value={deal.potentialAmount} />
            <TableCell>{deal.responsible.name}</TableCell>
            <DateCell>{formatRussianDate(deal.nextActionAt)}</DateCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

function ClientRelatedProposalsTable({ proposals }: { proposals: ClientDetail["proposals"] }) {
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
            <EntityLinkCell href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
            <TextLinkCell href={`/deals/${proposal.deal.id}`}>{proposal.deal.title}</TextLinkCell>
            <TextLinkCell href={`/objects/${proposal.projectObject.id}`}>{proposal.projectObject.title}</TextLinkCell>
            <BadgeCell variant={proposalStatusVariant(proposal.status)}>
              {commercialProposalStatusLabels[proposal.status]}
            </BadgeCell>
            <MoneyCell value={proposal.amount} />
            <DateCell>{formatRussianDate(proposal.nextTouchAt)}</DateCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
