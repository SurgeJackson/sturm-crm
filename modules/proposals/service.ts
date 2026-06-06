import type { CommercialProposal } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { syncTaskDiscipline } from "@/modules/crm-discipline/service";

export async function generateProposalNumber(now = new Date()) {
  const year = now.getFullYear();
  const prefix = `КП-${year}-`;
  const latest = await prisma.commercialProposal.findFirst({
    where: { proposalNumber: { startsWith: prefix } },
    orderBy: { proposalNumber: "desc" },
    select: { proposalNumber: true }
  });
  const nextNumber = latest ? Number(latest.proposalNumber.replace(prefix, "")) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

export async function getDealForProposal(dealId: string) {
  return prisma.deal.findUnique({
    where: { id: dealId },
    select: {
      id: true,
      clientId: true,
      objectId: true,
      designerId: true,
      responsibleId: true
    }
  });
}

export async function createProposalFollowUpTask(proposal: CommercialProposal) {
  if (proposal.status !== "SENT" || !proposal.nextTouchAt) return;

  const existing = await prisma.taskActivity.findFirst({
    where: {
      proposalId: proposal.id,
      autoRule: "PROPOSAL_FOLLOW_UP",
      archivedAt: null
    },
    select: { id: true }
  });

  if (existing) return;

  const task = await prisma.taskActivity.create({
    data: {
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: `Связаться по КП ${proposal.proposalNumber}`,
      status: "NEW",
      priority: "HIGH",
      objectId: proposal.objectId,
      dealId: proposal.dealId,
      proposalId: proposal.id,
      clientId: proposal.clientId,
      designerId: proposal.designerId,
      dueAt: proposal.nextTouchAt,
      responsibleId: proposal.responsibleId,
      createdById: proposal.createdById,
      isAutoCreated: true,
      autoRule: "PROPOSAL_FOLLOW_UP",
      description: `Follow-up по КП ${proposal.proposalNumber}`,
      notes: `Follow-up по КП ${proposal.proposalNumber}`
    }
  });

  await syncTaskDiscipline(task.id, proposal.createdById);
}
