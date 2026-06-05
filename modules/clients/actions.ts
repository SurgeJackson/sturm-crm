"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ClientSource, ClientStatus, ClientType } from "@/generated/prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import {
  canArchiveRecord,
  canChangeRecordResponsible,
  canCreateClient,
  canEditRecord
} from "@/permissions";
import { compactString, optionalDate, toAuditValue } from "@/modules/crm/form-utils";

export type ClientActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

const clientSchema = z
  .object({
    name: z.string().trim().min(1, "Укажите имя или название клиента"),
    clientType: z.enum([
      "INDIVIDUAL",
      "LEGAL_ENTITY",
      "COMPANY_REPRESENTATIVE",
      "DESIGNER_FOR_SELF",
      "CUSTOMER_REPRESENTATIVE"
    ]),
    phone: z.string().trim().optional(),
    email: z.union([z.literal(""), z.string().email("Укажите корректный email")]).optional(),
    messenger: z.string().trim().optional(),
    city: z.string().trim().optional(),
    source: z.enum([
      "SHOWROOM",
      "WEBSITE",
      "PHONE",
      "DESIGNER",
      "RECOMMENDATION",
      "EXHIBITION",
      "SOCIAL_MEDIA",
      "OTHER"
    ]),
    linkedDesignerId: z.string().trim().optional(),
    responsibleId: z.string().trim().min(1, "Выберите ответственного"),
    status: z.enum(["NEW", "ACTIVE", "SLEEPING", "REGULAR", "LOST", "ARCHIVED"]),
    comment: z.string().trim().optional(),
    lastContactAt: z.string().optional(),
    nextContactAt: z.string().optional()
  })
  .refine((value) => Boolean(value.phone || value.messenger), {
    message: "Укажите телефон или мессенджер клиента",
    path: ["phone"]
  });

function parseClientForm(formData: FormData) {
  return clientSchema.safeParse({
    name: formData.get("name"),
    clientType: formData.get("clientType"),
    phone: compactString(formData.get("phone")),
    email: formData.get("email") ?? "",
    messenger: compactString(formData.get("messenger")),
    city: compactString(formData.get("city")),
    source: formData.get("source"),
    linkedDesignerId: compactString(formData.get("linkedDesignerId")),
    responsibleId: formData.get("responsibleId"),
    status: formData.get("status"),
    comment: compactString(formData.get("comment")),
    lastContactAt: compactString(formData.get("lastContactAt")),
    nextContactAt: compactString(formData.get("nextContactAt"))
  });
}

function toClientDocument(data: z.infer<typeof clientSchema>, responsibleId: string) {
  return {
    name: data.name,
    clientType: data.clientType as ClientType,
    phone: data.phone || null,
    email: data.email || null,
    messenger: data.messenger || null,
    city: data.city || null,
    source: data.source as ClientSource,
    linkedDesignerId: data.linkedDesignerId || null,
    responsibleId,
    status: data.status as ClientStatus,
    comment: data.comment || null,
    notes: data.comment || null,
    lastContactAt: optionalDate(data.lastContactAt),
    nextContactAt: optionalDate(data.nextContactAt)
  };
}

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

  if (before.responsibleId !== responsibleId) {
    await writeAuditLog({
      entityType: "CLIENT",
      entityId: id,
      action: "CHANGE_RESPONSIBLE",
      userId: user.id,
      before: { responsibleId: before.responsibleId },
      after: { responsibleId }
    });
  }

  if (before.status !== parsed.data.status) {
    await writeAuditLog({
      entityType: "CLIENT",
      entityId: id,
      action: "CHANGE_STATUS",
      userId: user.id,
      before: { status: before.status },
      after: { status: parsed.data.status }
    });
  }

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

  redirect(`/clients/${id}?archived=1`);
}
