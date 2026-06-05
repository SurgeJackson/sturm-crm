"use server";

import { redirect } from "next/navigation";
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
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import {
  canArchiveRecord,
  canChangeObjectResponsible,
  canCreateObject,
  canEditRecord,
  canManageObjectParticipants
} from "@/permissions";
import { compactString, optionalDate, toAuditValue } from "@/modules/crm/form-utils";
import { expireViolationsForEntity, syncDesignerDiscipline, syncObjectDiscipline } from "@/modules/crm-discipline/service";

export type ProjectObjectActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export type ProjectObjectParticipantActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

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

const objectSchema = z.object({
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

const participantSchema = z
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
      if (!value.influenceLevel) {
        ctx.addIssue({ code: "custom", message: "Укажите уровень влияния", path: ["influenceLevel"] });
      }
      if (!value.influenceType) {
        ctx.addIssue({ code: "custom", message: "Укажите тип влияния", path: ["influenceType"] });
      }
    }

    if (value.participantType === "IMPLEMENTATION_CONTACT") {
      if (!value.responsibilityZone) {
        ctx.addIssue({ code: "custom", message: "Укажите зону ответственности", path: ["responsibilityZone"] });
      }
      if (!value.canApproveChanges) {
        ctx.addIssue({ code: "custom", message: "Укажите возможность согласовывать изменения", path: ["canApproveChanges"] });
      }
    }
  });

function parseObjectForm(formData: FormData) {
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

function parseNumber(value?: string) {
  if (!value) return null;
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value?: string) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function toObjectDocument(data: z.infer<typeof objectSchema>, responsibleId: string) {
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
    budget: parseNumber(data.budget),
    bathroomsCount: parseInteger(data.bathroomsCount),
    interestCategories: data.interestCategories as ObjectInterestCategory[],
    files: data.files ? data.files.split(/\r?\n/).map((file) => file.trim()).filter(Boolean) : [],
    comment: data.comment || null,
    notes: data.comment || null,
    archivedAt: data.status === "ARCHIVED" ? new Date() : null
  };
}

