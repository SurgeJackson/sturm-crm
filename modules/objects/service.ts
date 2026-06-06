import type { DesignerRelationshipStage, Prisma, PrismaClient, ProjectObject } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { daysFromNow } from "@/modules/crm/date-ranges";
import { closedTaskStatuses } from "@/modules/crm/domain-constants";
import { toAuditValue } from "@/modules/crm/form-utils";
import { writeEntityAuditLog, writeTrackedFieldAuditLogs } from "@/modules/crm/audit-helpers";
import { expireViolationsForEntity, syncDesignerDiscipline, syncObjectDiscipline } from "@/modules/crm-discipline/service";
import { toObjectDocument, type ObjectFormData } from "@/modules/objects/form";

type ObjectServiceClient = PrismaClient | Prisma.TransactionClient;

export async function validateObjectRelations(data: Pick<ObjectFormData, "clientId" | "designerId">) {
  const [client, designer] = await Promise.all([
    prisma.client.findUnique({ where: { id: data.clientId }, select: { id: true } }),
    data.designerId
      ? prisma.designer.findUnique({ where: { id: data.designerId }, select: { id: true } })
      : null
  ]);

  if (!client) return { ok: false as const, message: "Укажите клиента или заказчика объекта" };
  if (data.designerId && !designer) return { ok: false as const, message: "Выбранный дизайнер не найден" };
  return { ok: true as const };
}

export function isFrozenObjectTransition(
  before: Pick<ProjectObject, "stage" | "status">,
  after: Pick<ProjectObject, "stage" | "status">
) {
  return (
    (after.status === "FROZEN" || after.stage === "FROZEN") &&
    before.status !== "FROZEN" &&
    before.stage !== "FROZEN"
  );
}

export async function refreshDesignerObjectCounters(designerId?: string | null, client: ObjectServiceClient = prisma) {
  if (!designerId) return;

  const [transferredObjectsCount, activeObjectsCount] = await Promise.all([
    client.projectObject.count({ where: { designerId, archivedAt: null } }),
    client.projectObject.count({ where: { designerId, archivedAt: null, status: "ACTIVE" } })
  ]);

  await client.designer.update({
    where: { id: designerId },
    data: { transferredObjectsCount, activeObjectsCount }
  });
}

export async function refreshDesignerCountersForChange(
  beforeDesignerId?: string | null,
  afterDesignerId?: string | null,
  client: ObjectServiceClient = prisma
) {
  const ids = Array.from(new Set([beforeDesignerId, afterDesignerId].filter(Boolean)));
  for (const id of ids) {
    await refreshDesignerObjectCounters(id, client);
  }
}

export async function createProjectObject(data: ObjectFormData, responsibleId: string, userId: string) {
  const object = await prisma.$transaction(async (tx) => {
    const created = await tx.projectObject.create({
      data: {
        ...toObjectDocument(data, responsibleId),
        createdById: userId
      }
    });

    await refreshDesignerObjectCounters(created.designerId, tx);

    await writeEntityAuditLog({
      entityType: "OBJECT",
      entityId: created.id,
      action: "CREATE",
      userId,
      after: created,
      client: tx
    });

    return created;
  });

  await syncObjectDiscipline(object.id, userId);
  return object;
}

export async function updateProjectObject(
  id: string,
  before: ProjectObject,
  data: ObjectFormData,
  responsibleId: string,
  userId: string
) {
  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.projectObject.update({
      where: { id },
      data: toObjectDocument(data, responsibleId)
    });

    await refreshDesignerCountersForChange(before.designerId, updated.designerId, tx);

    await writeEntityAuditLog({
      entityType: "OBJECT",
      entityId: id,
      action: "UPDATE",
      userId,
      before,
      after: updated,
      client: tx
    });

    await writeTrackedFieldAuditLogs({
      entityType: "OBJECT",
      entityId: id,
      userId,
      client: tx,
      fields: [
        ["responsibleId", "CHANGE_RESPONSIBLE", before.responsibleId, updated.responsibleId],
        ["stage", "CHANGE_STAGE", before.stage, updated.stage],
        ["status", "CHANGE_STATUS", before.status, updated.status],
        ["clientId", "CHANGE_CLIENT", before.clientId, updated.clientId],
        ["designerId", "CHANGE_DESIGNER", before.designerId, updated.designerId]
      ]
    });

    return updated;
  });

  if (isFrozenObjectTransition(before, after)) {
    await createFrozenObjectReturnTask(after, userId);
  }

  await syncObjectDiscipline(id, userId);
  return after;
}

export async function archiveProjectObject(id: string, before: ProjectObject, userId: string) {
  const after = await prisma.$transaction(async (tx) => {
    const archived = await tx.projectObject.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date()
      }
    });

    await refreshDesignerObjectCounters(archived.designerId, tx);

    await writeEntityAuditLog({
      entityType: "OBJECT",
      entityId: id,
      action: "ARCHIVE",
      userId,
      before,
      after: archived,
      client: tx
    });

    return archived;
  });

  await expireViolationsForEntity("OBJECT", id, userId);
  return after;
}

export async function moveDesignerToFirstObjectReceived(
  object: ProjectObject & { designer: { id: string; relationshipStage: DesignerRelationshipStage } | null },
  userId: string
) {
  if (!object.designer) return null;

  await prisma.$transaction(async (tx) => {
    const beforeStage = object.designer?.relationshipStage;

    await tx.designer.update({
      where: { id: object.designer!.id },
      data: { relationshipStage: "FIRST_OBJECT_RECEIVED" }
    });

    await writeEntityAuditLog({
      entityType: "DESIGNER",
      entityId: object.designer!.id,
      action: "CHANGE_RELATIONSHIP_STAGE",
      userId,
      before: { relationshipStage: beforeStage },
      after: { relationshipStage: "FIRST_OBJECT_RECEIVED" },
      client: tx
    });
  });

  await syncDesignerDiscipline(object.designer.id, userId);
  return object.designer.id;
}

export async function createFrozenObjectReturnTask(object: {
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
      status: { notIn: closedTaskStatuses }
    },
    select: { id: true }
  });
  if (existing) return;

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
      dueAt: daysFromNow(30),
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
