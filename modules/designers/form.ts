import { z } from "zod";
import type {
  DesignerLoyalty,
  DesignerPotential,
  DesignerRelationshipStage,
  DesignerRole,
  DesignerSource,
  DesignerSpecialization,
  EntityStatus
} from "@/generated/prisma/client";
import { compactString, optionalDate } from "@/modules/crm/form-utils";

export const relationshipStages = [
  "NEW_CONTACT",
  "FIRST_CONTACT",
  "INTERESTED",
  "INVITED_TO_SHOWROOM",
  "MEETING_DONE",
  "PRESENTATION_DONE",
  "TERMS_DISCUSSING",
  "IN_DEVELOPMENT",
  "FIRST_OBJECT_RECEIVED",
  "ACTIVE_PARTNER",
  "KEY_PARTNER",
  "SLEEPING",
  "LOST_OR_IRRELEVANT"
] as const;

export const designerSchema = z
  .object({
    name: z.string().trim().min(1, "Укажите имя дизайнера"),
    studio: z.string().trim().optional(),
    role: z.enum([
      "DESIGNER",
      "ARCHITECT",
      "BUREAU_HEAD",
      "COMPLETER",
      "DECORATOR",
      "DESIGNER_ASSISTANT",
      "OTHER"
    ]),
    phone: z.string().trim().optional(),
    email: z.union([z.literal(""), z.string().email("Укажите корректный email")]).optional(),
    messenger: z.string().trim().optional(),
    website: z.string().trim().optional(),
    city: z.string().trim().min(1, "Укажите город"),
    specialization: z.array(
      z.enum(["APARTMENTS", "HOUSES", "COMMERCIAL", "HORECA", "HOTELS", "OFFICES", "OTHER"])
    ),
    projectSegment: z
      .union([z.literal(""), z.enum(["ECONOMY", "MIDDLE", "MIDDLE_PLUS", "PREMIUM", "LUXURY"])])
      .optional(),
    source: z.enum(["EXHIBITION", "RECOMMENDATION", "SOCIAL_MEDIA", "INCOMING", "DATABASE", "SHOWROOM", "EVENT", "OTHER"]),
    responsibleId: z.string().trim().min(1, "Выберите ответственного"),
    relationshipStage: z.enum(relationshipStages),
    potential: z.enum(["A", "B", "C", "D"]),
    loyalty: z.enum(["COLD", "NEUTRAL", "WARM", "LOYAL", "AMBASSADOR"]),
    cooperationTerms: z.string().trim().optional(),
    firstContactAt: z.string().optional(),
    lastTouchAt: z.string().optional(),
    nextStepAt: z.string().trim().min(1, "Укажите дату следующего шага"),
    nextStepText: z.string().trim().min(1, "Укажите следующий шаг по дизайнеру"),
    comment: z.string().trim().optional()
  })
  .refine((value) => Boolean(value.phone || value.messenger), {
    message: "Укажите телефон или мессенджер дизайнера",
    path: ["phone"]
  });

export type DesignerFormData = z.infer<typeof designerSchema>;

export function parseDesignerForm(formData: FormData) {
  return designerSchema.safeParse({
    name: formData.get("name"),
    studio: compactString(formData.get("studio")),
    role: formData.get("role"),
    phone: compactString(formData.get("phone")),
    email: formData.get("email") ?? "",
    messenger: compactString(formData.get("messenger")),
    website: compactString(formData.get("website")),
    city: formData.get("city"),
    specialization: formData.getAll("specialization"),
    projectSegment: formData.get("projectSegment") ?? "",
    source: formData.get("source"),
    responsibleId: formData.get("responsibleId"),
    relationshipStage: formData.get("relationshipStage"),
    potential: formData.get("potential"),
    loyalty: formData.get("loyalty"),
    cooperationTerms: compactString(formData.get("cooperationTerms")),
    firstContactAt: compactString(formData.get("firstContactAt")),
    lastTouchAt: compactString(formData.get("lastTouchAt")),
    nextStepAt: formData.get("nextStepAt"),
    nextStepText: formData.get("nextStepText"),
    comment: compactString(formData.get("comment"))
  });
}

export function toDesignerDocument(data: DesignerFormData, responsibleId: string) {
  return {
    name: data.name,
    studio: data.studio || null,
    role: data.role as DesignerRole,
    phone: data.phone || null,
    email: data.email || null,
    messenger: data.messenger || null,
    website: data.website || null,
    city: data.city,
    specialization: data.specialization as DesignerSpecialization[],
    projectSegment: data.projectSegment || null,
    source: data.source as DesignerSource,
    responsibleId,
    relationshipStage: data.relationshipStage as DesignerRelationshipStage,
    potential: data.potential as DesignerPotential,
    loyalty: data.loyalty as DesignerLoyalty,
    cooperationTerms: data.cooperationTerms || null,
    firstContactAt: optionalDate(data.firstContactAt),
    lastTouchAt: optionalDate(data.lastTouchAt),
    nextStepAt: optionalDate(data.nextStepAt),
    nextStepText: data.nextStepText,
    comment: data.comment || null,
    notes: data.comment || null,
    status: (data.relationshipStage === "LOST_OR_IRRELEVANT" ? "LOST" : "ACTIVE") as EntityStatus
  };
}
