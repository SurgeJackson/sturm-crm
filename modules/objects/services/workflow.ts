import type { ProjectObject } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog, writeTrackedFieldAuditLogs } from "@/modules/crm/audit-helpers";
import { expireViolationsForEntity, syncObjectDiscipline } from "@/modules/crm-discipline/service";
import { toObjectDocument, type ObjectFormData } from "@/modules/objects/form";
import { createFrozenObjectReturnTask } from "@/modules/objects/services/automatic-tasks";
import {
  refreshDesignerCountersForChange,
  refreshDesignerObjectCounters
} from "@/modules/objects/services/designer-counters";
import { isFrozenObjectTransition } from "@/modules/objects/services/transitions";

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
