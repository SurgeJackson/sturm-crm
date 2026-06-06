"use client";

import { useActionState } from "react";
import type { Client, Designer, ProjectObject, User } from "@/generated/prisma/client";
import { dateInputValue, FieldError, FormActions, FormMessage, FormSection } from "@/components/crm/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
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
        <div className="space-y-2">
          <Label htmlFor="title">Название объекта *</Label>
          <Input id="title" name="title" defaultValue={projectObject?.title ?? ""} required />
          <FieldError name="title" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="objectType">Тип объекта *</Label>
          <NativeSelect
            id="objectType"
            name="objectType"
            defaultValue={projectObject?.objectType ?? "APARTMENT"}
          >
            {objectTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError name="objectType" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Город *</Label>
          <Input id="city" name="city" defaultValue={projectObject?.city ?? ""} required />
          <FieldError name="city" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="region">Регион</Label>
          <Input id="region" name="region" defaultValue={projectObject?.region ?? ""} />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Адрес</Label>
          <Input id="address" name="address" defaultValue={projectObject?.address ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientId">Клиент / заказчик *</Label>
          <NativeSelect
            id="clientId"
            name="clientId"
            defaultValue={projectObject?.clientId ?? ""}
            required
          >
            <option value="">Выберите клиента</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </NativeSelect>
          <FieldError name="clientId" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="designerId">Дизайнер / архитектор</Label>
          <NativeSelect
            id="designerId"
            name="designerId"
            defaultValue={projectObject?.designerId ?? ""}
          >
            <option value="">Не выбран</option>
            {designers.map((designer) => (
              <option key={designer.id} value={designer.id}>
                {designer.name}
                {designer.studio ? `, ${designer.studio}` : ""}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibleId">Ответственный STURM *</Label>
          {canChangeResponsible ? (
            <NativeSelect
              id="responsibleId"
              name="responsibleId"
              defaultValue={responsibleId}
            >
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
          <Label htmlFor="stage">Стадия *</Label>
          <NativeSelect
            id="stage"
            name="stage"
            defaultValue={projectObject?.stage ?? "NEW_OBJECT"}
          >
            {objectStageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError name="stage" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Статус *</Label>
          <NativeSelect
            id="status"
            name="status"
            defaultValue={projectObject?.status ?? "ACTIVE"}
          >
            {objectStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
          <FieldError name="status" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="implementationStartAt">Начало реализации</Label>
          <Input
            id="implementationStartAt"
            name="implementationStartAt"
            type="date"
            defaultValue={dateInputValue(projectObject?.implementationStartAt)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="implementationEndAt">Завершение реализации</Label>
          <Input
            id="implementationEndAt"
            name="implementationEndAt"
            type="date"
            defaultValue={dateInputValue(projectObject?.implementationEndAt)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="budget">Бюджет</Label>
          <Input id="budget" name="budget" inputMode="decimal" defaultValue={projectObject?.budget ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bathroomsCount">Количество санузлов</Label>
          <Input id="bathroomsCount" name="bathroomsCount" type="number" min="0" defaultValue={projectObject?.bathroomsCount ?? ""} />
        </div>
      </FormSection>

      <div className="space-y-2">
        <Label>Категории интереса</Label>
        <div className="grid gap-2 rounded-md border p-3 sm:grid-cols-2 lg:grid-cols-3">
          {objectInterestCategoryOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="interestCategories"
                value={option.value}
                defaultChecked={selectedCategories.has(option.value)}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <FormSection>
        <div className="space-y-2">
          <Label htmlFor="files">Файлы объекта</Label>
          <Textarea
            id="files"
            name="files"
            defaultValue={projectObject?.files.join("\n") ?? ""}
            placeholder="Одна ссылка или имя файла на строку"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="comment">Комментарий</Label>
          <Textarea id="comment" name="comment" defaultValue={projectObject?.comment ?? ""} />
        </div>
      </FormSection>

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
