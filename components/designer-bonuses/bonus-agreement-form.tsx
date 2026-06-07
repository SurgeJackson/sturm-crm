"use client";

import { useActionState, useState } from "react";
import { dateInputValue, FieldError, FormMessage, FormSection, SelectField, TextareaField, TextField, DateField } from "@/components/crm/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { getDesignerBonusSnapshot } from "@/modules/designer-bonuses/queries";
import type { DesignerBonusActionState } from "@/modules/designer-bonuses/actions";
import {
  designerBonusAgreementStatusOptions,
  designerBonusAgreementTypeOptions,
  designerBonusAppliesToOptions,
  designerBonusCalculationBaseOptions
} from "@/modules/crm/options";
import {
  supportedBonusAgreementTypes,
  supportedBonusAppliesTo,
  supportedBonusCalculationBases
} from "@/modules/designer-bonuses/form";

const initialState: DesignerBonusActionState = {};
type BonusAgreement = Awaited<ReturnType<typeof getDesignerBonusSnapshot>>["agreements"][number];

function optionSubset<T extends string>(options: Array<{ value: T; label: string }>, supported: readonly T[]) {
  return options.filter((option) => supported.includes(option.value));
}

export function BonusAgreementForm({
  action,
  designerId,
  canManage,
  deals = [],
  agreement = null
}: {
  action: (state: DesignerBonusActionState, formData: FormData) => Promise<DesignerBonusActionState>;
  designerId: string;
  canManage: boolean;
  deals?: Array<{ id: string; title: string }>;
  agreement?: BonusAgreement | null;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [appliesTo, setAppliesTo] = useState<string>(agreement?.appliesTo ?? "ALL_DEALS");
  const agreementTypeOptions = optionSubset(designerBonusAgreementTypeOptions, supportedBonusAgreementTypes);
  const calculationBaseOptions = optionSubset(designerBonusCalculationBaseOptions, supportedBonusCalculationBases);
  const appliesToOptions = optionSubset(designerBonusAppliesToOptions, supportedBonusAppliesTo);
  const title = agreement ? "Редактировать условия бонусов" : "Создать условия бонусов";

  if (!canManage) return null;

  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-5">
          <FormMessage state={state} />
          <input type="hidden" name="designerId" value={designerId} />
          <FormSection title="Условия" description="Для MVP автоматические начисления работают от подтвержденных оплат.">
            <SelectField name="agreementType" label="Тип соглашения *" options={agreementTypeOptions} defaultValue={agreement?.agreementType ?? "STANDARD_PERCENT"} />
            <TextField name="bonusPercent" label="Процент бонуса *" inputMode="decimal" placeholder="5" defaultValue={agreement?.bonusPercent ?? ""} />
            <SelectField name="calculationBase" label="База расчета *" options={calculationBaseOptions} defaultValue={agreement?.calculationBase ?? "PAYMENT_AMOUNT"} />
            <SelectField name="appliesTo" label="Применяется к *" options={appliesToOptions} defaultValue={agreement?.appliesTo ?? "ALL_DEALS"} onChange={(event) => setAppliesTo(event.currentTarget.value)} />
            <DateField name="validFrom" label="Действует с *" defaultValue={agreement ? dateInputValue(agreement.validFrom) : new Date().toISOString().slice(0, 10)} />
            <DateField name="validTo" label="Действует до" defaultValue={dateInputValue(agreement?.validTo)} />
            <SelectField name="status" label="Статус *" options={designerBonusAgreementStatusOptions} defaultValue={agreement?.status ?? "ACTIVE"} />
          </FormSection>
          <FormSection title="Ограничения и комментарий" columns={1}>
            {appliesTo === "SPECIFIC_DEALS" ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">Сделки для начисления</div>
                {deals.length > 0 ? (
                  <div className="grid gap-2 rounded-md border border-border/70 p-3 md:grid-cols-2">
                    {deals.map((deal) => (
                      <label key={deal.id} className="flex min-w-0 items-start gap-2 text-sm text-muted-foreground">
                        <input className="mt-1 shrink-0" type="checkbox" name="specificDealIds" value={deal.id} defaultChecked={agreement?.specificDealIds.includes(deal.id)} />
                        <span className="min-w-0 break-words">{deal.title}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <TextareaField name="specificDealIdsManual" label="ID сделок" placeholder="Один ID сделки на строку" state={state} />
                )}
                <FieldError name="specificDealIds" state={state} />
              </div>
            ) : null}
            <TextareaField name="comment" label="Комментарий" defaultValue={agreement?.comment ?? ""} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="requiresApproval" value="1" defaultChecked={agreement?.requiresApproval ?? false} />
              Требует подтверждения руководителем
            </label>
          </FormSection>
          <div>
            <Button type="submit" disabled={isPending}>{isPending ? "Сохранение..." : agreement ? "Обновить условия" : "Сохранить условия"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
