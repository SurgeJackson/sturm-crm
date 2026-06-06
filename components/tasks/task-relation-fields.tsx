import { FormField, FormSection } from "@/components/crm/form-fields";
import { NativeSelect } from "@/components/ui/native-select";
import type { TaskActionState } from "@/modules/tasks/actions";

type ClientOption = { id: string; name: string; responsibleId: string };
type DesignerOption = { id: string; name: string; studio: string | null; responsibleId: string };
type ObjectOption = { id: string; title: string; clientId: string; designerId: string | null; responsibleId: string };
type DealOption = { id: string; title: string; clientId: string; objectId: string; designerId: string | null; responsibleId: string };
type ProposalOption = { id: string; proposalNumber: string; dealId: string; clientId: string; objectId: string; designerId: string | null; responsibleId: string };
type ParticipantOption = { id: string; fullName: string; objectId: string; responsibleId: string | null };

export function TaskRelationFields({
  state,
  clients,
  designers,
  objects,
  deals,
  proposals,
  participants,
  clientId,
  designerId,
  objectId,
  dealId,
  proposalId,
  objectParticipantId,
  setClientId,
  setDesignerId,
  applyObject,
  applyDeal,
  applyProposal,
  applyParticipant
}: {
  state: TaskActionState;
  clients: ClientOption[];
  designers: DesignerOption[];
  objects: ObjectOption[];
  deals: DealOption[];
  proposals: ProposalOption[];
  participants: ParticipantOption[];
  clientId: string;
  designerId: string;
  objectId: string;
  dealId: string;
  proposalId: string;
  objectParticipantId: string;
  setClientId: (value: string) => void;
  setDesignerId: (value: string) => void;
  applyObject: (value: string) => void;
  applyDeal: (value: string) => void;
  applyProposal: (value: string) => void;
  applyParticipant: (value: string) => void;
}) {
  return (
    <FormSection>
      <FormField name="clientId" label="Клиент" state={state}>
        <NativeSelect id="clientId" name="clientId" value={clientId} onChange={(event) => setClientId(event.target.value)}>
          <option value="">Не выбран</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField name="designerId" label="Дизайнер">
        <NativeSelect id="designerId" name="designerId" value={designerId} onChange={(event) => setDesignerId(event.target.value)}>
          <option value="">Не выбран</option>
          {designers.map((designer) => (
            <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField name="objectId" label="Объект">
        <NativeSelect id="objectId" name="objectId" value={objectId} onChange={(event) => applyObject(event.target.value)}>
          <option value="">Не выбран</option>
          {objects.map((object) => (
            <option key={object.id} value={object.id}>{object.title}</option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField name="dealId" label="Сделка">
        <NativeSelect id="dealId" name="dealId" value={dealId} onChange={(event) => applyDeal(event.target.value)}>
          <option value="">Не выбрана</option>
          {deals.map((deal) => (
            <option key={deal.id} value={deal.id}>{deal.title}</option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField name="proposalId" label="КП">
        <NativeSelect id="proposalId" name="proposalId" value={proposalId} onChange={(event) => applyProposal(event.target.value)}>
          <option value="">Не выбрано</option>
          {proposals.map((proposal) => (
            <option key={proposal.id} value={proposal.id}>{proposal.proposalNumber}</option>
          ))}
        </NativeSelect>
      </FormField>
      <FormField name="objectParticipantId" label="Участник объекта">
        <NativeSelect id="objectParticipantId" name="objectParticipantId" value={objectParticipantId} onChange={(event) => applyParticipant(event.target.value)}>
          <option value="">Не выбран</option>
          {participants.map((participant) => (
            <option key={participant.id} value={participant.id}>{participant.fullName}</option>
          ))}
        </NativeSelect>
      </FormField>
    </FormSection>
  );
}
