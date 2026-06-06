"use client";

import { useActionState, useMemo, useState } from "react";
import type { CommercialProposal, Deal, User } from "@/generated/prisma/client";
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
import { InfoTile } from "@/components/ui/bordered-list-item";
import { Input } from "@/components/ui/input";
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

function SelectedDealSummary({ deal }: { deal?: DealOption }) {
  return (
    <>
      <InfoTile label="Клиент">{deal?.client.name ?? "Не выбран"}</InfoTile>
      <InfoTile label="Объект">{deal?.projectObject.title ?? "Не выбран"}</InfoTile>
      <InfoTile label="Дизайнер">{deal?.designer?.name ?? "Не выбран"}</InfoTile>
    </>
  );
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
      <FormMessage state={state} />

      <FormSection>
        <SelectField
          name="dealId"
          label="Сделка *"
          state={state}
          value={dealId}
          onChange={(event) => onDealChange(event.target.value)}
          placeholder="Выберите сделку"
          required
        >
          {deals.map((deal) => (
            <option key={deal.id} value={deal.id}>{deal.title}</option>
          ))}
        </SelectField>
        <ResponsibleField
          users={users}
          responsibleId={responsibleId}
          canChangeResponsible={canChangeResponsible}
          state={state}
          onChange={setResponsibleId}
        />
        <SelectedDealSummary deal={selectedDeal} />
        <SelectField
          name="status"
          label="Статус *"
          value={status}
          onChange={(event) => setStatus(event.target.value as typeof status)}
          options={commercialProposalStatusOptions}
        />
        <TextField name="amount" label="Сумма КП *" inputMode="decimal" defaultValue={proposal?.amount ?? ""} state={state} required />
        <TextField name="discountPercent" label="Скидка, %" inputMode="decimal" defaultValue={proposal?.discountPercent ?? ""} />
        <TextField name="discountAmount" label="Скидка, сумма" inputMode="decimal" defaultValue={proposal?.discountAmount ?? ""} />
        <SelectField name="recipientType" label={`Тип получателя ${isSent ? "*" : ""}`} defaultValue={proposal?.recipientType ?? ""} placeholder="Не выбран" options={recipientTypeOptions} state={state} />
        <TextField name="recipientName" label={`Получатель ${isSent ? "*" : ""}`} defaultValue={proposal?.recipientName ?? selectedDeal?.client.name ?? ""} state={state} />
        <TextField name="recipientContact" label="Контакт получателя" defaultValue={proposal?.recipientContact ?? ""} />
        <TextField name="approvalRequiredFrom" label="Кто согласует КП" defaultValue={proposal?.approvalRequiredFrom ?? ""} />
        <DateField name="sentAt" label={`Дата отправки ${isSent ? "*" : ""}`} defaultValue={dateInputValue(proposal?.sentAt) || (isSent ? new Date().toISOString().slice(0, 10) : "")} />
        <DateField name="nextTouchAt" label={`Следующее касание ${isSent ? "*" : ""}`} defaultValue={dateInputValue(proposal?.nextTouchAt) || (isSent ? defaultNextTouchDate() : "")} state={state} />
        <FormField name="file" label={`Файл КП ${isSent && !proposal?.fileUrl ? "*" : ""}`} className="md:col-span-2">
          <Input id="file" name="file" type="file" accept=".pdf,.xls,.xlsx,.doc,.docx" />
          {proposal?.fileName ? <p className="text-xs text-muted-foreground">Текущий файл: {proposal.fileName}</p> : null}
        </FormField>
        {isDeclined ? (
          <>
            <SelectField name="declineReason" label="Причина отклонения *" defaultValue={proposal?.declineReason ?? ""} placeholder="Выберите причину" options={proposalDeclineReasonOptions} state={state} />
            <TextField name="declineComment" label="Комментарий к отклонению" defaultValue={proposal?.declineComment ?? ""} />
          </>
        ) : null}
      </FormSection>

      <TextareaField name="comment" label="Комментарий" defaultValue={proposal?.comment ?? ""} />

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
