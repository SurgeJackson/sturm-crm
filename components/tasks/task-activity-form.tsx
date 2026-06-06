"use client";

import { useActionState, useMemo, useState } from "react";
import type { TaskActivity } from "@/generated/prisma/client";
import { FieldError, FormSection } from "@/components/crm/form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
      {state.message ? <p className="rounded-md border border-destructive p-3 text-sm text-destructive">{state.message}</p> : null}

      <FormSection>
        <div className="space-y-2">
          <Label htmlFor="recordType">Тип записи *</Label>
          <select id="recordType" name="recordType" value={recordType} onChange={(event) => setRecordType(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {taskRecordTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="actionType">Вид действия *</Label>
          <select id="actionType" name="actionType" defaultValue={task?.actionType ?? defaults?.actionType ?? "CALL"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {taskActionTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <FieldError name="actionType" state={state} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="title">Название *</Label>
          <Input id="title" name="title" defaultValue={defaultTitle} required />
          <FieldError name="title" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibleId">Ответственный *</Label>
          {canChangeResponsible ? (
            <select id="responsibleId" name="responsibleId" value={responsibleId} onChange={(event) => setResponsibleId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          ) : (
            <>
              <Input value={users.find((user) => user.id === responsibleId)?.name ?? "Текущий пользователь"} disabled />
              <input type="hidden" name="responsibleId" value={responsibleId} />
            </>
          )}
          <FieldError name="responsibleId" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priority">Приоритет</Label>
          <select id="priority" name="priority" defaultValue={task?.priority ?? "NORMAL"} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {taskPriorityOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Статус</Label>
          <select id="status" name="status" defaultValue={defaultStatus} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {taskStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dueAt">{recordType === "TOUCH" ? "Дата касания" : "Срок"} *</Label>
          <Input id="dueAt" name="dueAt" type="datetime-local" defaultValue={dateTimeValue(task?.dueAt) || defaultDueAt(recordType)} />
          <FieldError name="dueAt" state={state} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="description">Описание</Label>
          <Textarea id="description" name="description" defaultValue={task?.description ?? ""} rows={3} />
        </div>
      </FormSection>

      <FormSection>
        <div className="space-y-2">
          <Label htmlFor="clientId">Клиент</Label>
          <select id="clientId" name="clientId" value={clientId} onChange={(event) => setClientId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Не выбран</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
          <FieldError name="clientId" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="designerId">Дизайнер</Label>
          <select id="designerId" name="designerId" value={designerId} onChange={(event) => setDesignerId(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Не выбран</option>
            {designers.map((designer) => (
              <option key={designer.id} value={designer.id}>{designer.name}{designer.studio ? `, ${designer.studio}` : ""}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="objectId">Объект</Label>
          <select id="objectId" name="objectId" value={objectId} onChange={(event) => applyObject(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Не выбран</option>
            {objects.map((object) => (
              <option key={object.id} value={object.id}>{object.title}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dealId">Сделка</Label>
          <select id="dealId" name="dealId" value={dealId} onChange={(event) => applyDeal(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Не выбрана</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>{deal.title}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="proposalId">КП</Label>
          <select id="proposalId" name="proposalId" value={proposalId} onChange={(event) => applyProposal(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Не выбрано</option>
            {proposals.map((proposal) => (
              <option key={proposal.id} value={proposal.id}>{proposal.proposalNumber}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="objectParticipantId">Участник объекта</Label>
          <select id="objectParticipantId" name="objectParticipantId" value={objectParticipantId} onChange={(event) => applyParticipant(event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Не выбран</option>
            {participants.map((participant) => (
              <option key={participant.id} value={participant.id}>{participant.fullName}</option>
            ))}
          </select>
        </div>
      </FormSection>

      <FormSection>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="result">{recordType === "TOUCH" ? "Результат касания *" : "Результат выполнения"}</Label>
          <Textarea id="result" name="result" defaultValue={task?.result ?? ""} rows={3} />
          <FieldError name="result" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextStepText">Текст следующего шага</Label>
          <Input id="nextStepText" name="nextStepText" defaultValue={task?.nextStepText ?? ""} />
          <FieldError name="nextStepText" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextStepAt">Дата следующего шага</Label>
          <Input id="nextStepAt" name="nextStepAt" type="datetime-local" defaultValue={dateTimeValue(task?.nextStepAt)} />
        </div>
      </FormSection>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>{isPending ? "Сохранение..." : submitLabel}</Button>
      </div>
    </form>
  );
}
