import type { ProjectObjectParticipant } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog } from "@/modules/crm/audit-helpers";
import { toParticipantDocument, type ParticipantFormData } from "@/modules/objects/form";

export function getProjectObjectParticipantForMutation(id: string) {
  return prisma.projectObjectParticipant.findUnique({ where: { id } });
}

export async function createProjectObjectParticipant(objectId: string, data: ParticipantFormData, userId: string) {
  return prisma.$transaction(async (tx) => {
    const participant = await tx.projectObjectParticipant.create({
      data: {
        ...toParticipantDocument(data),
        objectId,
        createdById: userId
      }
    });

    await writeEntityAuditLog({
      entityType: "OBJECT",
      entityId: objectId,
      action: "ADD_PARTICIPANT",
      userId,
      after: participant,
      client: tx
    });

    return participant;
  });
}

export async function updateProjectObjectParticipant(
  objectId: string,
  participantId: string,
  before: ProjectObjectParticipant,
  data: ParticipantFormData,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const after = await tx.projectObjectParticipant.update({
      where: { id: participantId },
      data: toParticipantDocument(data)
    });

    await writeEntityAuditLog({
      entityType: "OBJECT",
      entityId: objectId,
      action: "UPDATE_PARTICIPANT",
      userId,
      before,
      after,
      client: tx
    });

    return after;
  });
}

export async function archiveProjectObjectParticipant(
  objectId: string,
  participantId: string,
  before: ProjectObjectParticipant,
  userId: string
) {
  return prisma.$transaction(async (tx) => {
    const after = await tx.projectObjectParticipant.update({
      where: { id: participantId },
      data: { archivedAt: new Date() }
    });

    await writeEntityAuditLog({
      entityType: "OBJECT",
      entityId: objectId,
      action: "ARCHIVE_PARTICIPANT",
      userId,
      before,
      after,
      client: tx
    });

    return after;
  });
}
