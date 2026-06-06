"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import {
  canArchiveRecord,
  canChangeRecordResponsible,
  canCreateClient,
  canEditRecord
} from "@/permissions";
import { writeTrackedFieldAuditLogs } from "@/modules/crm/audit-helpers";
import { toAuditValue } from "@/modules/crm/form-utils";
import { expireViolationsForEntity, syncClientDiscipline } from "@/modules/crm-discipline/service";
import { parseClientForm, toClientDocument } from "@/modules/clients/form";

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
  const document = {
    ...toClientDocument(parsed.data, responsibleId),
    createdById: user.id,
    archivedAt: parsed.data.status === "ARCHIVED" ? new Date() : null
  };

  const client = await prisma.client.create({
    data: document
  });

  await writeAuditLog({
    entityType: "CLIENT",
    entityId: client.id,
    action: "CREATE",
    userId: user.id,
    after: toAuditValue(client)
  });

  await syncClientDiscipline(client.id, user.id);

  redirect(`/clients/${client.id}?saved=1`);
}

export async function updateClientAction(id: string, _prevState: ClientActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const before = await prisma.client.findUnique({ where: { id } });

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
  const update = {
    ...toClientDocument(parsed.data, responsibleId)
  };

  const after = await prisma.client.update({
    where: { id },
    data: update
  });

  await writeAuditLog({
    entityType: "CLIENT",
    entityId: id,
    action: "UPDATE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  await writeTrackedFieldAuditLogs({
    entityType: "CLIENT",
    entityId: id,
    userId: user.id,
    fields: [
      ["responsibleId", "CHANGE_RESPONSIBLE", before.responsibleId, responsibleId],
      ["status", "CHANGE_STATUS", before.status, parsed.data.status]
    ]
  });

  await syncClientDiscipline(id, user.id);

  redirect(`/clients/${id}?saved=1`);
}

export async function archiveClientAction(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const before = await prisma.client.findUnique({ where: { id } });

  if (!before || !canArchiveRecord(user, {
    createdById: before.createdById,
    responsibleId: before.responsibleId
  })) {
    redirect(`/clients/${id}?error=archive`);
  }

  const update = {
    status: "ARCHIVED" as const,
    archivedAt: new Date(),
    updatedAt: new Date()
  };
  const after = await prisma.client.update({
    where: { id },
    data: update
  });

  await writeAuditLog({
    entityType: "CLIENT",
    entityId: id,
    action: "ARCHIVE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  await expireViolationsForEntity("CLIENT", id, user.id);

  redirect(`/clients/${id}?archived=1`);
}
