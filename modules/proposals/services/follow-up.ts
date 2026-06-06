import type { CommercialProposal } from "@/generated/prisma/client";
import { createAutomaticTask } from "@/modules/tasks/service";

export async function createProposalFollowUpTask(proposal: CommercialProposal) {
  if (proposal.status !== "SENT" || !proposal.nextTouchAt) return;

  return createAutomaticTask({
    title: `Связаться по КП ${proposal.proposalNumber}`,
    description: `Follow-up по КП ${proposal.proposalNumber}`,
    notes: `Follow-up по КП ${proposal.proposalNumber}`,
    responsibleId: proposal.responsibleId,
    createdById: proposal.createdById,
    dueAt: proposal.nextTouchAt,
    autoRule: "PROPOSAL_FOLLOW_UP",
    priority: "HIGH",
    clientId: proposal.clientId,
    designerId: proposal.designerId,
    objectId: proposal.objectId,
    dealId: proposal.dealId,
    proposalId: proposal.id
  });
}
