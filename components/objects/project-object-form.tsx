"use client";

import { useActionState } from "react";
import type { Client, Designer, ProjectObject, User } from "@/generated/prisma/client";
import {
  CheckboxGroupField,
  DateField,
  FormActions,
  FormField,
  FormMessage,
  FormSection,
  ResponsibleField,
  SelectField,
  TextareaField,
  TextField,
  dateInputValue
} from "@/components/crm/form-fields";
import type { ProjectObjectActionState } from "@/modules/objects/actions";
import {
  objectInterestCategoryOptions,
  objectStageOptions,
  objectStatusOptions,
  objectTypeOptions
} from "@/modules/crm/options";

type ProjectObjectFormProps = {
  action: (state: ProjectObjectActionState, formData: FormData) => Promise<ProjectObjectActionState>;
  projectObject?: ProjectObject;
  users: Pick<User, "id" | "name" | "email">[];
  clients: Pick<Client, "id" | "name" | "phone" | "email">[];
  designers: Pick<Designer, "id" | "name" | "studio">[];
  currentUserId: string;
  canChangeResponsible: boolean;
  submitLabel: string;
};

const initialState: ProjectObjectActionState = {};

export function ProjectObjectForm({
  action,
  projectObject,
  users,
  clients,
  designers,
  currentUserId,
  canChangeResponsible,
  submitLabel
}: ProjectObjectFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const responsibleId = projectObject?.responsibleId ?? currentUserId;
  const selectedCategories = new Set(projectObject?.interestCategories ?? []);

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />

      <FormSection>
        <TextField name="title" label="Название объекта *" state={state} defaultValue={projectObject?.title ?? ""} required />
        <SelectField
          name="objectType"
          label="Тип объекта *"
          state={state}
          options={objectTypeOptions}
          defaultValue={projectObject?.objectType ?? "APARTMENT"}
        />
        <TextField name="city" label="Город *" state={state} defaultValue={projectObject?.city ?? ""} required />
        <TextField name="region" label="Регион" defaultValue={projectObject?.region ?? ""} />
        <TextField name="address" label="Адрес" className="md:col-span-2" defaultValue={projectObject?.address ?? ""} />
        <SelectField
          name="clientId"
          label="Клиент / заказчик *"
          state={state}
          placeholder="Выберите клиента"
          defaultValue={projectObject?.clientId ?? ""}
          required
        >
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          name="designerId"
          label="Дизайнер / архитектор"
          placeholder="Не выбран"
          defaultValue={projectObject?.designerId ?? ""}
        >
          {designers.map((designer) => (
            <option key={designer.id} value={designer.id}>
              {designer.name}
              {designer.studio ? `, ${designer.studio}` : ""}
            </option>
          ))}
        </SelectField>
        <ResponsibleField
          users={users}
          responsibleId={responsibleId}
          canChangeResponsible={canChangeResponsible}
          state={state}
          label="Ответственный STURM *"
        />
        <SelectField
          name="stage"
          label="Стадия *"
          state={state}
          options={objectStageOptions}
          defaultValue={projectObject?.stage ?? "NEW_OBJECT"}
        />
        <SelectField
          name="status"
          label="Статус *"
          state={state}
          options={objectStatusOptions}
          defaultValue={projectObject?.status ?? "ACTIVE"}
        />
        <DateField
          name="implementationStartAt"
          label="Начало реализации"
          defaultValue={dateInputValue(projectObject?.implementationStartAt)}
        />
        <DateField
          name="implementationEndAt"
          label="Завершение реализации"
          defaultValue={dateInputValue(projectObject?.implementationEndAt)}
        />
        <TextField name="budget" label="Бюджет" inputMode="decimal" defaultValue={projectObject?.budget ?? ""} />
        <TextField
          name="bathroomsCount"
          label="Количество санузлов"
          type="number"
          min="0"
          defaultValue={projectObject?.bathroomsCount ?? ""}
        />
      </FormSection>

      <CheckboxGroupField
        name="interestCategories"
        label="Категории интереса"
        options={objectInterestCategoryOptions}
        selectedValues={selectedCategories}
      />

      <FormSection>
        <TextareaField
          name="files"
          label="Файлы объекта"
          defaultValue={projectObject?.files.join("\n") ?? ""}
          placeholder="Одна ссылка или имя файла на строку"
        />
        <TextareaField name="comment" label="Комментарий" defaultValue={projectObject?.comment ?? ""} />
      </FormSection>

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
