import type { Deal } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog, writeTrackedFieldAuditLogs } from "@/modules/crm/audit-helpers";
import { syncDealDiscipline } from "@/modules/crm-discipline/entity-sync";
import { toDealDocument, type DealFormData } from "@/modules/deals/form";
import { dealStatusAuditEvents, dealTrackedFields } from "@/modules/deals/services/audit";

export async function createDeal(
  data: DealFormData,
  object: { clientId: string; designerId: string | null },
  responsibleId: string,
  userId: string,
  lockFinancial: boolean
) {
  const deal = await prisma.$transaction(async (tx) => {
    const created = await tx.deal.create({
      data: {
        ...toDealDocument(data, object, responsibleId, null, lockFinancial),
        createdById: userId
      }
    });

    await writeEntityAuditLog({
      entityType: "DEAL",
      entityId: created.id,
      action: "CREATE",
      userId,
      after: created,
      client: tx
    });

    return created;
  });

  await syncDealDiscipline(deal.id, userId);
  return deal;
}

export async function updateDeal(
  id: string,
  before: Deal,
  data: DealFormData,
  object: { clientId: string; designerId: string | null },
  responsibleId: string,
  userId: string,
  lockFinancial: boolean
) {
  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.deal.update({
      where: { id },
      data: toDealDocument(
        data,
        object,
        responsibleId,
        before.closedAt,
        lockFinancial,
        {
          potentialAmount: before.potentialAmount,
          probability: before.probability
        }
      )
    });

    await writeEntityAuditLog({
      entityType: "DEAL",
      entityId: id,
      action: "UPDATE",
      userId,
      before,
      after: updated,
      client: tx
    });

    await writeTrackedFieldAuditLogs({
      entityType: "DEAL",
      entityId: id,
      userId,
      fields: dealTrackedFields(before, updated),
      client: tx
    });

    for (const event of dealStatusAuditEvents(before, updated)) {
      await writeEntityAuditLog({
        entityType: "DEAL",
        entityId: id,
        action: event.action,
        userId,
        before: event.before,
        after: event.after,
        client: tx
      });
    }

    return updated;
  });

  await syncDealDiscipline(id, userId);
  return after;
}
