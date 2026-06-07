import type { CommercialProposal, DealStage } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog } from "@/modules/crm/audit-helpers";
import { syncDealDiscipline } from "@/modules/crm-discipline/entity-sync";

export async function moveDealToInvoiceFromProposal(
  proposal: CommercialProposal & { deal: { stage: DealStage } },
  userId: string
) {
  const beforeStage = proposal.deal.stage;

  await prisma.$transaction(async (tx) => {
    await tx.deal.update({
      where: { id: proposal.dealId },
      data: { stage: "INVOICE_OR_ORDER" }
    });

    await writeEntityAuditLog({
      entityType: "DEAL",
      entityId: proposal.dealId,
      action: "CHANGE_STAGE_FROM_ACCEPTED_PROPOSAL",
      userId,
      before: { stage: beforeStage, proposalId: proposal.id },
      after: { stage: "INVOICE_OR_ORDER", proposalId: proposal.id },
      client: tx
    });
  });

  await syncDealDiscipline(proposal.dealId, userId);
}
