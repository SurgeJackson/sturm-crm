"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import type {
  DesignerLoyalty,
  DesignerPotential,
  EntityStatus,
  DesignerRelationshipStage,
  DesignerRole,
  DesignerSource,
  DesignerSpecialization
} from "@prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import {
  canArchiveRecord,
  canChangeRecordResponsible,
  canCreateDesigner,
  canEditRecord
} from "@/permissions";
import { compactString, optionalDate, toAuditValue } from "@/modules/crm/form-utils";

export type DesignerActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

const relationshipStages = [
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

const designerSchema = z
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

function parseDesignerForm(formData: FormData) {
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

function toDesignerDocument(data: z.infer<typeof designerSchema>, responsibleId: string) {
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

export async function createDesignerAction(_prevState: DesignerActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user || !canCreateDesigner(user)) {
    return { message: "Недостаточно прав для создания дизайнера" };
  }

  const parsed = parseDesignerForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const responsibleId = canChangeRecordResponsible(user) ? parsed.data.responsibleId : user.id;
  const document = {
    ...toDesignerDocument(parsed.data, responsibleId),
    transferredObjectsCount: 0,
    activeObjectsCount: 0,
    proposalsTotalAmount: 0,
    paymentsTotalAmount: 0,
    createdById: user.id,
    archivedAt: null
  };

  const designer = await prisma.designer.create({
    data: document
  });

  await writeAuditLog({
    entityType: "DESIGNER",
    entityId: designer.id,
    action: "CREATE",
    userId: user.id,
    after: toAuditValue(designer)
  });

  redirect(`/designers/${designer.id}?saved=1`);
}

export async function updateDesignerAction(id: string, _prevState: DesignerActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const before = await prisma.designer.findUnique({ where: { id } });

  if (!before || !canEditRecord(user, {
    createdById: before.createdById,
    responsibleId: before.responsibleId
  })) {
    return { message: "Недостаточно прав для редактирования дизайнера" };
  }

  const parsed = parseDesignerForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const responsibleId = canChangeRecordResponsible(user)
    ? parsed.data.responsibleId
    : before.responsibleId;
  const update = {
    ...toDesignerDocument(parsed.data, responsibleId)
  };

  const after = await prisma.designer.update({
    where: { id },
    data: update
  });

  await writeAuditLog({
    entityType: "DESIGNER",
    entityId: id,
    action: "UPDATE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  const trackedFields = [
    ["responsibleId", "CHANGE_RESPONSIBLE", before.responsibleId, responsibleId],
    ["relationshipStage", "CHANGE_RELATIONSHIP_STAGE", before.relationshipStage, parsed.data.relationshipStage],
    ["potential", "CHANGE_POTENTIAL", before.potential, parsed.data.potential],
    ["loyalty", "CHANGE_LOYALTY", before.loyalty, parsed.data.loyalty],
    ["nextStepText", "CHANGE_NEXT_STEP", before.nextStepText, parsed.data.nextStepText],
    ["nextStepAt", "CHANGE_NEXT_STEP", before.nextStepAt?.toISOString?.(), update.nextStepAt?.toISOString?.()]
  ] as const;

  for (const [field, action, previous, next] of trackedFields) {
    if (previous !== next) {
      await writeAuditLog({
        entityType: "DESIGNER",
        entityId: id,
        action,
        userId: user.id,
        before: { [field]: previous },
        after: { [field]: next }
      });
    }
  }

  redirect(`/designers/${id}?saved=1`);
}

export async function archiveDesignerAction(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const before = await prisma.designer.findUnique({ where: { id } });

  if (!before || !canArchiveRecord(user, {
    createdById: before.createdById,
    responsibleId: before.responsibleId
  })) {
    redirect(`/designers/${id}?error=archive`);
  }

  const update = {
    status: "ARCHIVED" as const,
    archivedAt: new Date(),
    updatedAt: new Date()
  };
  const after = await prisma.designer.update({
    where: { id },
    data: update
  });

  await writeAuditLog({
    entityType: "DESIGNER",
    entityId: id,
    action: "ARCHIVE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  redirect(`/designers/${id}?archived=1`);
}

export async function changeDesignerStageAction(id: string, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const stage = formData.get("relationshipStage");

  if (!relationshipStages.includes(stage as DesignerRelationshipStage)) {
    redirect("/designers/pipeline?error=stage");
  }

  const before = await prisma.designer.findUnique({ where: { id } });

  if (!before || !canEditRecord(user, {
    createdById: before.createdById,
    responsibleId: before.responsibleId
  })) {
    redirect("/designers/pipeline?error=permission");
  }

  await prisma.designer.update({
    where: { id },
    data: { relationshipStage: stage as DesignerRelationshipStage }
  });

  await writeAuditLog({
    entityType: "DESIGNER",
    entityId: id,
    action: "CHANGE_RELATIONSHIP_STAGE",
    userId: user.id,
    before: { relationshipStage: before.relationshipStage },
    after: { relationshipStage: stage }
  });

  redirect("/designers/pipeline?saved=1");
}
