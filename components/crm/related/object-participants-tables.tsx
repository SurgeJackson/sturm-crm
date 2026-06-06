import Link from "next/link";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  attitudeToSturmLabels,
  changeApprovalLabels,
  influenceLevelLabels,
  influenceTypeLabels
} from "@/lib/constants";
import type { getProjectObjectForUser } from "@/modules/objects/queries";

type ObjectDetail = Awaited<ReturnType<typeof getProjectObjectForUser>>;
type ArchiveParticipantAction = (participantId: string) => () => Promise<void>;
type ParticipantType = "PURCHASE_INFLUENCER" | "IMPLEMENTATION_CONTACT";

function fieldValue(value?: string | null) {
  return value || "Нет данных";
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

function ParticipantTableCard({
  title,
  objectId,
  participantType,
  canManageParticipants,
  children
}: {
  title: string;
  objectId: string;
  participantType: ParticipantType;
  canManageParticipants: boolean;
  children: ReactNode;
}) {
  return (
    <TableCard
      title={title}
      actions={canManageParticipants ? (
        <Button asChild size="sm">
          <Link href={`/objects/${objectId}/participants/new?type=${participantType}`}>
            <Plus className="h-4 w-4" />
            Добавить
          </Link>
        </Button>
      ) : null}
    >
      {children}
    </TableCard>
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
    <ParticipantTableCard
      title="Влияющие на закупку"
      objectId={objectId}
      participantType="PURCHASE_INFLUENCER"
      canManageParticipants={canManageParticipants}
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
            <TableCell>{fieldValue(participant.company)}</TableCell>
            <TableCell>{participant.influenceLevel ? influenceLevelLabels[participant.influenceLevel] : "Нет данных"}</TableCell>
            <TableCell>{participant.influenceType ? influenceTypeLabels[participant.influenceType] : "Нет данных"}</TableCell>
            <TableCell>{participant.attitudeToSturm ? attitudeToSturmLabels[participant.attitudeToSturm] : "Нет данных"}</TableCell>
            <TableCell>{fieldValue(participant.decisionFactors)}</TableCell>
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
    </ParticipantTableCard>
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
    <ParticipantTableCard
      title="Контактные лица реализации"
      objectId={objectId}
      participantType="IMPLEMENTATION_CONTACT"
      canManageParticipants={canManageParticipants}
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
            <TableCell>{fieldValue(participant.company)}</TableCell>
            <TableCell>{fieldValue(participant.responsibilityZone)}</TableCell>
            <TableCell>{participant.canApproveChanges ? changeApprovalLabels[participant.canApproveChanges] : "Нет данных"}</TableCell>
            <TableCell>{fieldValue(participant.whenToInvolve)}</TableCell>
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
    </ParticipantTableCard>
  );
}
