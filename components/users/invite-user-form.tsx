"use client";

import { useActionState } from "react";
import { FormActions } from "@/components/crm/form-actions";
import { FormMessage, FormSection, SelectField, TextareaField, TextField } from "@/components/crm/form-fields";
import type { AdminUserActionState } from "@/modules/users/admin-actions";
import { roleOptions } from "@/modules/crm/options";

const initialState: AdminUserActionState = {};

export function InviteUserForm({ action }: { action: (state: AdminUserActionState, formData: FormData) => Promise<AdminUserActionState> }) {
  const [state, formAction, isPending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />
      <FormSection title="Пользователь">
        <TextField name="name" label="Имя *" state={state} required />
        <TextField name="email" label="Email *" type="email" state={state} required />
        <SelectField name="role" label="Роль *" options={roleOptions} defaultValue="STORE_MANAGER" state={state} />
      </FormSection>
      <FormSection title="Комментарий" columns={1}>
        <TextareaField name="comment" label="Комментарий" state={state} />
      </FormSection>
      <FormActions isPending={isPending} submitLabel="Отправить приглашение" cancelHref="/settings/users" />
    </form>
  );
}
