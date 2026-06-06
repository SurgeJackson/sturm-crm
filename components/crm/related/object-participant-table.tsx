import Link from "next/link";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyTableRow, PersonCell, TableCard, TextCell } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { getProjectObjectForUser } from "@/modules/objects/queries";

export type ObjectParticipant = Awaited<ReturnType<typeof getProjectObjectForUser>>["participants"][number];
export type ArchiveParticipantAction = (participantId: string) => () => Promise<void>;
export type ParticipantType = "PURCHASE_INFLUENCER" | "IMPLEMENTATION_CONTACT";
export type ParticipantColumn = {
  head: string;
  render: (participant: ObjectParticipant) => ReactNode;
};

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

export function ObjectParticipantTable({
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
  participants: ObjectParticipant[];
  canManageParticipants: boolean;
  archiveParticipantAction: ArchiveParticipantAction;
  columns: ParticipantColumn[];
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
      <TableBody>
        {participants.length === 0 ? (
          <EmptyTableRow colSpan={columns.length + 2}>По объекту пока нет участников</EmptyTableRow>
        ) : participants.map((participant) => (
          <TableRow key={participant.id}>
            <TextCell className="font-medium">{participant.fullName}</TextCell>
            {columns.map((column) => (
              <TableCell key={column.head}>{column.render(participant)}</TableCell>
            ))}
            <PersonCell name={participant.responsible?.name} />
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
