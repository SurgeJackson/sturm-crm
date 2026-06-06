import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BadgeCell,
  EmptyTableRow,
  EntityLinkCell,
  FileLinkCell,
  MoneyCell,
  TableCard,
  TextLinkCell
} from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  attitudeToSturmLabels,
  changeApprovalLabels,
  commercialProposalStatusLabels,
  dealProbabilityLabels,
  dealStageLabels,
  influenceLevelLabels,
  influenceTypeLabels,
  objectStageLabels,
  objectStatusLabels
} from "@/lib/constants";
import type { getClientForUser } from "@/modules/clients/queries";
import type { getDealForUser } from "@/modules/deals/queries";
import type { getDesignerForUser } from "@/modules/designers/queries";
import type { getProjectObjectForUser } from "@/modules/objects/queries";
import type { getProposalVersionGroup } from "@/modules/proposals/queries";
import { formatRussianDate } from "@/utils/date";

type ClientDetail = Awaited<ReturnType<typeof getClientForUser>>;
type DealDetail = Awaited<ReturnType<typeof getDealForUser>>;
type DesignerDetail = Awaited<ReturnType<typeof getDesignerForUser>>;
type ObjectDetail = Awaited<ReturnType<typeof getProjectObjectForUser>>;
type ProposalVersion = Awaited<ReturnType<typeof getProposalVersionGroup>>[number];

