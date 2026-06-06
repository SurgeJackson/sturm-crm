import { z } from "zod";
import type { ClientSource, ClientStatus, ClientType } from "@/generated/prisma/client";
import { compactString, optionalDate } from "@/modules/crm/form-utils";

export const clientSchema = z
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

export type ClientFormData = z.infer<typeof clientSchema>;

export function parseClientForm(formData: FormData) {
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

export function toClientDocument(data: ClientFormData, responsibleId: string) {
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
