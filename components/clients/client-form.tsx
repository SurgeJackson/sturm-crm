"use client";

import { useActionState } from "react";
import type { Client, Designer, User } from "@/generated/prisma/client";
import {
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

      <FormSection>
        <TextField name="name" label="Имя / название *" defaultValue={client?.name ?? ""} state={state} required />
        <SelectField name="clientType" label="Тип клиента *" defaultValue={client?.clientType ?? "INDIVIDUAL"} options={clientTypeOptions} state={state} />
        <TextField name="phone" label="Телефон" defaultValue={client?.phone ?? ""} state={state} />
        <TextField name="messenger" label="Мессенджер" defaultValue={client?.messenger ?? ""} state={state} />
        <TextField name="email" label="Email" type="email" defaultValue={client?.email ?? ""} state={state} />
        <TextField name="city" label="Город" defaultValue={client?.city ?? ""} />
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
        <DateField name="lastContactAt" label="Последний контакт" defaultValue={dateInputValue(client?.lastContactAt)} />
        <DateField name="nextContactAt" label="Следующий контакт" defaultValue={dateInputValue(client?.nextContactAt)} />
      </FormSection>

      <TextareaField name="comment" label="Комментарий" defaultValue={client?.comment ?? ""} />

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
