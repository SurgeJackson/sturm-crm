import { FormSection, SelectField } from "@/components/crm/form-fields";
import type { TaskActionState } from "@/modules/tasks/actions";

type ClientOption = { id: string; name: string; responsibleId: string };
type DesignerOption = { id: string; name: string; studio: string | null; responsibleId: string };
type ObjectOption = { id: string; title: string; clientId: string; designerId: string | null; responsibleId: string };
type DealOption = { id: string; title: string; clientId: string; objectId: string; designerId: string | null; responsibleId: string };
type ProposalOption = { id: string; proposalNumber: string; dealId: string; clientId: string; objectId: string; designerId: string | null; responsibleId: string };
type ParticipantOption = { id: string; fullName: string; objectId: string; responsibleId: string | null };
type RelationOption = { id: string };

function RelationSelectField<TOption extends RelationOption>({
  name,
  label,
  state,
  value,
  emptyLabel,
  options,
  renderOption,
  onChange
}: {
  name: string;
  label: string;
  state?: TaskActionState;
  value: string;
  emptyLabel: string;
  options: TOption[];
  renderOption: (option: TOption) => string;
  onChange: (value: string) => void;
}) {
  return (
    <SelectField
      name={name}
      label={label}
      state={state}
      value={value}
      placeholder={emptyLabel}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.id} value={option.id}>{renderOption(option)}</option>
      ))}
    </SelectField>
  );
}

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
    <FormSection title="Связи CRM" description="Выбор более конкретной сущности автоматически подтянет связанные поля.">
      <RelationSelectField
        name="clientId"
        label="Клиент"
        state={state}
        value={clientId}
        emptyLabel="Не выбран"
        options={clients}
        renderOption={(client) => client.name}
        onChange={setClientId}
      />
      <RelationSelectField
        name="designerId"
        label="Дизайнер"
        value={designerId}
        emptyLabel="Не выбран"
        options={designers}
        renderOption={(designer) => `${designer.name}${designer.studio ? `, ${designer.studio}` : ""}`}
        onChange={setDesignerId}
      />
      <RelationSelectField
        name="objectId"
        label="Объект"
        value={objectId}
        emptyLabel="Не выбран"
        options={objects}
        renderOption={(object) => object.title}
        onChange={applyObject}
      />
      <RelationSelectField
        name="dealId"
        label="Сделка"
        value={dealId}
        emptyLabel="Не выбрана"
        options={deals}
        renderOption={(deal) => deal.title}
        onChange={applyDeal}
      />
      <RelationSelectField
        name="proposalId"
        label="КП"
        value={proposalId}
        emptyLabel="Не выбрано"
        options={proposals}
        renderOption={(proposal) => proposal.proposalNumber}
        onChange={applyProposal}
      />
      <RelationSelectField
        name="objectParticipantId"
        label="Участник объекта"
        value={objectParticipantId}
        emptyLabel="Не выбран"
        options={participants}
        renderOption={(participant) => participant.fullName}
        onChange={applyParticipant}
      />
    </FormSection>
  );
}
