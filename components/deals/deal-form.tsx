"use client";

import { useActionState, useMemo, useState } from "react";
import type { Client, Deal, Designer, ProjectObject, User } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function dateValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function FieldError({ name, state }: { name: string; state: DealActionState }) {
  const message = state.errors?.[name]?.[0];
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

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
      {state.message ? <p className="rounded-md border border-destructive p-3 text-sm text-destructive">{state.message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Название сделки *</Label>
          <Input id="title" name="title" value={title} onChange={(event) => setTitle(event.target.value)} required />
          <FieldError name="title" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="objectId">Объект *</Label>
          <select
            id="objectId"
            name="objectId"
            value={objectId}
            onChange={(event) => onObjectChange(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            <option value="">Выберите объект</option>
            {objects.map((object) => (
              <option key={object.id} value={object.id}>
                {object.title}
              </option>
            ))}
          </select>
          <FieldError name="objectId" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientId">Клиент *</Label>
          <select
            id="clientId"
            name="clientId"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            <option value="">Выберите клиента</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <FieldError name="clientId" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="designerId">Дизайнер / архитектор</Label>
          <select
            id="designerId"
            name="designerId"
            value={designerId}
            onChange={(event) => setDesignerId(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Не выбран</option>
            {designers.map((designer) => (
              <option key={designer.id} value={designer.id}>
                {designer.name}
                {designer.studio ? `, ${designer.studio}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibleId">Ответственный *</Label>
          {canChangeResponsible ? (
            <select id="responsibleId" name="responsibleId" defaultValue={responsibleId} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
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
          <Label htmlFor="stage">Стадия *</Label>
          <select
            id="stage"
            name="stage"
            value={stage}
            onChange={(event) => setStage(event.target.value as typeof stage)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {dealStageOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <FieldError name="stage" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="potentialAmount">Потенциальная сумма</Label>
          <Input id="potentialAmount" name="potentialAmount" inputMode="decimal" defaultValue={deal?.potentialAmount ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="probability">Вероятность</Label>
          <select id="probability" name="probability" defaultValue={deal?.probability ?? ""} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Не выбрана</option>
            {dealProbabilityOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Источник *</Label>
          <select id="source" name="source" defaultValue={defaultSource} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            {dealSourceOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <FieldError name="source" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextActionAt">Дата следующего действия {!isClosedStage ? "*" : ""}</Label>
          <Input id="nextActionAt" name="nextActionAt" type="date" defaultValue={dateValue(deal?.nextActionAt)} disabled={isClosedStage} />
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
              <select id="lossReason" name="lossReason" defaultValue={deal?.lossReason ?? ""} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Выберите причину</option>
                {dealLossReasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <FieldError name="lossReason" state={state} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lossComment">Комментарий к проигрышу</Label>
              <Input id="lossComment" name="lossComment" defaultValue={deal?.lossComment ?? ""} />
            </div>
          </>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea id="comment" name="comment" defaultValue={deal?.comment ?? ""} />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Сохранение..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Отменить
        </Button>
      </div>
    </form>
  );
}
