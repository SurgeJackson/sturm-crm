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
type Participant = ObjectDetail["participants"][number];
type ArchiveParticipantAction = (participantId: string) => () => Promise<void>;
type ParticipantType = "PURCHASE_INFLUENCER" | "IMPLEMENTATION_CONTACT";
type ParticipantColumn = {
  head: string;
  render: (participant: Participant) => ReactNode;
};

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

function ParticipantRows({
  participants,
  columns,
  objectId,
  canManageParticipants,
  archiveParticipantAction
}: {
  participants: Participant[];
  columns: ParticipantColumn[];
  objectId: string;
  canManageParticipants: boolean;
  archiveParticipantAction: ArchiveParticipantAction;
}) {
  return (
    <TableBody>
      {participants.length === 0 ? (
        <EmptyTableRow colSpan={columns.length + 2}>По объекту пока нет участников</EmptyTableRow>
      ) : participants.map((participant) => (
        <TableRow key={participant.id}>
          <TableCell className="font-medium">{participant.fullName}</TableCell>
          {columns.map((column) => (
            <TableCell key={column.head}>{column.render(participant)}</TableCell>
          ))}
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
  );
}

function ParticipantsTable({
  title,
  participantType,
  objectId,
  participants,
  canManageParticipants,
  archiveParticipantAction,
  columns
}: {
  title: string;
  participantType: ParticipantType;
  objectId: string;
  participants: Participant[];
  canManageParticipants: boolean;
  archiveParticipantAction: ArchiveParticipantAction;
  columns: ParticipantColumn[];
}) {
  return (
    <ParticipantTableCard
      title={title}
      objectId={objectId}
      participantType={participantType}
      canManageParticipants={canManageParticipants}
    >
      <TableHeader>
        <TableRow>
          <TableHead>ФИО</TableHead>
          {columns.map((column) => (
            <TableHead key={column.head}>{column.head}</TableHead>
          ))}
          <TableHead>Ответственный</TableHead>
          <TableHead>Действия</TableHead>
        </TableRow>
      </TableHeader>
      <ParticipantRows
        participants={participants}
        columns={columns}
        objectId={objectId}
        canManageParticipants={canManageParticipants}
        archiveParticipantAction={archiveParticipantAction}
      />
    </ParticipantTableCard>
  );
}

const purchaseInfluencerColumns: ParticipantColumn[] = [
  { head: "Роль", render: (participant) => participant.role },
  { head: "Компания", render: (participant) => fieldValue(participant.company) },
  { head: "Уровень", render: (participant) => participant.influenceLevel ? influenceLevelLabels[participant.influenceLevel] : "Нет данных" },
  { head: "Тип влияния", render: (participant) => participant.influenceType ? influenceTypeLabels[participant.influenceType] : "Нет данных" },
  { head: "Отношение", render: (participant) => participant.attitudeToSturm ? attitudeToSturmLabels[participant.attitudeToSturm] : "Нет данных" },
  { head: "Что важно", render: (participant) => fieldValue(participant.decisionFactors) }
];

const implementationContactColumns: ParticipantColumn[] = [
  { head: "Роль", render: (participant) => participant.role },
  { head: "Компания", render: (participant) => fieldValue(participant.company) },
  { head: "Зона", render: (participant) => fieldValue(participant.responsibilityZone) },
  { head: "Согласует", render: (participant) => participant.canApproveChanges ? changeApprovalLabels[participant.canApproveChanges] : "Нет данных" },
  { head: "Когда подключать", render: (participant) => fieldValue(participant.whenToInvolve) }
];

function PurchaseInfluencersTable({
  objectId,
  participants,
  canManageParticipants,
  archiveParticipantAction
}: {
  objectId: string;
  participants: Participant[];
  canManageParticipants: boolean;
  archiveParticipantAction: ArchiveParticipantAction;
}) {
  return (
    <ParticipantsTable
      title="Влияющие на закупку"
      participantType="PURCHASE_INFLUENCER"
      objectId={objectId}
      participants={participants}
      canManageParticipants={canManageParticipants}
      archiveParticipantAction={archiveParticipantAction}
      columns={purchaseInfluencerColumns}
    />
  );
}

function ImplementationContactsTable({
  objectId,
  participants,
  canManageParticipants,
  archiveParticipantAction
}: {
  objectId: string;
  participants: Participant[];
  canManageParticipants: boolean;
  archiveParticipantAction: ArchiveParticipantAction;
}) {
  return (
    <ParticipantsTable
      title="Контактные лица реализации"
      participantType="IMPLEMENTATION_CONTACT"
      objectId={objectId}
      participants={participants}
      canManageParticipants={canManageParticipants}
      archiveParticipantAction={archiveParticipantAction}
      columns={implementationContactColumns}
    />
  );
}
