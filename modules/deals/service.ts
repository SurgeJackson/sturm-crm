import type { Deal, DealLossReason, DealStage } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog, writeTrackedFieldAuditLogs, type TrackedAuditField } from "@/modules/crm/audit-helpers";
import { expireViolationsForEntity, syncDealDiscipline } from "@/modules/crm-discipline/service";
import { closedAtForStage, toDealDocument, type DealFormData } from "@/modules/deals/form";

export function getObjectForDeal(objectId: string) {
  return prisma.projectObject.findUnique({
    where: { id: objectId },
    select: { id: true, clientId: true, designerId: true }
  });
}

export function dealTrackedFields(before: Deal, after: Deal): readonly TrackedAuditField[] {
  return [
    ["responsibleId", "CHANGE_RESPONSIBLE", before.responsibleId, after.responsibleId],
    ["stage", "CHANGE_STAGE", before.stage, after.stage],
    ["potentialAmount", "CHANGE_AMOUNT", before.potentialAmount, after.potentialAmount],
    ["probability", "CHANGE_PROBABILITY", before.probability, after.probability],
    ["nextActionText", "CHANGE_NEXT_ACTION", before.nextActionText, after.nextActionText],
    ["nextActionAt", "CHANGE_NEXT_ACTION", before.nextActionAt?.toISOString?.(), after.nextActionAt?.toISOString?.()],
    ["lossReason", "SET_LOSS_REASON", before.lossReason, after.lossReason]
  ] as const;
}

export function dealStatusAuditEvents(before: Pick<Deal, "stage">, after: Pick<Deal, "stage" | "lossReason">) {
  return [
    ...(before.stage !== "LOST" && after.stage === "LOST"
      ? [{
          action: "MARK_LOST",
          before: { stage: before.stage },
          after: { stage: after.stage, lossReason: after.lossReason }
        }]
      : []),
    ...(before.stage !== "COMPLETED" && after.stage === "COMPLETED"
      ? [{
          action: "MARK_COMPLETED",
          before: { stage: before.stage },
          after: { stage: after.stage }
        }]
      : [])
  ];
}

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

export async function archiveDeal(id: string, before: Deal, userId: string) {
  const after = await prisma.$transaction(async (tx) => {
    const archived = await tx.deal.update({
      where: { id },
      data: { archivedAt: new Date() }
    });

    await writeEntityAuditLog({
      entityType: "DEAL",
      entityId: id,
      action: "ARCHIVE",
      userId,
      before,
      after: archived,
      client: tx
    });

    return archived;
  });

  await expireViolationsForEntity("DEAL", id, userId);
  return after;
}

export async function changeDealStage(
  id: string,
  before: Deal,
  stage: DealStage,
  userId: string
) {
  await prisma.$transaction(async (tx) => {
    const updated = await tx.deal.update({
      where: { id },
      data: {
        stage,
        closedAt: closedAtForStage(stage, before.closedAt),
        nextActionAt: stage === "LOST" || stage === "COMPLETED" ? null : before.nextActionAt,
        nextActionText: stage === "LOST" || stage === "COMPLETED" ? null : before.nextActionText
      }
    });

    await writeEntityAuditLog({
      entityType: "DEAL",
      entityId: id,
      action: stage === "COMPLETED" ? "MARK_COMPLETED" : "CHANGE_STAGE",
      userId,
      before: { stage: before.stage },
      after: { stage: updated.stage },
      client: tx
    });
  });

  await syncDealDiscipline(id, userId);
}

export async function markDealAsLost(
  id: string,
  before: Deal,
  lossReason: DealLossReason,
  lossComment: string | null,
  userId: string
) {
  await prisma.$transaction(async (tx) => {
    const after = await tx.deal.update({
      where: { id },
      data: {
        stage: "LOST",
        lossReason,
        lossComment: lossComment || null,
        closedAt: before.closedAt ?? new Date(),
        nextActionAt: null,
        nextActionText: null
      }
    });

    await writeEntityAuditLog({
      entityType: "DEAL",
      entityId: id,
      action: "MARK_LOST",
      userId,
      before,
      after,
      client: tx
    });

    await writeEntityAuditLog({
      entityType: "DEAL",
      entityId: id,
      action: "SET_LOSS_REASON",
      userId,
      before: { lossReason: before.lossReason },
      after: { lossReason },
      client: tx
    });
  });

  await syncDealDiscipline(id, userId);
}
