"use client";

import { useActionState } from "react";
import type { Client, Designer, ProjectObject, User } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function dateValue(date?: Date | string | null) {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

function FieldError({ name, state }: { name: string; state: ProjectObjectActionState }) {
  const message = state.errors?.[name]?.[0];
  return message ? <p className="text-sm text-destructive">{message}</p> : null;
}

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
      {state.message ? <p className="rounded-md border border-destructive p-3 text-sm text-destructive">{state.message}</p> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Название объекта *</Label>
          <Input id="title" name="title" defaultValue={projectObject?.title ?? ""} required />
          <FieldError name="title" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="objectType">Тип объекта *</Label>
          <select
            id="objectType"
            name="objectType"
            defaultValue={projectObject?.objectType ?? "APARTMENT"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {objectTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
          <select
            id="clientId"
            name="clientId"
            defaultValue={projectObject?.clientId ?? ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            required
          >
            <option value="">Выберите клиента</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
          <FieldError name="clientId" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="designerId">Дизайнер / архитектор</Label>
          <select
            id="designerId"
            name="designerId"
            defaultValue={projectObject?.designerId ?? ""}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Не выбран</option>
            {designers.map((designer) => (
              <option key={designer.id} value={designer.id}>
                {designer.name}
                {designer.studio ? `, ${designer.studio}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibleId">Ответственный STURM *</Label>
          {canChangeResponsible ? (
            <select
              id="responsibleId"
              name="responsibleId"
              defaultValue={responsibleId}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
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
          <select
            id="stage"
            name="stage"
            defaultValue={projectObject?.stage ?? "NEW_OBJECT"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {objectStageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError name="stage" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Статус *</Label>
          <select
            id="status"
            name="status"
            defaultValue={projectObject?.status ?? "ACTIVE"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {objectStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError name="status" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="implementationStartAt">Начало реализации</Label>
          <Input
            id="implementationStartAt"
            name="implementationStartAt"
            type="date"
            defaultValue={dateValue(projectObject?.implementationStartAt)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="implementationEndAt">Завершение реализации</Label>
          <Input
            id="implementationEndAt"
            name="implementationEndAt"
            type="date"
            defaultValue={dateValue(projectObject?.implementationEndAt)}
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
      </div>

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

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Сохранение..." : submitLabel}
        </Button>
        <Button type="button" variant="outline" onClick={() => window.history.back()}>
          Отменить
        </Button>
      </div>
    </form>
  );
}
