"use client";

import { useActionState } from "react";
import { FormActions } from "@/components/crm/form-actions";
import { FormMessage, FormSection, SelectField, TextareaField, TextField, DateField } from "@/components/crm/form-fields";
import type { PaymentActionState } from "@/modules/payments/actions";
import { paymentStatusOptions, paymentTypeOptions } from "@/modules/crm/options";
import { supportedPaymentCreateStatuses } from "@/modules/payments/form";

type PaymentFormProps = {
  action: (state: PaymentActionState, formData: FormData) => Promise<PaymentActionState>;
  deals: Array<{
    id: string;
    title: string;
    client: { name: string };
    projectObject: { title: string };
    designer: { name: string } | null;
  }>;
  preselectedDealId?: string;
};

const initialState: PaymentActionState = {};
const createStatusOptions = paymentStatusOptions.filter((option) => supportedPaymentCreateStatuses.includes(option.value as (typeof supportedPaymentCreateStatuses)[number]));

export function PaymentForm({ action, deals, preselectedDealId }: PaymentFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />
      <FormSection title="Оплата" description="Бонус дизайнеру будет начислен после подтверждения оплаты, если есть активные условия.">
        <SelectField name="dealId" label="Сделка *" state={state} defaultValue={preselectedDealId ?? ""} placeholder="Выберите сделку" required>
          {deals.map((deal) => (
            <option key={deal.id} value={deal.id}>
              {deal.title} · {deal.client.name} · {deal.projectObject.title}{deal.designer ? ` · ${deal.designer.name}` : ""}
            </option>
          ))}
        </SelectField>
        <TextField name="amount" label="Сумма оплаты *" state={state} inputMode="decimal" required />
        <DateField name="paymentDate" label="Дата оплаты *" state={state} defaultValue={new Date().toISOString().slice(0, 10)} required />
        <SelectField name="paymentType" label="Тип оплаты *" options={paymentTypeOptions} defaultValue="PARTIAL_PAYMENT" />
        <SelectField name="status" label="Статус *" options={createStatusOptions} defaultValue="DRAFT" />
      </FormSection>
      <FormSection title="Комментарий" columns={1}>
        <TextareaField name="comment" label="Комментарий" />
      </FormSection>
      <FormActions isPending={isPending} submitLabel="Сохранить оплату" cancelHref="/payments" />
    </form>
  );
}
