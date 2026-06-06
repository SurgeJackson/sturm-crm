import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BadgeCell,
  EmptyTableRow,
  EntityLinkCell,
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
  influenceTypeLabels
} from "@/lib/constants";
import type { getProjectObjectForUser } from "@/modules/objects/queries";
import { formatRussianDate } from "@/utils/date";

type ObjectDetail = Awaited<ReturnType<typeof getProjectObjectForUser>>;

type ArchiveParticipantAction = (participantId: string) => () => Promise<void>;

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
  archiveParticipantAction: ArchiveParticipantAction;
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

function ParticipantActions({
  objectId,
  participantId,
  canManageParticipants,
  archiveParticipantAction
}: {
  objectId: string;
  participantId: string;
  canManageParticipants: boolean;
  archiveParticipantAction: ArchiveParticipantAction;
}) {
  return (
    <div className="flex gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href={`/objects/${objectId}/participants/${participantId}/edit`}>Открыть</Link>
      </Button>
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
  archiveParticipantAction: ArchiveParticipantAction;
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
              <ParticipantActions
                objectId={objectId}
                participantId={participant.id}
                canManageParticipants={canManageParticipants}
                archiveParticipantAction={archiveParticipantAction}
              />
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
  archiveParticipantAction: ArchiveParticipantAction;
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
              <ParticipantActions
                objectId={objectId}
                participantId={participant.id}
                canManageParticipants={canManageParticipants}
                archiveParticipantAction={archiveParticipantAction}
              />
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
