import { z } from "zod";
import type {
  AttitudeToSturm,
  ChangeApproval,
  InfluenceLevel,
  InfluenceType,
  ObjectInterestCategory,
  ObjectStage,
  ObjectStatus,
  ObjectType,
  ProjectObjectParticipantType
} from "@/generated/prisma/client";
import {
  compactString,
  optionalDate,
  optionalInteger,
  optionalNumber,
  splitTextareaLines
} from "@/modules/crm/form-utils";

const objectTypes = [
  "APARTMENT",
  "PRIVATE_HOUSE",
  "APARTMENTS_COMPLEX",
  "HOTEL",
  "APART_HOTEL",
  "RESTAURANT",
  "OFFICE",
  "MEDICAL",
  "FITNESS_POOL",
  "RESIDENTIAL_COMPLEX",
  "COMMERCIAL",
  "OTHER"
] as const;

const interestCategories = [
  "SANITARY_WARE",
  "MIXERS",
  "SHOWER_SYSTEMS",
  "BATHROOM_FURNITURE",
  "ACCESSORIES",
  "TILES",
  "MIRRORS",
  "COMMERCIAL_SANITARY",
  "OTHER"
] as const;

const objectStages = [
  "NEW_OBJECT",
  "INFO_COLLECTION",
  "DESIGN_STAGE",
  "CALCULATION",
  "APPROVAL",
  "PURCHASE",
  "DELIVERY_IMPLEMENTATION",
  "COMPLETED",
  "FROZEN",
  "LOST"
] as const;

const objectStatuses = ["ACTIVE", "FROZEN", "COMPLETED", "LOST", "ARCHIVED"] as const;
const participantTypes = ["PURCHASE_INFLUENCER", "IMPLEMENTATION_CONTACT"] as const;
const influenceLevels = ["HIGH", "MEDIUM", "LOW"] as const;
const influenceTypes = [
  "BUDGET",
  "BRAND",
  "FINAL_DECISION",
  "TECHNICAL_SOLUTION",
  "DEADLINES",
  "PAYMENT_TERMS",
  "SUPPLIER_CHOICE",
  "OTHER"
] as const;
const attitudesToSturm = ["LOYAL", "NEUTRAL", "AGAINST", "UNKNOWN"] as const;
const changeApprovals = ["YES", "NO", "PARTIALLY"] as const;

export const objectSchema = z.object({
  title: z.string().trim().min(1, "Укажите название объекта"),
  objectType: z.enum(objectTypes, { message: "Выберите тип объекта" }),
  city: z.string().trim().min(1, "Укажите город объекта"),
  region: z.string().trim().optional(),
  address: z.string().trim().optional(),
  clientId: z.string().trim().min(1, "Укажите клиента или заказчика объекта"),
  designerId: z.string().trim().optional(),
  responsibleId: z.string().trim().min(1, "Укажите ответственного STURM по объекту"),
  stage: z.enum(objectStages, { message: "Выберите стадию объекта" }),
  status: z.enum(objectStatuses, { message: "Выберите статус объекта" }),
  implementationStartAt: z.string().optional(),
  implementationEndAt: z.string().optional(),
  budget: z.string().trim().optional(),
  bathroomsCount: z.string().trim().optional(),
  interestCategories: z.array(z.enum(interestCategories)),
  files: z.string().trim().optional(),
  comment: z.string().trim().optional()
});

export const participantSchema = z
  .object({
    participantType: z.enum(participantTypes),
    fullName: z.string().trim().min(1, "Укажите ФИО участника"),
    company: z.string().trim().optional(),
    role: z.string().trim().min(1, "Укажите роль участника"),
    phone: z.string().trim().optional(),
    email: z.union([z.literal(""), z.string().email("Укажите корректный email")]).optional(),
    messenger: z.string().trim().optional(),
    responsibleId: z.string().trim().optional(),
    comment: z.string().trim().optional(),
    influenceLevel: z.union([z.literal(""), z.enum(influenceLevels)]).optional(),
    influenceType: z.union([z.literal(""), z.enum(influenceTypes)]).optional(),
    attitudeToSturm: z.union([z.literal(""), z.enum(attitudesToSturm)]).optional(),
    decisionFactors: z.string().trim().optional(),
    responsibilityZone: z.string().trim().optional(),
    canApproveChanges: z.union([z.literal(""), z.enum(changeApprovals)]).optional(),
    whenToInvolve: z.string().trim().optional()
  })
  .superRefine((value, ctx) => {
    if (value.participantType === "PURCHASE_INFLUENCER") {
      if (!value.influenceLevel) ctx.addIssue({ code: "custom", message: "Укажите уровень влияния", path: ["influenceLevel"] });
      if (!value.influenceType) ctx.addIssue({ code: "custom", message: "Укажите тип влияния", path: ["influenceType"] });
    }

    if (value.participantType === "IMPLEMENTATION_CONTACT") {
      if (!value.responsibilityZone) ctx.addIssue({ code: "custom", message: "Укажите зону ответственности", path: ["responsibilityZone"] });
      if (!value.canApproveChanges) ctx.addIssue({ code: "custom", message: "Укажите возможность согласовывать изменения", path: ["canApproveChanges"] });
    }
  });

