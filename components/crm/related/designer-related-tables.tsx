import {
  BadgeCell,
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
import type { getDesignerForUser } from "@/modules/designers/queries";

type DesignerDetail = Awaited<ReturnType<typeof getDesignerForUser>>;

export function DesignerObjectsTable({ objects }: { objects: DesignerDetail["projectObjects"] }) {
  return (
    <TableCard title="Переданные объекты">
      <TableHeader>
        <TableRow>
          <TableHead>Объект</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Статус</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {objects.length === 0 ? (
          <EmptyTableRow colSpan={5}>Дизайнер пока не передал объекты.</EmptyTableRow>
        ) : objects.map((object) => (
          <TableRow key={object.id}>
            <EntityLinkCell href={`/objects/${object.id}`} title={object.title} />
            <TextLinkCell href={`/clients/${object.client.id}`}>{object.client.name}</TextLinkCell>
            <TableCell>{object.responsible.name}</TableCell>
            <BadgeCell>{objectStageLabels[object.stage]}</BadgeCell>
            <BadgeCell variant={objectStatusVariant(object.status)}>{objectStatusLabels[object.status]}</BadgeCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function DesignerDealsTable({ deals }: { deals: DesignerDetail["deals"] }) {
  return (
    <TableCard title="Связанные сделки">
      <TableHeader>
        <TableRow>
          <TableHead>Сделка</TableHead>
          <TableHead>Объект</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Ответственный</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.length === 0 ? (
          <EmptyTableRow colSpan={5}>У дизайнера пока нет связанных сделок.</EmptyTableRow>
        ) : deals.map((deal) => (
          <TableRow key={deal.id}>
            <EntityLinkCell href={`/deals/${deal.id}`} title={deal.title} />
            <TextLinkCell href={`/objects/${deal.projectObject.id}`}>{deal.projectObject.title}</TextLinkCell>
            <BadgeCell variant={dealStageVariant(deal.stage)}>{dealStageLabels[deal.stage]}</BadgeCell>
            <MoneyCell value={deal.potentialAmount} />
            <TableCell>{deal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function DesignerProposalsTable({ proposals }: { proposals: DesignerDetail["proposals"] }) {
  return (
    <TableCard title="КП по объектам дизайнера">
      <TableHeader>
        <TableRow>
          <TableHead>КП</TableHead>
          <TableHead>Сделка</TableHead>
          <TableHead>Объект</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Ответственный</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.length === 0 ? (
          <EmptyTableRow colSpan={6}>По дизайнеру пока нет КП</EmptyTableRow>
        ) : proposals.map((proposal) => (
          <TableRow key={proposal.id}>
            <EntityLinkCell href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
            <TextLinkCell href={`/deals/${proposal.deal.id}`}>{proposal.deal.title}</TextLinkCell>
            <TextLinkCell href={`/objects/${proposal.projectObject.id}`}>{proposal.projectObject.title}</TextLinkCell>
            <BadgeCell variant={proposalStatusVariant(proposal.status)}>
              {commercialProposalStatusLabels[proposal.status]}
            </BadgeCell>
            <MoneyCell value={proposal.amount} />
            <TableCell>{proposal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
