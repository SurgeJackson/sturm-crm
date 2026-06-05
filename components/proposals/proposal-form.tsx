"use client";

import { useActionState, useMemo, useState } from "react";
import type { CommercialProposal, Deal, User } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ProposalActionState } from "@/modules/proposals/actions";
import {
  commercialProposalStatusOptions,
  proposalDeclineReasonOptions,
  recipientTypeOptions
} from "@/modules/crm/options";

type DealOption = Pick<Deal, "id" | "title" | "clientId" | "objectId" | "designerId" | "responsibleId"> & {
  client: { id: string; name: string };
  projectObject: { id: string; title: string };
  designer: { id: string; name: string; studio: string | null } | null;
  responsible: { id: string; name: string };
};

type ProposalFormProps = {
  action: (state: ProposalActionState, formData: FormData) => Promise<ProposalActionState>;
  proposal?: CommercialProposal;
  deals: DealOption[];
  users: Pick<User, "id" | "name" | "email">[];
  currentUserId: string;
  canChangeResponsible: boolean;
  preselectedDealId?: string;
  submitLabel: string;
};

const initialState: ProposalActionState = {};

function dateValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function defaultNextTouchDate() {
  const date = new Date();
  let added = 0;
  while (added < 2) {
    date.setDate(date.getDate() + 1);
    const day = date.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return date.toISOString().slice(0, 10);
}

function FieldError({ name, state }: { name: string; state: ProposalActionState }) {
  const message = state.errors?.[name]?.[0];
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

export function ProposalForm({
  action,
  proposal,
  deals,
  users,
  currentUserId,
  canChangeResponsible,
  preselectedDealId,
  submitLabel
}: ProposalFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const initialDealId = proposal?.dealId ?? preselectedDealId ?? "";
  const [dealId, setDealId] = useState(initialDealId);
  const [responsibleId, setResponsibleId] = useState(proposal?.responsibleId ?? currentUserId);
  const [status, setStatus] = useState(proposal?.status ?? "DRAFT");
  const dealsById = useMemo(() => new Map(deals.map((deal) => [deal.id, deal])), [deals]);
  const selectedDeal = dealsById.get(dealId);
  const isSent = status === "SENT";
  const isDeclined = status === "DECLINED";

  function onDealChange(nextDealId: string) {
    setDealId(nextDealId);
    const nextDeal = dealsById.get(nextDealId);
    if (nextDeal) setResponsibleId(nextDeal.responsibleId);
  }

  return (
    <form action={formAction} className="grid gap-5">
      {state.message ? <p className="rounded-md border border-destructive p-3 text-sm text-destructive">{state.message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dealId">Сделка *</Label>
          <select
            id="dealId"
            name="dealId"
            value={dealId}
            onChange={(event) => onDealChange(event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            <option value="">Выберите сделку</option>
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>{deal.title}</option>
            ))}
          </select>
          <FieldError name="dealId" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibleId">Ответственный *</Label>
          {canChangeResponsible ? (
            <select
              id="responsibleId"
              name="responsibleId"
              value={responsibleId}
              onChange={(event) => setResponsibleId(event.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
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
        <div className="rounded-md border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Клиент</div>
          <div className="mt-1">{selectedDeal?.client.name ?? "Не выбран"}</div>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Объект</div>
          <div className="mt-1">{selectedDeal?.projectObject.title ?? "Не выбран"}</div>
        </div>
        <div className="rounded-md border p-3 text-sm">
          <div className="text-xs text-muted-foreground">Дизайнер</div>
          <div className="mt-1">{selectedDeal?.designer?.name ?? "Не выбран"}</div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Статус *</Label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(event) => setStatus(event.target.value as typeof status)}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {commercialProposalStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Сумма КП *</Label>
          <Input id="amount" name="amount" inputMode="decimal" defaultValue={proposal?.amount ?? ""} required />
          <FieldError name="amount" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountPercent">Скидка, %</Label>
          <Input id="discountPercent" name="discountPercent" inputMode="decimal" defaultValue={proposal?.discountPercent ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="discountAmount">Скидка, сумма</Label>
          <Input id="discountAmount" name="discountAmount" inputMode="decimal" defaultValue={proposal?.discountAmount ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipientType">Тип получателя {isSent ? "*" : ""}</Label>
          <select id="recipientType" name="recipientType" defaultValue={proposal?.recipientType ?? ""} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Не выбран</option>
            {recipientTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <FieldError name="recipientType" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipientName">Получатель {isSent ? "*" : ""}</Label>
          <Input id="recipientName" name="recipientName" defaultValue={proposal?.recipientName ?? selectedDeal?.client.name ?? ""} />
          <FieldError name="recipientName" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipientContact">Контакт получателя</Label>
          <Input id="recipientContact" name="recipientContact" defaultValue={proposal?.recipientContact ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="approvalRequiredFrom">Кто согласует КП</Label>
          <Input id="approvalRequiredFrom" name="approvalRequiredFrom" defaultValue={proposal?.approvalRequiredFrom ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sentAt">Дата отправки {isSent ? "*" : ""}</Label>
          <Input id="sentAt" name="sentAt" type="date" defaultValue={dateValue(proposal?.sentAt) || (isSent ? new Date().toISOString().slice(0, 10) : "")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextTouchAt">Следующее касание {isSent ? "*" : ""}</Label>
          <Input id="nextTouchAt" name="nextTouchAt" type="date" defaultValue={dateValue(proposal?.nextTouchAt) || (isSent ? defaultNextTouchDate() : "")} />
          <FieldError name="nextTouchAt" state={state} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="file">Файл КП {isSent && !proposal?.fileUrl ? "*" : ""}</Label>
          <Input id="file" name="file" type="file" accept=".pdf,.xls,.xlsx,.doc,.docx" />
          {proposal?.fileName ? <p className="text-xs text-muted-foreground">Текущий файл: {proposal.fileName}</p> : null}
        </div>
        {isDeclined ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="declineReason">Причина отклонения *</Label>
              <select id="declineReason" name="declineReason" defaultValue={proposal?.declineReason ?? ""} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Выберите причину</option>
                {proposalDeclineReasonOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <FieldError name="declineReason" state={state} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="declineComment">Комментарий к отклонению</Label>
              <Input id="declineComment" name="declineComment" defaultValue={proposal?.declineComment ?? ""} />
            </div>
          </>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea id="comment" name="comment" defaultValue={proposal?.comment ?? ""} />
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
