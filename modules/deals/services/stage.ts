import type { Deal, DealLossReason, DealStage } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog } from "@/modules/crm/audit-helpers";
import { syncDealDiscipline } from "@/modules/crm-discipline/entity-sync";
import { closedAtForStage } from "@/modules/deals/form";

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
