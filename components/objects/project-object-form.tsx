"use client";

import { useActionState } from "react";
import type { Client, Designer, ProjectObject, User } from "@/generated/prisma/client";
import {
  FormMessage,
  FormSection,
  TextareaField
} from "@/components/crm/form-fields";
import { CheckboxGroupField } from "@/components/crm/checkbox-group-field";
import { FormActions } from "@/components/crm/form-actions";
import {
  ObjectIdentityFields,
  ObjectRelationsFields,
  ObjectStatusFields
} from "@/components/objects/project-object-form-sections";
import type { ProjectObjectActionState } from "@/modules/objects/actions";
import { objectInterestCategoryOptions } from "@/modules/crm/options";

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

      <FormSection title="Объект" description="Название, тип и адрес проектной продажи.">
        <ObjectIdentityFields state={state} projectObject={projectObject} />
      </FormSection>

      <FormSection title="Связи и ответственность" description="Клиент, дизайнер и ответственный менеджер STURM.">
        <ObjectRelationsFields
          state={state}
          projectObject={projectObject}
          clients={clients}
          designers={designers}
          users={users}
          responsibleId={responsibleId}
          canChangeResponsible={canChangeResponsible}
        />
      </FormSection>

      <FormSection title="Статус и сроки" description="Стадия объекта, бюджет и плановые даты реализации.">
        <ObjectStatusFields state={state} projectObject={projectObject} />
      </FormSection>

      <CheckboxGroupField
        name="interestCategories"
        label="Категории интереса"
        options={objectInterestCategoryOptions}
        selectedValues={selectedCategories}
      />

      <FormSection title="Файлы и комментарии">
        <TextareaField
          name="files"
          label="Файлы объекта"
          defaultValue={projectObject?.files.join("\n") ?? ""}
          placeholder="Одна ссылка или имя файла на строку"
        />
        <TextareaField name="comment" label="Комментарий" defaultValue={projectObject?.comment ?? ""} />
      </FormSection>

      <FormActions
        isPending={isPending}
        submitLabel={submitLabel}
        cancelHref={projectObject ? `/objects/${projectObject.id}` : "/objects"}
      />
    </form>
  );
}
