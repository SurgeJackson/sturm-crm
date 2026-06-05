"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type { ClientSource, ClientStatus, ClientType } from "@prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import { getMongoDb } from "@/db/mongo";
import { writeAuditLog } from "@/lib/audit-log";
import {
  canArchiveRecord,
  canChangeRecordResponsible,
  canCreateClient,
  canEditRecord
} from "@/permissions";
import { compactString, optionalDate, optionalObjectId, toAuditValue, toObjectId } from "@/modules/crm/mongo-utils";

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
    linkedDesignerId: optionalObjectId(data.linkedDesignerId),
    responsibleId: toObjectId(responsibleId),
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
  const now = new Date();
  const db = await getMongoDb();
  const document = {
    ...toClientDocument(parsed.data, responsibleId),
    createdById: toObjectId(user.id),
    createdAt: now,
    updatedAt: now,
    archivedAt: parsed.data.status === "ARCHIVED" ? now : null
  };

  const result = await db.collection("Client").insertOne(document);
  const entityId = result.insertedId.toString();

  await writeAuditLog({
    entityType: "CLIENT",
    entityId,
    action: "CREATE",
    userId: user.id,
    after: toAuditValue({ _id: result.insertedId, ...document })
  });

  redirect(`/clients/${entityId}?saved=1`);
}

export async function updateClientAction(id: string, _prevState: ClientActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const db = await getMongoDb();
  const _id = toObjectId(id);
  const before = await db.collection("Client").findOne({ _id });

  if (!before || !canEditRecord(user, {
    createdById: before.createdById?.toString(),
    responsibleId: before.responsibleId?.toString()
  })) {
    return { message: "Недостаточно прав для редактирования клиента" };
  }

  const parsed = parseClientForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const responsibleId = canChangeRecordResponsible(user)
    ? parsed.data.responsibleId
    : before.responsibleId.toString();
  const update = {
    ...toClientDocument(parsed.data, responsibleId),
    updatedAt: new Date()
  };

  await db.collection("Client").updateOne({ _id }, { $set: update });
  const after = await db.collection("Client").findOne({ _id });

  await writeAuditLog({
    entityType: "CLIENT",
    entityId: id,
    action: "UPDATE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  if (before.responsibleId?.toString() !== responsibleId) {
    await writeAuditLog({
      entityType: "CLIENT",
      entityId: id,
      action: "CHANGE_RESPONSIBLE",
      userId: user.id,
      before: { responsibleId: before.responsibleId?.toString() },
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

  const db = await getMongoDb();
  const _id = toObjectId(id);
  const before = await db.collection("Client").findOne({ _id });

  if (!before || !canArchiveRecord(user, {
    createdById: before.createdById?.toString(),
    responsibleId: before.responsibleId?.toString()
  })) {
    redirect(`/clients/${id}?error=archive`);
  }

  const update = {
    status: "ARCHIVED",
    archivedAt: new Date(),
    updatedAt: new Date()
  };
  await db.collection("Client").updateOne({ _id }, { $set: update });
  const after = await db.collection("Client").findOne({ _id });

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
