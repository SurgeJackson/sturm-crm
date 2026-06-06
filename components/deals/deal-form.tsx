"use client";

import { useActionState, useMemo, useState } from "react";
import type { Client, Deal, Designer, ProjectObject, User } from "@/generated/prisma/client";
import { dateInputValue, FieldError, FormActions, FormMessage, FormSection } from "@/components/crm/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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
        <div className="space-y-2">
          <Label htmlFor="title">Название сделки *</Label>
          <Input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <FieldError name="title" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="objectId">Объект *</Label>
          <NativeSelect
            id="objectId"
            name="objectId"
            value={objectId}
            onChange={(event) => onObjectChange(event.target.value)}
            required
          >
            <option value="">Выберите объект</option>
            {objects.map((object) => (
              <option key={object.id} value={object.id}>
                {object.title}
              </option>
            ))}
          </NativeSelect>
          <FieldError name="objectId" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientId">Клиент *</Label>
          <NativeSelect
            id="clientId"
            name="clientId"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            required
          >
            <option value="">Выберите клиента</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </NativeSelect>
          <FieldError name="clientId" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="designerId">Дизайнер / архитектор</Label>
          <NativeSelect
            id="designerId"
            name="designerId"
            value={designerId}
            onChange={(event) => setDesignerId(event.target.value)}
          >
            <option value="">Не выбран</option>
            {designers.map((designer) => (
              <option key={designer.id} value={designer.id}>
                {designer.name}
                {designer.studio ? `, ${designer.studio}` : ""}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibleId">Ответственный *</Label>
          {canChangeResponsible ? (
            <NativeSelect id="responsibleId" name="responsibleId" defaultValue={responsibleId}>
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
          <FieldError name="responsibleId" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stage">Стадия *</Label>
          <NativeSelect
            id="stage"
            name="stage"
            value={stage}
            onChange={(event) => setStage(event.target.value as typeof stage)}
          >
            {dealStageOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </NativeSelect>
          <FieldError name="stage" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="potentialAmount">Потенциальная сумма</Label>
          <Input id="potentialAmount" name="potentialAmount" inputMode="decimal" defaultValue={deal?.potentialAmount ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="probability">Вероятность</Label>
          <NativeSelect id="probability" name="probability" defaultValue={deal?.probability ?? ""}>
            <option value="">Не выбрана</option>
            {dealProbabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Источник *</Label>
          <NativeSelect id="source" name="source" defaultValue={defaultSource}>
            {dealSourceOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </NativeSelect>
          <FieldError name="source" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextActionAt">Дата следующего действия {!isClosedStage ? "*" : ""}</Label>
          <Input id="nextActionAt" name="nextActionAt" type="date" defaultValue={dateInputValue(deal?.nextActionAt)} disabled={isClosedStage} />
          <FieldError name="nextActionAt" state={state} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="nextActionText">Следующий шаг {!isClosedStage ? "*" : ""}</Label>
          <Input id="nextActionText" name="nextActionText" defaultValue={deal?.nextActionText ?? ""} disabled={isClosedStage} />
          <FieldError name="nextActionText" state={state} />
        </div>
        {stage === "LOST" ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="lossReason">Причина проигрыша *</Label>
              <NativeSelect id="lossReason" name="lossReason" defaultValue={deal?.lossReason ?? ""}>
                <option value="">Выберите причину</option>
                {dealLossReasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </NativeSelect>
              <FieldError name="lossReason" state={state} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lossComment">Комментарий к проигрышу</Label>
              <Input id="lossComment" name="lossComment" defaultValue={deal?.lossComment ?? ""} />
            </div>
          </>
        ) : null}
      </FormSection>

      <div className="space-y-2">
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea id="comment" name="comment" defaultValue={deal?.comment ?? ""} />
      </div>

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
