"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import {
  canChangeRecordResponsible,
  canCreateClient,
  canEditRecord
} from "@/permissions";
import { parseClientForm } from "@/modules/clients/form";
import { getClientForMutation } from "@/modules/clients/services/queries";
import { createClient, updateClient } from "@/modules/clients/services/workflow";

export type ClientActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createClientAction(_prevState: ClientActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user || !canCreateClient(user)) {
    return { message: "Недостаточно прав для создания клиента" };
  }

  const parsed = parseClientForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const responsibleId = canChangeRecordResponsible(user) ? parsed.data.responsibleId : user.id;
  const client = await createClient(parsed.data, responsibleId, user.id);

  redirect(`/clients/${client.id}?saved=1`);
}

export async function updateClientAction(id: string, _prevState: ClientActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const before = await getClientForMutation(id);

  if (!before || !canEditRecord(user, {
    createdById: before.createdById,
    responsibleId: before.responsibleId
  })) {
    return { message: "Недостаточно прав для редактирования клиента" };
  }

  const parsed = parseClientForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const responsibleId = canChangeRecordResponsible(user)
    ? parsed.data.responsibleId
    : before.responsibleId;
  await updateClient(id, before, parsed.data, responsibleId, user.id);

  redirect(`/clients/${id}?saved=1`);
}
