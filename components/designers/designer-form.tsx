"use client";

import { useActionState } from "react";
import type { Designer, User } from "@/generated/prisma/client";
import {
  CheckboxGroupField,
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
        <TextField name="name" label="Имя *" state={state} defaultValue={designer?.name ?? ""} required />
        <TextField name="studio" label="Студия / бюро" defaultValue={designer?.studio ?? ""} />
        <SelectField name="role" label="Роль *" options={designerRoleOptions} defaultValue={designer?.role ?? "DESIGNER"} />
        <TextField name="city" label="Город *" state={state} defaultValue={designer?.city ?? ""} required />
        <TextField name="phone" label="Телефон" state={state} defaultValue={designer?.phone ?? ""} />
        <TextField name="messenger" label="Мессенджер" defaultValue={designer?.messenger ?? ""} />
        <TextField name="email" label="Email" state={state} type="email" defaultValue={designer?.email ?? ""} />
        <TextField name="website" label="Сайт" defaultValue={designer?.website ?? ""} />
        <SelectField
          name="source"
          label="Источник *"
          options={designerSourceOptions}
          defaultValue={designer?.source ?? "DATABASE"}
        />
        <SelectField
          name="projectSegment"
          label="Сегмент проектов"
          options={designerProjectSegmentOptions}
          placeholder="Не выбран"
          defaultValue={designer?.projectSegment ?? ""}
        />
        <SelectField
          name="relationshipStage"
          label="Этап отношений *"
          options={designerRelationshipStageOptions}
          defaultValue={designer?.relationshipStage ?? "NEW_CONTACT"}
        />
        <SelectField
          name="potential"
          label="Потенциал *"
          options={designerPotentialOptions}
          defaultValue={designer?.potential ?? "B"}
        />
        <SelectField
          name="loyalty"
          label="Лояльность *"
          options={designerLoyaltyOptions}
          defaultValue={designer?.loyalty ?? "NEUTRAL"}
        />
        <ResponsibleField
          users={users}
          responsibleId={responsibleId}
          canChangeResponsible={canChangeResponsible}
          state={state}
        />
        <DateField name="firstContactAt" label="Первый контакт" defaultValue={dateInputValue(designer?.firstContactAt)} />
        <DateField name="lastTouchAt" label="Последнее касание" defaultValue={dateInputValue(designer?.lastTouchAt)} />
        <DateField
          name="nextStepAt"
          label="Дата следующего шага *"
          state={state}
          defaultValue={dateInputValue(designer?.nextStepAt)}
          required
        />
        <TextField name="nextStepText" label="Следующий шаг *" state={state} defaultValue={designer?.nextStepText ?? ""} required />
      </FormSection>

      <CheckboxGroupField
        name="specialization"
        label="Специализация"
        options={designerSpecializationOptions}
        selectedValues={selectedSpecializations}
      />

      <FormSection>
        <TextareaField name="cooperationTerms" label="Условия сотрудничества" defaultValue={designer?.cooperationTerms ?? ""} />
        <TextareaField name="comment" label="Комментарий" defaultValue={designer?.comment ?? ""} />
      </FormSection>

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
