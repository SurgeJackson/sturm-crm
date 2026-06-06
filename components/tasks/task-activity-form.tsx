"use client";

import { useActionState, useMemo, useState } from "react";
import type { TaskActivity } from "@/generated/prisma/client";
import { FormActions } from "@/components/crm/form-actions";
import { FormMessage } from "@/components/crm/form-fields";
import { TaskMainFields } from "@/components/tasks/task-main-fields";
import { TaskRelationFields } from "@/components/tasks/task-relation-fields";
import { TaskResultFields } from "@/components/tasks/task-result-fields";
import type { TaskActionState } from "@/modules/tasks/actions";

type UserOption = { id: string; name: string; email: string };
type ClientOption = { id: string; name: string; responsibleId: string };
type DesignerOption = { id: string; name: string; studio: string | null; responsibleId: string };
type ObjectOption = { id: string; title: string; clientId: string; designerId: string | null; responsibleId: string };
type DealOption = { id: string; title: string; clientId: string; objectId: string; designerId: string | null; responsibleId: string };
type ProposalOption = { id: string; proposalNumber: string; dealId: string; clientId: string; objectId: string; designerId: string | null; responsibleId: string };
type ParticipantOption = { id: string; fullName: string; objectId: string; responsibleId: string | null };

export type TaskFormDefaults = {
  recordType?: string;
  actionType?: string;
  clientId?: string;
  designerId?: string;
  objectId?: string;
  dealId?: string;
  proposalId?: string;
  objectParticipantId?: string;
  responsibleId?: string;
  title?: string;
};

type TaskActivityFormProps = {
  action: (state: TaskActionState, formData: FormData) => Promise<TaskActionState>;
  task?: TaskActivity;
  users: UserOption[];
  clients: ClientOption[];
  designers: DesignerOption[];
  objects: ObjectOption[];
  deals: DealOption[];
  proposals: ProposalOption[];
  participants: ParticipantOption[];
  currentUserId: string;
  canChangeResponsible: boolean;
  defaults?: TaskFormDefaults;
  submitLabel: string;
};

const initialState: TaskActionState = {};

export function TaskActivityForm({
  action,
  task,
  users,
  clients,
  designers,
  objects,
  deals,
  proposals,
  participants,
  currentUserId,
  canChangeResponsible,
  defaults,
  submitLabel
}: TaskActivityFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const initialRecordType = task?.recordType ?? defaults?.recordType ?? "TASK";
  const [recordType, setRecordType] = useState(initialRecordType);
  const [responsibleId, setResponsibleId] = useState(task?.responsibleId ?? defaults?.responsibleId ?? currentUserId);
  const [clientId, setClientId] = useState(task?.clientId ?? defaults?.clientId ?? "");
  const [designerId, setDesignerId] = useState(task?.designerId ?? defaults?.designerId ?? "");
  const [objectId, setObjectId] = useState(task?.objectId ?? defaults?.objectId ?? "");
  const [dealId, setDealId] = useState(task?.dealId ?? defaults?.dealId ?? "");
  const [proposalId, setProposalId] = useState(task?.proposalId ?? defaults?.proposalId ?? "");
  const [objectParticipantId, setObjectParticipantId] = useState(task?.objectParticipantId ?? defaults?.objectParticipantId ?? "");
  const objectsById = useMemo(() => new Map(objects.map((object) => [object.id, object])), [objects]);
  const dealsById = useMemo(() => new Map(deals.map((deal) => [deal.id, deal])), [deals]);
  const proposalsById = useMemo(() => new Map(proposals.map((proposal) => [proposal.id, proposal])), [proposals]);
  const participantsById = useMemo(() => new Map(participants.map((participant) => [participant.id, participant])), [participants]);

  function applyObject(nextObjectId: string) {
    setObjectId(nextObjectId);
    const object = objectsById.get(nextObjectId);
    if (object) {
      setClientId(object.clientId);
      if (object.designerId) setDesignerId(object.designerId);
      setResponsibleId(object.responsibleId);
    }
  }

  function applyDeal(nextDealId: string) {
    setDealId(nextDealId);
    const deal = dealsById.get(nextDealId);
    if (deal) {
      setClientId(deal.clientId);
      setObjectId(deal.objectId);
      if (deal.designerId) setDesignerId(deal.designerId);
      setResponsibleId(deal.responsibleId);
    }
  }

  function applyProposal(nextProposalId: string) {
    setProposalId(nextProposalId);
    const proposal = proposalsById.get(nextProposalId);
    if (proposal) {
      setDealId(proposal.dealId);
      setClientId(proposal.clientId);
      setObjectId(proposal.objectId);
      if (proposal.designerId) setDesignerId(proposal.designerId);
      setResponsibleId(proposal.responsibleId);
    }
  }

  function applyParticipant(nextParticipantId: string) {
    setObjectParticipantId(nextParticipantId);
    const participant = participantsById.get(nextParticipantId);
    if (participant) {
      applyObject(participant.objectId);
      if (participant.responsibleId) setResponsibleId(participant.responsibleId);
    }
  }

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />

      <TaskMainFields
        state={state}
        task={task}
        defaults={defaults}
        users={users}
        recordType={recordType}
        setRecordType={setRecordType}
        responsibleId={responsibleId}
        setResponsibleId={setResponsibleId}
        canChangeResponsible={canChangeResponsible}
      />

      <TaskRelationFields
        state={state}
        clients={clients}
        designers={designers}
        objects={objects}
        deals={deals}
        proposals={proposals}
        participants={participants}
        clientId={clientId}
        designerId={designerId}
        objectId={objectId}
        dealId={dealId}
        proposalId={proposalId}
        objectParticipantId={objectParticipantId}
        setClientId={setClientId}
        setDesignerId={setDesignerId}
        applyObject={applyObject}
        applyDeal={applyDeal}
        applyProposal={applyProposal}
        applyParticipant={applyParticipant}
      />

      <TaskResultFields state={state} task={task} recordType={recordType} />

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
