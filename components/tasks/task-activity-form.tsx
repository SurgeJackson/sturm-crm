"use client";

import { useActionState, useMemo, useState } from "react";
import type { TaskActivity } from "@/generated/prisma/client";
import {
  FormActions,
  FormField,
  FormMessage,
  FormSection,
  SelectField,
  TextareaField,
  TextField
} from "@/components/crm/form-fields";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { TaskActionState } from "@/modules/tasks/actions";
import {
  taskActionTypeOptions,
  taskPriorityOptions,
  taskRecordTypeOptions,
  taskStatusOptions
} from "@/modules/crm/options";

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

function dateTimeValue(date?: Date | string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 16);
}

function defaultDueAt(recordType: string) {
  const date = new Date();
  date.setHours(date.getHours() + (recordType === "TOUCH" ? 0 : 2));
  return date.toISOString().slice(0, 16);
}

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

  const defaultTitle = task?.title ?? defaults?.title ?? (recordType === "TOUCH" ? "Касание" : "");
  const defaultStatus = task?.status ?? (recordType === "TOUCH" ? "RECORDED" : "NEW");

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />

      <FormSection>
        <FormField name="recordType" label="Тип записи *">
          <NativeSelect id="recordType" name="recordType" value={recordType} onChange={(event) => setRecordType(event.target.value)}>
            {taskRecordTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </NativeSelect>
        </FormField>
        <SelectField
          name="actionType"
          label="Вид действия *"
          state={state}
          options={taskActionTypeOptions}
          defaultValue={task?.actionType ?? defaults?.actionType ?? "CALL"}
        />
        <TextField name="title" label="Название *" state={state} className="md:col-span-2" defaultValue={defaultTitle} required />
        <FormField name="responsibleId" label="Ответственный *" state={state}>
          {canChangeResponsible ? (
            <NativeSelect id="responsibleId" name="responsibleId" value={responsibleId} onChange={(event) => setResponsibleId(event.target.value)}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </NativeSelect>
          ) : (
            <>
              <Input value={users.find((user) => user.id === responsibleId)?.name ?? "Текущий пользователь"} disabled />
              <input type="hidden" name="responsibleId" value={responsibleId} />
            </>
          )}
        </FormField>
        <SelectField name="priority" label="Приоритет" options={taskPriorityOptions} defaultValue={task?.priority ?? "NORMAL"} />
        <SelectField name="status" label="Статус" options={taskStatusOptions} defaultValue={defaultStatus} />
        <TextField
          name="dueAt"
          label={recordType === "TOUCH" ? "Дата касания *" : "Срок *"}
          state={state}
          type="datetime-local"
          defaultValue={dateTimeValue(task?.dueAt) || defaultDueAt(recordType)}
        />
        <TextareaField
          name="description"
          label="Описание"
          className="md:col-span-2"
          defaultValue={task?.description ?? ""}
          rows={3}
        />
      </FormSection>

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

      <FormSection>
        <TextareaField
          name="result"
          label={recordType === "TOUCH" ? "Результат касания *" : "Результат выполнения"}
          state={state}
          className="md:col-span-2"
          defaultValue={task?.result ?? ""}
          rows={3}
        />
        <TextField name="nextStepText" label="Текст следующего шага" state={state} defaultValue={task?.nextStepText ?? ""} />
        <TextField
          name="nextStepAt"
          label="Дата следующего шага"
          type="datetime-local"
          defaultValue={dateTimeValue(task?.nextStepAt)}
        />
      </FormSection>

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