export function DealProposalsTable({
  dealId,
  proposals
}: {
  dealId: string;
  proposals: DealDetail["proposals"];
}) {
  return (
    <TableCard
      title="КП"
      actions={
        <Button asChild size="sm">
          <Link href={`/proposals/new?dealId=${dealId}`}>Создать КП по сделке</Link>
        </Button>
      }
    >
      <TableHeader>
        <TableRow>
          <TableHead>Номер</TableHead>
          <TableHead>Версия</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Отправлено</TableHead>
          <TableHead>Follow-up</TableHead>
          <TableHead>Файл</TableHead>
          <TableHead>Ответственный</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {proposals.length === 0 ? (
          <EmptyTableRow colSpan={8}>По сделке пока нет КП</EmptyTableRow>
        ) : proposals.map((proposal) => (
          <TableRow key={proposal.id}>
            <EntityLinkCell href={`/proposals/${proposal.id}`} title={proposal.proposalNumber} />
            <TableCell>v{proposal.version}</TableCell>
            <BadgeCell>{commercialProposalStatusLabels[proposal.status]}</BadgeCell>
            <MoneyCell value={proposal.amount} />
            <TableCell>{formatRussianDate(proposal.sentAt)}</TableCell>
            <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
            <FileLinkCell href={proposal.fileUrl} />
            <TableCell>{proposal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

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
            <BadgeCell variant="secondary">{objectStatusLabels[object.status]}</BadgeCell>
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
            <BadgeCell>{dealStageLabels[deal.stage]}</BadgeCell>
            <MoneyCell value={deal.potentialAmount} />
            <TableCell>{deal.responsible.name}</TableCell>
            <TableCell>{formatRussianDate(deal.nextActionAt)}</TableCell>
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
            <BadgeCell>{commercialProposalStatusLabels[proposal.status]}</BadgeCell>
            <MoneyCell value={proposal.amount} />
            <TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function ObjectParticipantsTables({
  objectId,
  purchaseInfluencers,
  implementationContacts,
  canManageParticipants,
  archiveParticipantAction
}: {
  objectId: string;
  purchaseInfluencers: ObjectDetail["participants"];
  implementationContacts: ObjectDetail["participants"];
  canManageParticipants: boolean;
  archiveParticipantAction: (participantId: string) => () => Promise<void>;
}) {
  return (
    <div className="space-y-4">
      <PurchaseInfluencersTable
        objectId={objectId}
        participants={purchaseInfluencers}
        canManageParticipants={canManageParticipants}
        archiveParticipantAction={archiveParticipantAction}
      />
      <ImplementationContactsTable
        objectId={objectId}
        participants={implementationContacts}
        canManageParticipants={canManageParticipants}
        archiveParticipantAction={archiveParticipantAction}
      />
    </div>
  );
}

function participantActions({
  objectId,
  participantId,
  canManageParticipants,
  archiveParticipantAction
}: {
  objectId: string;
  participantId: string;
  canManageParticipants: boolean;
  archiveParticipantAction: (participantId: string) => () => Promise<void>;
}) {
  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm"><Link href={`/objects/${objectId}/participants/${participantId}/edit`}>Открыть</Link></Button>
      {canManageParticipants ? (
        <form action={archiveParticipantAction(participantId)}>
          <Button type="submit" variant="ghost" size="sm">Архив</Button>
        </form>
      ) : null}
    </div>
  );
}

function PurchaseInfluencersTable({
  objectId,
  participants,
  canManageParticipants,
  archiveParticipantAction
}: {
  objectId: string;
  participants: ObjectDetail["participants"];
  canManageParticipants: boolean;
  archiveParticipantAction: (participantId: string) => () => Promise<void>;
}) {
  return (
    <TableCard
      title="Влияющие на закупку"
      actions={canManageParticipants ? (
        <Button asChild size="sm">
          <Link href={`/objects/${objectId}/participants/new?type=PURCHASE_INFLUENCER`}>
            <Plus className="h-4 w-4" />
            Добавить
          </Link>
        </Button>
      ) : null}
    >
      <TableHeader>
        <TableRow>
          <TableHead>ФИО</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead>Компания</TableHead>
          <TableHead>Уровень</TableHead>
          <TableHead>Тип влияния</TableHead>
          <TableHead>Отношение</TableHead>
          <TableHead>Что важно</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.length === 0 ? (
          <EmptyTableRow colSpan={9}>По объекту пока нет участников</EmptyTableRow>
        ) : participants.map((participant) => (
          <TableRow key={participant.id}>
            <TableCell className="font-medium">{participant.fullName}</TableCell>
            <TableCell>{participant.role}</TableCell>
            <TableCell>{participant.company || "Нет данных"}</TableCell>
            <TableCell>{participant.influenceLevel ? influenceLevelLabels[participant.influenceLevel] : "Нет данных"}</TableCell>
            <TableCell>{participant.influenceType ? influenceTypeLabels[participant.influenceType] : "Нет данных"}</TableCell>
            <TableCell>{participant.attitudeToSturm ? attitudeToSturmLabels[participant.attitudeToSturm] : "Нет данных"}</TableCell>
            <TableCell>{participant.decisionFactors || "Нет данных"}</TableCell>
            <TableCell>{participant.responsible?.name || "Не выбран"}</TableCell>
            <TableCell>
              {participantActions({ objectId, participantId: participant.id, canManageParticipants, archiveParticipantAction })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

function ImplementationContactsTable({
  objectId,
  participants,
  canManageParticipants,
  archiveParticipantAction
}: {
  objectId: string;
  participants: ObjectDetail["participants"];
  canManageParticipants: boolean;
  archiveParticipantAction: (participantId: string) => () => Promise<void>;
}) {
  return (
    <TableCard
      title="Контактные лица реализации"
      actions={canManageParticipants ? (
        <Button asChild size="sm">
          <Link href={`/objects/${objectId}/participants/new?type=IMPLEMENTATION_CONTACT`}>
            <Plus className="h-4 w-4" />
            Добавить
          </Link>
        </Button>
      ) : null}
    >
      <TableHeader>
        <TableRow>
          <TableHead>ФИО</TableHead>
          <TableHead>Роль</TableHead>
          <TableHead>Компания</TableHead>
          <TableHead>Зона</TableHead>
          <TableHead>Согласует</TableHead>
          <TableHead>Когда подключать</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.length === 0 ? (
          <EmptyTableRow colSpan={8}>По объекту пока нет участников</EmptyTableRow>
        ) : participants.map((participant) => (
          <TableRow key={participant.id}>
            <TableCell className="font-medium">{participant.fullName}</TableCell>
            <TableCell>{participant.role}</TableCell>
            <TableCell>{participant.company || "Нет данных"}</TableCell>
            <TableCell>{participant.responsibilityZone || "Нет данных"}</TableCell>
            <TableCell>{participant.canApproveChanges ? changeApprovalLabels[participant.canApproveChanges] : "Нет данных"}</TableCell>
            <TableCell>{participant.whenToInvolve || "Нет данных"}</TableCell>
            <TableCell>{participant.responsible?.name || "Не выбран"}</TableCell>
            <TableCell>
              {participantActions({ objectId, participantId: participant.id, canManageParticipants, archiveParticipantAction })}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function ObjectDealsTable({ objectId, deals }: { objectId: string; deals: ObjectDetail["deals"] }) {
  return (
    <TableCard
      title="Сделки"
      actions={
        <Button asChild size="sm">
          <Link href={`/deals/new?objectId=${objectId}`}>Создать сделку по объекту</Link>
        </Button>
      }
    >
      <TableHeader>
        <TableRow>
          <TableHead>Сделка</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Вероятность</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Следующее действие</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.length === 0 ? (
          <EmptyTableRow colSpan={6}>По объекту пока нет сделок</EmptyTableRow>
        ) : deals.map((deal) => (
          <TableRow key={deal.id}>
            <EntityLinkCell href={`/deals/${deal.id}`} title={deal.title} />
            <BadgeCell>{dealStageLabels[deal.stage]}</BadgeCell>
            <MoneyCell value={deal.potentialAmount} />
            <TableCell>{deal.probability ? dealProbabilityLabels[deal.probability] : "Не выбрана"}</TableCell>
            <TableCell>{deal.responsible.name}</TableCell>
            <TableCell>{formatRussianDate(deal.nextActionAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

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
            <BadgeCell>{commercialProposalStatusLabels[proposal.status]}</BadgeCell>
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
            <BadgeCell variant="secondary">{objectStatusLabels[object.status]}</BadgeCell>
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
            <BadgeCell>{dealStageLabels[deal.stage]}</BadgeCell>
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
            <BadgeCell>{commercialProposalStatusLabels[proposal.status]}</BadgeCell>
            <MoneyCell value={proposal.amount} />
            <TableCell>{proposal.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function ProposalVersionsTable({
  versions,
  canCreateVersion,
  createVersionAction
}: {
  versions: ProposalVersion[];
  canCreateVersion: boolean;
  createVersionAction: () => Promise<void>;
}) {
  return (
    <TableCard
      title="Версии КП"
      actions={canCreateVersion ? (
        <form action={createVersionAction}>
          <Button type="submit" size="sm">Создать новую версию</Button>
        </form>
      ) : null}
    >
      <TableHeader>
        <TableRow>
          <TableHead>Номер</TableHead>
          <TableHead>Версия</TableHead>
          <TableHead>Дата</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Статус</TableHead>
          <TableHead>Файл</TableHead>
          <TableHead>Ответственный</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {versions.length === 0 ? (
          <EmptyTableRow colSpan={7}>Версий КП пока нет</EmptyTableRow>
        ) : versions.map((item) => (
          <TableRow key={item.id}>
            <EntityLinkCell href={`/proposals/${item.id}`} title={item.proposalNumber} />
            <TableCell>v{item.version}</TableCell>
            <TableCell>{formatRussianDate(item.createdAt)}</TableCell>
            <MoneyCell value={item.amount} />
            <BadgeCell variant={item.status === "DECLINED" || item.status === "ARCHIVED" ? "warning" : item.status === "ACCEPTED" || item.status === "SENT" ? "secondary" : "outline"}>
              {commercialProposalStatusLabels[item.status]}
            </BadgeCell>
            <FileLinkCell href={item.fileUrl} />
            <TableCell>{item.responsible.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
