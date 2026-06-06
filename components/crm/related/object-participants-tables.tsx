import {
  implementationContactColumns,
  purchaseInfluencerColumns
} from "@/components/crm/related/object-participant-columns";
import {
  ObjectParticipantTable,
  type ArchiveParticipantAction
} from "@/components/crm/related/object-participant-table";
import type { getProjectObjectForUser } from "@/modules/objects/queries";

type ObjectDetail = Awaited<ReturnType<typeof getProjectObjectForUser>>;

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
      <ObjectParticipantTable
        title="Влияющие на закупку"
        participantType="PURCHASE_INFLUENCER"
        objectId={objectId}
        participants={purchaseInfluencers}
        canManageParticipants={canManageParticipants}
        archiveParticipantAction={archiveParticipantAction}
        columns={purchaseInfluencerColumns}
      />
      <ObjectParticipantTable
        title="Контактные лица реализации"
        participantType="IMPLEMENTATION_CONTACT"
        objectId={objectId}
        participants={implementationContacts}
        canManageParticipants={canManageParticipants}
        archiveParticipantAction={archiveParticipantAction}
        columns={implementationContactColumns}
      />
    </div>
  );
}
