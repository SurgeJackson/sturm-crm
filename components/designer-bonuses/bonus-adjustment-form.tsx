"use client";

import { useActionState } from "react";
import { FormMessage, SelectField, TextareaField, TextField } from "@/components/crm/form-fields";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DesignerBonusActionState } from "@/modules/designer-bonuses/actions";
import { designerBonusAdjustmentTypeOptions } from "@/modules/crm/options";

const initialState: DesignerBonusActionState = {};

export function BonusAdjustmentForm({
  action,
  designerId,
  canManage
}: {
  action: (state: DesignerBonusActionState, formData: FormData) => Promise<DesignerBonusActionState>;
  designerId: string;
  canManage: boolean;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  if (!canManage) return null;

  return (
    <Card>
      <CardHeader><CardTitle>Ручная корректировка</CardTitle></CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-3 md:grid-cols-4">
          <FormMessage state={state} />
          <input type="hidden" name="designerId" value={designerId} />
          <TextField name="amount" label="Сумма *" state={state} inputMode="decimal" required />
          <SelectField name="adjustmentType" label="Тип *" options={designerBonusAdjustmentTypeOptions} defaultValue="CORRECTION_PLUS" />
          <TextField name="reason" label="Причина *" state={state} required />
          <TextareaField name="comment" label="Комментарий" />
          <div className="md:col-span-4">
            <Button type="submit" disabled={isPending}>{isPending ? "Сохранение..." : "Добавить корректировку"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
