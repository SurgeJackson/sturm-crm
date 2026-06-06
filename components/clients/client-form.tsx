"use client";

import { useActionState } from "react";
import type { Client, Designer, User } from "@/generated/prisma/client";
import {
  DateField,
  FormField,
  FormMessage,
  FormSection,
  SelectField,
  TextareaField,
  TextField,
  dateInputValue
} from "@/components/crm/form-fields";
import { FormActions } from "@/components/crm/form-actions";
import { ResponsibleField } from "@/components/crm/responsible-field";
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
      <FormMessage state={state} />

      <FormSection title="Контакт" description="Идентификация клиента и основные способы связи.">
        <TextField name="name" label="Имя / название *" defaultValue={client?.name ?? ""} state={state} required />
        <SelectField name="clientType" label="Тип клиента *" defaultValue={client?.clientType ?? "INDIVIDUAL"} options={clientTypeOptions} state={state} />
        <TextField name="phone" label="Телефон" defaultValue={client?.phone ?? ""} state={state} />
        <TextField name="messenger" label="Мессенджер" defaultValue={client?.messenger ?? ""} state={state} />
        <TextField name="email" label="Email" type="email" defaultValue={client?.email ?? ""} state={state} />
        <TextField name="city" label="Город" defaultValue={client?.city ?? ""} />
      </FormSection>

      <FormSection title="Учет и связи" description="Источник, статус, ответственный и связанный дизайнер.">
        <SelectField name="source" label="Источник *" defaultValue={client?.source ?? "SHOWROOM"} options={clientSourceOptions} state={state} />
        <SelectField name="status" label="Статус *" defaultValue={client?.status ?? "NEW"} options={clientStatusOptions} state={state} />
        <ResponsibleField
          users={users}
          responsibleId={responsibleId}
          canChangeResponsible={canChangeResponsible}
          state={state}
        />
        <SelectField name="linkedDesignerId" label="Связанный дизайнер" defaultValue={client?.linkedDesignerId ?? ""} placeholder="Не выбран">
          {designers.map((designer) => (
            <option key={designer.id} value={designer.id}>
              {designer.name}
              {designer.studio ? `, ${designer.studio}` : ""}
            </option>
          ))}
        </SelectField>
      </FormSection>

      <FormSection title="Контактный цикл" description="Даты помогают контролировать CRM-дисциплину и follow-up.">
        <DateField name="lastContactAt" label="Последний контакт" defaultValue={dateInputValue(client?.lastContactAt)} />
        <DateField name="nextContactAt" label="Следующий контакт" defaultValue={dateInputValue(client?.nextContactAt)} />
      </FormSection>

      <FormSection title="Заметки" columns={1}>
        <TextareaField name="comment" label="Комментарий" defaultValue={client?.comment ?? ""} />
      </FormSection>

      <FormActions
        isPending={isPending}
        submitLabel={submitLabel}
        cancelHref={client ? `/clients/${client.id}` : "/clients"}
      />
    </form>
  );
}