function parseParticipantForm(formData: FormData) {
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

function toParticipantDocument(data: z.infer<typeof participantSchema>) {
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

async function refreshDesignerObjectCounters(designerId?: string | null) {
  if (!designerId) return;

  const [transferredObjectsCount, activeObjectsCount] = await Promise.all([
    prisma.projectObject.count({ where: { designerId, archivedAt: null } }),
    prisma.projectObject.count({ where: { designerId, archivedAt: null, status: "ACTIVE" } })
  ]);

  await prisma.designer.update({
    where: { id: designerId },
    data: { transferredObjectsCount, activeObjectsCount }
  });
}

async function refreshDesignerCountersForChange(beforeDesignerId?: string | null, afterDesignerId?: string | null) {
  const ids = Array.from(new Set([beforeDesignerId, afterDesignerId].filter(Boolean)));
  for (const id of ids) {
    await refreshDesignerObjectCounters(id);
  }
}

async function createFrozenObjectReturnTask(object: {
  id: string;
  title: string;
  clientId: string;
  designerId: string | null;
  responsibleId: string;
}, userId: string) {
  const existing = await prisma.taskActivity.findFirst({
    where: {
      objectId: object.id,
      autoRule: "FROZEN_OBJECT_RETURN",
      archivedAt: null,
      status: { notIn: ["DONE", "CANCELLED", "CLOSED"] }
    },
    select: { id: true }
  });
  if (existing) return;

  const dueAt = new Date();
  dueAt.setDate(dueAt.getDate() + 30);

  const task = await prisma.taskActivity.create({
    data: {
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: `Вернуться к объекту ${object.title}`,
      description: "Автоматическая задача после заморозки объекта",
      responsibleId: object.responsibleId,
      createdById: userId,
      clientId: object.clientId,
      designerId: object.designerId,
      objectId: object.id,
      status: "NEW",
      priority: "NORMAL",
      dueAt,
      isAutoCreated: true,
      autoRule: "FROZEN_OBJECT_RETURN"
    }
  });

  await writeAuditLog({
    entityType: "TASK",
    entityId: task.id,
    action: "CREATE_AUTO",
    userId,
    after: toAuditValue(task)
  });
}

export async function createProjectObjectAction(_prevState: ProjectObjectActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user || !canCreateObject(user)) {
    return { message: "Недостаточно прав для создания объекта" };
  }

  const parsed = parseObjectForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const [client, designer] = await Promise.all([
    prisma.client.findUnique({ where: { id: parsed.data.clientId }, select: { id: true } }),
    parsed.data.designerId
      ? prisma.designer.findUnique({ where: { id: parsed.data.designerId }, select: { id: true } })
      : null
  ]);

  if (!client) return { message: "Укажите клиента или заказчика объекта" };
  if (parsed.data.designerId && !designer) return { message: "Выбранный дизайнер не найден" };

  const responsibleId = canChangeObjectResponsible(user) ? parsed.data.responsibleId : user.id;
  const object = await prisma.projectObject.create({
    data: {
      ...toObjectDocument(parsed.data, responsibleId),
      createdById: user.id
    }
  });

  await refreshDesignerObjectCounters(object.designerId);

  await writeAuditLog({
    entityType: "OBJECT",
    entityId: object.id,
    action: "CREATE",
    userId: user.id,
    after: toAuditValue(object)
  });

  await syncObjectDiscipline(object.id, user.id);

  redirect(`/objects/${object.id}?saved=1`);
}

export async function updateProjectObjectAction(id: string, _prevState: ProjectObjectActionState, formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const before = await prisma.projectObject.findUnique({ where: { id } });

  if (!before || !canEditRecord(user, before)) {
    return { message: "Недостаточно прав для редактирования объекта" };
  }

  const parsed = parseObjectForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const [client, designer] = await Promise.all([
    prisma.client.findUnique({ where: { id: parsed.data.clientId }, select: { id: true } }),
    parsed.data.designerId
      ? prisma.designer.findUnique({ where: { id: parsed.data.designerId }, select: { id: true } })
      : null
  ]);

  if (!client) return { message: "Укажите клиента или заказчика объекта" };
  if (parsed.data.designerId && !designer) return { message: "Выбранный дизайнер не найден" };

  const responsibleId = canChangeObjectResponsible(user) ? parsed.data.responsibleId : before.responsibleId;
  const update = toObjectDocument(parsed.data, responsibleId);
  const after = await prisma.projectObject.update({
    where: { id },
    data: update
  });

  await refreshDesignerCountersForChange(before.designerId, after.designerId);

  await writeAuditLog({
    entityType: "OBJECT",
    entityId: id,
    action: "UPDATE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  const trackedFields = [
    ["responsibleId", "CHANGE_RESPONSIBLE", before.responsibleId, after.responsibleId],
    ["stage", "CHANGE_STAGE", before.stage, after.stage],
    ["status", "CHANGE_STATUS", before.status, after.status],
    ["clientId", "CHANGE_CLIENT", before.clientId, after.clientId],
    ["designerId", "CHANGE_DESIGNER", before.designerId, after.designerId]
  ] as const;

  for (const [field, action, previous, next] of trackedFields) {
    if (previous !== next) {
      await writeAuditLog({
        entityType: "OBJECT",
        entityId: id,
        action,
        userId: user.id,
        before: { [field]: previous },
        after: { [field]: next }
      });
    }
  }

  const becameFrozen =
    (after.status === "FROZEN" || after.stage === "FROZEN") &&
    before.status !== "FROZEN" &&
    before.stage !== "FROZEN";
  if (becameFrozen) {
    await createFrozenObjectReturnTask(after, user.id);
  }

  await syncObjectDiscipline(id, user.id);

  redirect(`/objects/${id}?saved=1`);
}

export async function archiveProjectObjectAction(id: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const before = await prisma.projectObject.findUnique({ where: { id } });

  if (!before || !canArchiveRecord(user, before)) {
    redirect(`/objects/${id}?error=archive`);
  }

  const after = await prisma.projectObject.update({
    where: { id },
    data: {
      status: "ARCHIVED",
      archivedAt: new Date()
    }
  });

  await refreshDesignerObjectCounters(after.designerId);

  await writeAuditLog({
    entityType: "OBJECT",
    entityId: id,
    action: "ARCHIVE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  await expireViolationsForEntity("OBJECT", id, user.id);

  redirect(`/objects/${id}?archived=1`);
}

export async function createProjectObjectParticipantAction(
  objectId: string,
  _prevState: ProjectObjectParticipantActionState,
  formData: FormData
) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const object = await prisma.projectObject.findUnique({ where: { id: objectId } });

  if (!object || !canManageObjectParticipants(user, object)) {
    return { message: "Недостаточно прав для добавления участника" };
  }

  const parsed = parseParticipantForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const participant = await prisma.projectObjectParticipant.create({
    data: {
      ...toParticipantDocument(parsed.data),
      objectId,
      createdById: user.id
    }
  });

  await writeAuditLog({
    entityType: "OBJECT",
    entityId: objectId,
    action: "ADD_PARTICIPANT",
    userId: user.id,
    after: toAuditValue(participant)
  });

  redirect(`/objects/${objectId}?participantSaved=1`);
}

export async function updateProjectObjectParticipantAction(
  objectId: string,
  participantId: string,
  _prevState: ProjectObjectParticipantActionState,
  formData: FormData
) {
  const user = await getCurrentUser();

  if (!user) {
    return { message: "Необходима авторизация" };
  }

  const [object, before] = await Promise.all([
    prisma.projectObject.findUnique({ where: { id: objectId } }),
    prisma.projectObjectParticipant.findUnique({ where: { id: participantId } })
  ]);

  if (!object || !before || before.objectId !== objectId || !canManageObjectParticipants(user, object)) {
    return { message: "Недостаточно прав для редактирования участника" };
  }

  const parsed = parseParticipantForm(formData);

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const after = await prisma.projectObjectParticipant.update({
    where: { id: participantId },
    data: toParticipantDocument(parsed.data)
  });

  await writeAuditLog({
    entityType: "OBJECT",
    entityId: objectId,
    action: "UPDATE_PARTICIPANT",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  redirect(`/objects/${objectId}?participantSaved=1`);
}

export async function archiveProjectObjectParticipantAction(objectId: string, participantId: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [object, before] = await Promise.all([
    prisma.projectObject.findUnique({ where: { id: objectId } }),
    prisma.projectObjectParticipant.findUnique({ where: { id: participantId } })
  ]);

  if (!object || !before || before.objectId !== objectId || !canManageObjectParticipants(user, object)) {
    redirect(`/objects/${objectId}?error=participant`);
  }

  const after = await prisma.projectObjectParticipant.update({
    where: { id: participantId },
    data: { archivedAt: new Date() }
  });

  await writeAuditLog({
    entityType: "OBJECT",
    entityId: objectId,
    action: "ARCHIVE_PARTICIPANT",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  redirect(`/objects/${objectId}?participantArchived=1`);
}

export async function moveDesignerToFirstObjectReceivedAction(objectId: string) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const object = await prisma.projectObject.findUnique({
    where: { id: objectId },
    include: { designer: true }
  });

  if (!object || !object.designer || !canEditRecord(user, object)) {
    redirect(`/objects/${objectId}?error=designerStage`);
  }

  const beforeStage = object.designer.relationshipStage;
  await prisma.designer.update({
    where: { id: object.designer.id },
    data: { relationshipStage: "FIRST_OBJECT_RECEIVED" }
  });

  await writeAuditLog({
    entityType: "DESIGNER",
    entityId: object.designer.id,
    action: "CHANGE_RELATIONSHIP_STAGE",
    userId: user.id,
    before: { relationshipStage: beforeStage },
    after: { relationshipStage: "FIRST_OBJECT_RECEIVED" }
  });

  await syncDesignerDiscipline(object.designer.id, user.id);

  redirect(`/objects/${objectId}?designerStage=1`);
}
