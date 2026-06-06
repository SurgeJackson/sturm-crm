import type { Designer, DesignerRelationshipStage } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog, writeTrackedFieldAuditLogs, type TrackedAuditField } from "@/modules/crm/audit-helpers";
import { expireViolationsForEntity, syncDesignerDiscipline } from "@/modules/crm-discipline/service";
import { toDesignerDocument, type DesignerFormData } from "@/modules/designers/form";

export function getDesignerForMutation(id: string) {
  return prisma.designer.findUnique({ where: { id } });
}

export function designerTrackedFields(before: Designer, after: Designer): readonly TrackedAuditField[] {
  return [
    ["responsibleId", "CHANGE_RESPONSIBLE", before.responsibleId, after.responsibleId],
    ["relationshipStage", "CHANGE_RELATIONSHIP_STAGE", before.relationshipStage, after.relationshipStage],
    ["potential", "CHANGE_POTENTIAL", before.potential, after.potential],
    ["loyalty", "CHANGE_LOYALTY", before.loyalty, after.loyalty],
    ["nextStepText", "CHANGE_NEXT_STEP", before.nextStepText, after.nextStepText],
    ["nextStepAt", "CHANGE_NEXT_STEP", before.nextStepAt?.toISOString?.(), after.nextStepAt?.toISOString?.()]
  ] as const;
}

export async function createDesigner(data: DesignerFormData, responsibleId: string, userId: string) {
  const designer = await prisma.$transaction(async (tx) => {
    const created = await tx.designer.create({
      data: {
        ...toDesignerDocument(data, responsibleId),
        transferredObjectsCount: 0,
        activeObjectsCount: 0,
        proposalsTotalAmount: 0,
        paymentsTotalAmount: 0,
        createdById: userId,
        archivedAt: null
      }
    });

    await writeEntityAuditLog({
      entityType: "DESIGNER",
      entityId: created.id,
      action: "CREATE",
      userId,
      after: created,
      client: tx
    });

    return created;
  });

  await syncDesignerDiscipline(designer.id, userId);
  return designer;
}

export async function updateDesigner(
  id: string,
  before: Designer,
  data: DesignerFormData,
  responsibleId: string,
  userId: string
) {
  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.designer.update({
      where: { id },
      data: toDesignerDocument(data, responsibleId)
    });

    await writeEntityAuditLog({
      entityType: "DESIGNER",
      entityId: id,
      action: "UPDATE",
      userId,
      before,
      after: updated,
      client: tx
    });

    await writeTrackedFieldAuditLogs({
      entityType: "DESIGNER",
      entityId: id,
      userId,
      client: tx,
      fields: designerTrackedFields(before, updated)
    });

    return updated;
  });

  await syncDesignerDiscipline(id, userId);
  return after;
}

export async function archiveDesigner(id: string, before: Designer, userId: string) {
  const after = await prisma.$transaction(async (tx) => {
    const archived = await tx.designer.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        updatedAt: new Date()
      }
    });

    await writeEntityAuditLog({
      entityType: "DESIGNER",
      entityId: id,
      action: "ARCHIVE",
      userId,
      before,
      after: archived,
      client: tx
    });

    return archived;
  });

  await expireViolationsForEntity("DESIGNER", id, userId);
  return after;
}

export async function changeDesignerStage(
  id: string,
  before: Designer,
  stage: DesignerRelationshipStage,
  userId: string
) {
  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.designer.update({
      where: { id },
      data: { relationshipStage: stage }
    });

    await writeEntityAuditLog({
      entityType: "DESIGNER",
      entityId: id,
      action: "CHANGE_RELATIONSHIP_STAGE",
      userId,
      before: { relationshipStage: before.relationshipStage },
      after: { relationshipStage: updated.relationshipStage },
      client: tx
    });

    return updated;
  });

  await syncDesignerDiscipline(id, userId);
  return after;
}
