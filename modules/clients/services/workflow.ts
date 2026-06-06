import type { Client } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog, writeTrackedFieldAuditLogs } from "@/modules/crm/audit-helpers";
import { expireViolationsForEntity, syncClientDiscipline } from "@/modules/crm-discipline/service";
import { toClientDocument, type ClientFormData } from "@/modules/clients/form";
import { clientTrackedFields } from "@/modules/clients/services/audit";

export async function createClient(data: ClientFormData, responsibleId: string, userId: string) {
  const client = await prisma.$transaction(async (tx) => {
    const created = await tx.client.create({
      data: {
        ...toClientDocument(data, responsibleId),
        createdById: userId,
        archivedAt: data.status === "ARCHIVED" ? new Date() : null
      }
    });

    await writeEntityAuditLog({
      entityType: "CLIENT",
      entityId: created.id,
      action: "CREATE",
      userId,
      after: created,
      client: tx
    });

    return created;
  });

  await syncClientDiscipline(client.id, userId);
  return client;
}

export async function updateClient(id: string, before: Client, data: ClientFormData, responsibleId: string, userId: string) {
  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.client.update({
      where: { id },
      data: toClientDocument(data, responsibleId)
    });

    await writeEntityAuditLog({
      entityType: "CLIENT",
      entityId: id,
      action: "UPDATE",
      userId,
      before,
      after: updated,
      client: tx
    });

    await writeTrackedFieldAuditLogs({
      entityType: "CLIENT",
      entityId: id,
      userId,
      client: tx,
      fields: clientTrackedFields(before, updated)
    });

    return updated;
  });

  await syncClientDiscipline(id, userId);
  return after;
}

export async function archiveClient(id: string, before: Client, userId: string) {
  const after = await prisma.$transaction(async (tx) => {
    const archived = await tx.client.update({
      where: { id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        updatedAt: new Date()
      }
    });

    await writeEntityAuditLog({
      entityType: "CLIENT",
      entityId: id,
      action: "ARCHIVE",
      userId,
      before,
      after: archived,
      client: tx
    });

    return archived;
  });

  await expireViolationsForEntity("CLIENT", id, userId);
  return after;
}
