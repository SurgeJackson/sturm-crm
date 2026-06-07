"use client";

import { useActionState, useMemo, useState } from "react";
import { FormActions } from "@/components/crm/form-actions";
import { FormMessage, FormSection, SelectField, TextareaField, TextField, DateField } from "@/components/crm/form-fields";
import type { DesignerBonusActionState } from "@/modules/designer-bonuses/actions";
import { designerBonusPayoutMethodOptions, designerBonusPayoutStatusOptions } from "@/modules/crm/options";
import { formatRussianDate } from "@/utils/date";
import { formatMoney } from "@/utils/money";

const initialState: DesignerBonusActionState = {};

export function BonusPayoutForm({
  action,
  designers,
  accruals,
  preselectedDesignerId
}: {
  action: (state: DesignerBonusActionState, formData: FormData) => Promise<DesignerBonusActionState>;
  designers: Array<{ id: string; name: string }>;
  accruals: Array<{
    id: string;
    designerId: string;
    bonusAmount: number;
    accrualDate: Date;
    deal: { id: string; title: string };
    payment: { id: string; amount: number; paymentDate: Date } | null;
  }>;
  preselectedDesignerId?: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [designerId, setDesignerId] = useState(preselectedDesignerId ?? "");
  const [selectedAccrualIds, setSelectedAccrualIds] = useState<string[]>([]);
  const availableAccruals = useMemo(() => {
    if (!designerId) return accruals;
    return accruals.filter((accrual) => accrual.designerId === designerId);
  }, [accruals, designerId]);
  const selectedTotal = availableAccruals
    .filter((accrual) => selectedAccrualIds.includes(accrual.id))
    .reduce((sum, accrual) => sum + accrual.bonusAmount, 0);

  function toggleAccrual(id: string, checked: boolean) {
    setSelectedAccrualIds((current) => checked ? [...current, id] : current.filter((item) => item !== id));
  }

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />
      <FormSection title="Выплата" description="Выплата в статусе 'Выплачено' уменьшает баланс дизайнера.">
        <SelectField name="designerId" label="Дизайнер *" defaultValue={preselectedDesignerId ?? ""} placeholder="Выберите дизайнера" state={state} required onChange={(event) => {
          setDesignerId(event.currentTarget.value);
          setSelectedAccrualIds([]);
        }}>
          {designers.map((designer) => <option key={designer.id} value={designer.id}>{designer.name}</option>)}
        </SelectField>
        <TextField name="amount" label="Сумма выплаты *" state={state} inputMode="decimal" required />
        <DateField name="payoutDate" label="Дата выплаты *" state={state} defaultValue={new Date().toISOString().slice(0, 10)} required />
        <SelectField name="payoutMethod" label="Способ выплаты *" options={designerBonusPayoutMethodOptions} defaultValue="BANK_TRANSFER" />
        <SelectField name="status" label="Статус *" options={designerBonusPayoutStatusOptions} defaultValue="DRAFT" />
      </FormSection>
      <FormSection title="Связанные начисления" description="Можно привязать выплату к конкретным начислениям, чтобы история взаиморасчетов была проверяемой." columns={1}>
        {availableAccruals.length === 0 ? (
          <p className="rounded-md border border-border/70 p-3 text-sm text-muted-foreground">Доступных начислений для выбранного дизайнера нет.</p>
        ) : (
          <div className="grid gap-2 rounded-md border border-border/70 p-3">
            {availableAccruals.map((accrual) => (
              <label key={accrual.id} className="flex min-w-0 items-start justify-between gap-3 rounded-md border border-border/50 p-2 text-sm">
                <span className="flex min-w-0 items-start gap-2">
                  <input className="mt-1 shrink-0" type="checkbox" name="linkedAccrualIds" value={accrual.id} onChange={(event) => toggleAccrual(accrual.id, event.currentTarget.checked)} />
                  <span className="min-w-0">
                    <span className="block break-words text-foreground">{accrual.deal.title}</span>
                    <span className="block text-xs text-muted-foreground">
                      {formatRussianDate(accrual.accrualDate)}
                      {accrual.payment ? `, оплата ${formatMoney(accrual.payment.amount, "0 ₽")} от ${formatRussianDate(accrual.payment.paymentDate)}` : ""}
                    </span>
                  </span>
                </span>
                <span className="shrink-0 font-medium">{formatMoney(accrual.bonusAmount, "0 ₽")}</span>
              </label>
            ))}
            <div className="border-t border-border/60 pt-2 text-right text-sm font-medium">
              Выбрано: {formatMoney(selectedTotal, "0 ₽")}
            </div>
          </div>
        )}
      </FormSection>
      <FormSection title="Документы и комментарий" columns={1}>
        <TextField name="documentFileUrl" label="Ссылка на документ" />
        <TextareaField name="comment" label="Комментарий" />
      </FormSection>
      <FormActions isPending={isPending} submitLabel="Сохранить выплату" cancelHref="/designer-bonuses/payouts" />
    </form>
  );
}
