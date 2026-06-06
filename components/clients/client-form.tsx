"use client";

import { useActionState } from "react";
import type { Client, Designer, User } from "@/generated/prisma/client";
import { dateInputValue, FieldError, FormActions, FormSection } from "@/components/crm/form-fields";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ClientActionState } from "@/modules/clients/actions";
import {
  clientSourceOptions,
  clientStatusOptions,
  clientTypeOptions
} from "@/modules/crm/options";

type ClientFormProps = {
  action: (state: ClientActionState, formData: FormData) => Promise<ClientActionState>;
  client?: Client;
  users: Pick<User, "id" | "name" | "email">[];
  designers: Pick<Designer, "id" | "name" | "studio">[];
  currentUserId: string;
  canChangeResponsible: boolean;
  submitLabel: string;
};

const initialState: ClientActionState = {};

export function ClientForm({
  action,
  client,
  users,
  designers,
  currentUserId,
  canChangeResponsible,
  submitLabel
}: ClientFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const responsibleId = client?.responsibleId ?? currentUserId;

  return (
    <form action={formAction} className="grid gap-5">
      {state.message ? <p className="rounded-md border border-destructive p-3 text-sm text-destructive">{state.message}</p> : null}

      <FormSection>
        <div className="space-y-2">
          <Label htmlFor="name">Имя / название *</Label>
          <Input id="name" name="name" defaultValue={client?.name ?? ""} required />
          <FieldError name="name" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="clientType">Тип клиента *</Label>
          <select
            id="clientType"
            name="clientType"
            defaultValue={client?.clientType ?? "INDIVIDUAL"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {clientTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError name="clientType" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input id="phone" name="phone" defaultValue={client?.phone ?? ""} />
          <FieldError name="phone" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="messenger">Мессенджер</Label>
          <Input id="messenger" name="messenger" defaultValue={client?.messenger ?? ""} />
          <FieldError name="messenger" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={client?.email ?? ""} />
          <FieldError name="email" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Город</Label>
          <Input id="city" name="city" defaultValue={client?.city ?? ""} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="source">Источник *</Label>
          <select
            id="source"
            name="source"
            defaultValue={client?.source ?? "SHOWROOM"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {clientSourceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError name="source" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Статус *</Label>
          <select
            id="status"
            name="status"
            defaultValue={client?.status ?? "NEW"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {clientStatusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <FieldError name="status" state={state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibleId">Ответственный *</Label>
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
          <Label htmlFor="linkedDesignerId">Связанный дизайнер</Label>
          <select
            id="linkedDesignerId"
            name="linkedDesignerId"
            defaultValue={client?.linkedDesignerId ?? ""}
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
          <Label htmlFor="lastContactAt">Последний контакт</Label>
          <Input id="lastContactAt" name="lastContactAt" type="date" defaultValue={dateInputValue(client?.lastContactAt)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="nextContactAt">Следующий контакт</Label>
          <Input id="nextContactAt" name="nextContactAt" type="date" defaultValue={dateInputValue(client?.nextContactAt)} />
        </div>
      </FormSection>

      <div className="space-y-2">
        <Label htmlFor="comment">Комментарий</Label>
        <Textarea id="comment" name="comment" defaultValue={client?.comment ?? ""} />
      </div>

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
