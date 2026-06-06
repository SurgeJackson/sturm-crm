"use server";

import { redirect } from "next/navigation";
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
import { writeTrackedFieldAuditLogs } from "@/modules/crm/audit-helpers";
import { toAuditValue } from "@/modules/crm/form-utils";
import { expireViolationsForEntity, syncDesignerDiscipline, syncObjectDiscipline } from "@/modules/crm-discipline/service";
import {
  parseObjectForm,
  parseParticipantForm,
  toObjectDocument,
  toParticipantDocument
} from "@/modules/objects/form";
import {
  createFrozenObjectReturnTask,
  refreshDesignerCountersForChange,
  refreshDesignerObjectCounters
} from "@/modules/objects/service";

export type ProjectObjectActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export type ProjectObjectParticipantActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

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

  await writeTrackedFieldAuditLogs({
    entityType: "OBJECT",
    entityId: id,
    userId: user.id,
    fields: trackedFields
  });

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
