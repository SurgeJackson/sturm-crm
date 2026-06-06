"use client";

import { useActionState, useMemo, useState } from "react";
import type { Client, Deal, Designer, ProjectObject, User } from "@/generated/prisma/client";
import {
  DateField,
  FormActions,
  FormField,
  FormMessage,
  FormSection,
  SelectField,
  TextareaField,
  TextField,
  dateInputValue
} from "@/components/crm/form-fields";
import { ResponsibleField } from "@/components/crm/responsible-field";
import { Input } from "@/components/ui/input";
import type { DealActionState } from "@/modules/deals/actions";
import {
  dealLossReasonOptions,
  dealProbabilityOptions,
  dealSourceOptions,
  dealStageOptions
} from "@/modules/crm/options";

type ObjectOption = Pick<ProjectObject, "id" | "title" | "clientId" | "designerId"> & {
  client: Pick<Client, "id" | "name">;
  designer: Pick<Designer, "id" | "name" | "studio"> | null;
};

type DealFormProps = {
  action: (state: DealActionState, formData: FormData) => Promise<DealActionState>;
  deal?: Deal;
  users: Pick<User, "id" | "name" | "email">[];
  clients: Pick<Client, "id" | "name">[];
  objects: ObjectOption[];
  designers: Pick<Designer, "id" | "name" | "studio">[];
  currentUserId: string;
  canChangeResponsible: boolean;
  preselectedObjectId?: string;
  submitLabel: string;
};

const initialState: DealActionState = {};

export function DealForm({
  action,
  deal,
  users,
  clients,
  objects,
  designers,
  currentUserId,
  canChangeResponsible,
  preselectedObjectId,
  submitLabel
}: DealFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const initialObjectId = deal?.objectId ?? preselectedObjectId ?? "";
  const initialObject = objects.find((object) => object.id === initialObjectId);
  const [title, setTitle] = useState(deal?.title ?? (initialObject ? `Сделка по объекту ${initialObject.title}` : ""));
  const [objectId, setObjectId] = useState(initialObjectId);
  const [clientId, setClientId] = useState(deal?.clientId ?? initialObject?.clientId ?? "");
  const [designerId, setDesignerId] = useState(deal?.designerId ?? initialObject?.designerId ?? "");
  const [stage, setStage] = useState(deal?.stage ?? "NEW_REQUEST");
  const objectById = useMemo(() => new Map(objects.map((object) => [object.id, object])), [objects]);
  const responsibleId = deal?.responsibleId ?? currentUserId;
  const isClosedStage = stage === "LOST" || stage === "COMPLETED";
  const defaultSource = deal?.source ?? (initialObject?.designerId ? "DESIGNER" : "SHOWROOM");

  function onObjectChange(nextObjectId: string) {
    setObjectId(nextObjectId);
    const selected = objectById.get(nextObjectId);
    if (!selected) return;

    setClientId(selected.clientId);
    setDesignerId(selected.designerId ?? "");
    if (!title.trim() || title.startsWith("Сделка по объекту ")) {
      setTitle(`Сделка по объекту ${selected.title}`);
    }
  }

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />

      <FormSection>
        <FormField name="title" label="Название сделки *" state={state}>
          <Input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
        </FormField>
        <SelectField
          name="objectId"
          label="Объект *"
          state={state}
          value={objectId}
          onChange={(event) => onObjectChange(event.target.value)}
          placeholder="Выберите объект"
          required
        >
          {objects.map((object) => (
            <option key={object.id} value={object.id}>
              {object.title}
            </option>
          ))}
        </SelectField>
        <SelectField
          name="clientId"
          label="Клиент *"
          state={state}
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
          placeholder="Выберите клиента"
          required
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          name="designerId"
          label="Дизайнер / архитектор"
          value={designerId}
          onChange={(event) => setDesignerId(event.target.value)}
          placeholder="Не выбран"
        >
          {designers.map((designer) => (
            <option key={designer.id} value={designer.id}>
              {designer.name}
              {designer.studio ? `, ${designer.studio}` : ""}
            </option>
          ))}
        </SelectField>
        <ResponsibleField
          users={users}
          responsibleId={responsibleId}
          canChangeResponsible={canChangeResponsible}
          state={state}
        />
        <SelectField
          name="stage"
          label="Стадия *"
          state={state}
          value={stage}
          onChange={(event) => setStage(event.target.value as typeof stage)}
          options={dealStageOptions}
        />
        <TextField name="potentialAmount" label="Потенциальная сумма" inputMode="decimal" defaultValue={deal?.potentialAmount ?? ""} />
        <SelectField name="probability" label="Вероятность" defaultValue={deal?.probability ?? ""} placeholder="Не выбрана" options={dealProbabilityOptions} />
        <SelectField name="source" label="Источник *" defaultValue={defaultSource} options={dealSourceOptions} state={state} />
        <DateField name="nextActionAt" label={`Дата следующего действия ${!isClosedStage ? "*" : ""}`} defaultValue={dateInputValue(deal?.nextActionAt)} disabled={isClosedStage} state={state} />
        <TextField name="nextActionText" label={`Следующий шаг ${!isClosedStage ? "*" : ""}`} defaultValue={deal?.nextActionText ?? ""} disabled={isClosedStage} state={state} className="md:col-span-2" />
        {stage === "LOST" ? (
          <>
            <SelectField name="lossReason" label="Причина проигрыша *" defaultValue={deal?.lossReason ?? ""} placeholder="Выберите причину" options={dealLossReasonOptions} state={state} />
            <TextField name="lossComment" label="Комментарий к проигрышу" defaultValue={deal?.lossComment ?? ""} />
          </>
        ) : null}
      </FormSection>

      <TextareaField name="comment" label="Комментарий" defaultValue={deal?.comment ?? ""} />

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
