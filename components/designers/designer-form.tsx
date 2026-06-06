"use client";

import { useActionState } from "react";
import type { Designer, User } from "@/generated/prisma/client";
import { dateInputValue, FieldError, FormActions, FormMessage, FormSection } from "@/components/crm/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import type { DesignerActionState } from "@/modules/designers/actions";
import {
  designerLoyaltyOptions,
  designerPotentialOptions,
  designerProjectSegmentOptions,
  designerRelationshipStageOptions,
  designerRoleOptions,
  designerSourceOptions,
  designerSpecializationOptions
} from "@/modules/crm/options";

type DesignerFormProps = {
  action: (state: DesignerActionState, formData: FormData) => Promise<DesignerActionState>;
  designer?: Designer;
  users: Pick<User, "id" | "name" | "email">[];
  currentUserId: string;
  canChangeResponsible: boolean;
  submitLabel: string;
};

const initialState: DesignerActionState = {};

export function DesignerForm({
  action,
  designer,
  users,
  currentUserId,
  canChangeResponsible,
  submitLabel
}: DesignerFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const responsibleId = designer?.responsibleId ?? currentUserId;
  const selectedSpecializations = new Set(designer?.specialization ?? []);

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />

      <FormSection>
        <div className="space-y-2">
          <Label htmlFor="name">Имя *</Label>
          <Input id="name" name="name" defaultValue={designer?.name ?? ""} required />
          <FieldError name="name" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="studio">Студия / бюро</Label>
          <Input id="studio" name="studio" defaultValue={designer?.studio ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Роль *</Label>
          <NativeSelect id="role" name="role" defaultValue={designer?.role ?? "DESIGNER"}>
            {designerRoleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Город *</Label>
          <Input id="city" name="city" defaultValue={designer?.city ?? ""} required />
          <FieldError name="city" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input id="phone" name="phone" defaultValue={designer?.phone ?? ""} />
          <FieldError name="phone" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="messenger">Мессенджер</Label>
          <Input id="messenger" name="messenger" defaultValue={designer?.messenger ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={designer?.email ?? ""} />
          <FieldError name="email" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="website">Сайт</Label>
          <Input id="website" name="website" defaultValue={designer?.website ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Источник *</Label>
          <NativeSelect id="source" name="source" defaultValue={designer?.source ?? "DATABASE"}>
            {designerSourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectSegment">Сегмент проектов</Label>
          <NativeSelect id="projectSegment" name="projectSegment" defaultValue={designer?.projectSegment ?? ""}>
            <option value="">Не выбран</option>
            {designerProjectSegmentOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="relationshipStage">Этап отношений *</Label>
          <NativeSelect id="relationshipStage" name="relationshipStage" defaultValue={designer?.relationshipStage ?? "NEW_CONTACT"}>
            {designerRelationshipStageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="potential">Потенциал *</Label>
          <NativeSelect id="potential" name="potential" defaultValue={designer?.potential ?? "B"}>
            {designerPotentialOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="loyalty">Лояльность *</Label>
          <NativeSelect id="loyalty" name="loyalty" defaultValue={designer?.loyalty ?? "NEUTRAL"}>
            {designerLoyaltyOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibleId">Ответственный *</Label>
          {canChangeResponsible ? (
            <NativeSelect id="responsibleId" name="responsibleId" defaultValue={responsibleId}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
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
          <Label htmlFor="firstContactAt">Первый контакт</Label>
          <Input id="firstContactAt" name="firstContactAt" type="date" defaultValue={dateInputValue(designer?.firstContactAt)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastTouchAt">Последнее касание</Label>
          <Input id="lastTouchAt" name="lastTouchAt" type="date" defaultValue={dateInputValue(designer?.lastTouchAt)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextStepAt">Дата следующего шага *</Label>
          <Input id="nextStepAt" name="nextStepAt" type="date" defaultValue={dateInputValue(designer?.nextStepAt)} required />
          <FieldError name="nextStepAt" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextStepText">Следующий шаг *</Label>
          <Input id="nextStepText" name="nextStepText" defaultValue={designer?.nextStepText ?? ""} required />
          <FieldError name="nextStepText" state={state} />
        </div>
      </FormSection>

      <div className="space-y-2">
        <Label>Специализация</Label>
        <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-4">
          {designerSpecializationOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="specialization"
                value={option.value}
                defaultChecked={selectedSpecializations.has(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <FormSection>
        <div className="space-y-2">
          <Label htmlFor="cooperationTerms">Условия сотрудничества</Label>
          <Textarea id="cooperationTerms" name="cooperationTerms" defaultValue={designer?.cooperationTerms ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment">Комментарий</Label>
          <Textarea id="comment" name="comment" defaultValue={designer?.comment ?? ""} />
        </div>
      </FormSection>

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