export type ObjectFormData = z.infer<typeof objectSchema>;
export type ParticipantFormData = z.infer<typeof participantSchema>;

export function parseObjectForm(formData: FormData) {
  return objectSchema.safeParse({
    title: formData.get("title"),
    objectType: formData.get("objectType"),
    city: formData.get("city"),
    region: compactString(formData.get("region")),
    address: compactString(formData.get("address")),
    clientId: formData.get("clientId"),
    designerId: compactString(formData.get("designerId")),
    responsibleId: formData.get("responsibleId"),
    stage: formData.get("stage"),
    status: formData.get("status"),
    implementationStartAt: compactString(formData.get("implementationStartAt")),
    implementationEndAt: compactString(formData.get("implementationEndAt")),
    budget: compactString(formData.get("budget")),
    bathroomsCount: compactString(formData.get("bathroomsCount")),
    interestCategories: formData.getAll("interestCategories"),
    files: compactString(formData.get("files")),
    comment: compactString(formData.get("comment"))
  });
}

export function toObjectDocument(data: ObjectFormData, responsibleId: string) {
  return {
    title: data.title,
    objectType: data.objectType as ObjectType,
    city: data.city,
    region: data.region || null,
    address: data.address || null,
    clientId: data.clientId,
    designerId: data.designerId || null,
    responsibleId,
    stage: data.stage as ObjectStage,
    status: data.status as ObjectStatus,
    implementationStartAt: optionalDate(data.implementationStartAt),
    implementationEndAt: optionalDate(data.implementationEndAt),
    budget: optionalNumber(data.budget),
    bathroomsCount: optionalInteger(data.bathroomsCount),
    interestCategories: data.interestCategories as ObjectInterestCategory[],
    files: splitTextareaLines(data.files),
    comment: data.comment || null,
    notes: data.comment || null,
    archivedAt: data.status === "ARCHIVED" ? new Date() : null
  };
}

export function parseParticipantForm(formData: FormData) {
  return participantSchema.safeParse({
    participantType: formData.get("participantType"),
    fullName: formData.get("fullName"),
    company: compactString(formData.get("company")),
    role: formData.get("role"),
    phone: compactString(formData.get("phone")),
    email: formData.get("email") ?? "",
    messenger: compactString(formData.get("messenger")),
    responsibleId: compactString(formData.get("responsibleId")),
    comment: compactString(formData.get("comment")),
    influenceLevel: formData.get("influenceLevel") ?? "",
    influenceType: formData.get("influenceType") ?? "",
    attitudeToSturm: formData.get("attitudeToSturm") ?? "",
    decisionFactors: compactString(formData.get("decisionFactors")),
    responsibilityZone: compactString(formData.get("responsibilityZone")),
    canApproveChanges: formData.get("canApproveChanges") ?? "",
    whenToInvolve: compactString(formData.get("whenToInvolve"))
  });
}

export function toParticipantDocument(data: ParticipantFormData) {
  const isInfluencer = data.participantType === "PURCHASE_INFLUENCER";

  return {
    participantType: data.participantType as ProjectObjectParticipantType,
    fullName: data.fullName,
    company: data.company || null,
    role: data.role,
    phone: data.phone || null,
    email: data.email || null,
    messenger: data.messenger || null,
    responsibleId: data.responsibleId || null,
    comment: data.comment || null,
    influenceLevel: isInfluencer ? (data.influenceLevel as InfluenceLevel) : null,
    influenceType: isInfluencer ? (data.influenceType as InfluenceType) : null,
    attitudeToSturm: isInfluencer ? ((data.attitudeToSturm || "UNKNOWN") as AttitudeToSturm) : null,
    decisionFactors: isInfluencer ? data.decisionFactors || null : null,
    responsibilityZone: isInfluencer ? null : data.responsibilityZone || null,
    canApproveChanges: isInfluencer ? null : (data.canApproveChanges as ChangeApproval),
    whenToInvolve: isInfluencer ? null : data.whenToInvolve || null
  };
}
