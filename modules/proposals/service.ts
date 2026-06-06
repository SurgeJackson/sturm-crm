import type { CommercialProposal, DealStage } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog } from "@/modules/crm/audit-helpers";
import { syncDealDiscipline, syncProposalDiscipline, syncTaskDiscipline } from "@/modules/crm-discipline/service";

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

export function proposalVersionDocument(
  source: CommercialProposal,
  proposalNumber: string,
  nextVersion: number,
  rootId: string,
  userId: string
) {
  return {
    proposalNumber,
    dealId: source.dealId,
    clientId: source.clientId,
    objectId: source.objectId,
    designerId: source.designerId,
    responsibleId: source.responsibleId,
    version: nextVersion,
    parentProposalId: rootId,
    amount: source.amount,
    discountPercent: source.discountPercent,
    discountAmount: source.discountAmount,
    status: "DRAFT" as const,
    recipientType: source.recipientType,
    recipientName: source.recipientName,
    recipientContact: source.recipientContact,
    approvalRequiredFrom: source.approvalRequiredFrom,
    sentAt: null,
    nextTouchAt: source.nextTouchAt,
    fileUrl: source.fileUrl,
    fileName: source.fileName,
    fileSize: source.fileSize,
    fileMimeType: source.fileMimeType,
    uploadedById: source.uploadedById,
    uploadedAt: source.uploadedAt,
    declineReason: null,
    declineComment: null,
    comment: source.comment,
    createdById: userId,
    notes: source.notes
  };
}

export async function createProposalVersion(source: CommercialProposal, userId: string) {
  const rootId = source.parentProposalId ?? source.id;
  const latest = await prisma.commercialProposal.findFirst({
    where: { OR: [{ id: rootId }, { parentProposalId: rootId }] },
    orderBy: { version: "desc" },
    select: { version: true }
  });
  const proposalNumber = await generateProposalNumber();
  const nextVersion = (latest?.version ?? source.version) + 1;

  const newProposal = await prisma.$transaction(async (tx) => {
    const created = await tx.commercialProposal.create({
      data: proposalVersionDocument(source, proposalNumber, nextVersion, rootId, userId)
    });

    await tx.commercialProposal.update({
      where: { id: source.id },
      data: { status: "NEW_VERSION_CREATED" }
    });

    await writeEntityAuditLog({
      entityType: "PROPOSAL",
      entityId: source.id,
      action: "CREATE_VERSION",
      userId,
      before: { id: source.id, version: source.version },
      after: { id: created.id, version: created.version },
      client: tx
    });

    await writeEntityAuditLog({
      entityType: "PROPOSAL",
      entityId: created.id,
      action: "CREATE",
      userId,
      after: created,
      client: tx
    });

    return created;
  });

  await syncProposalDiscipline(source.id, userId);
  await syncProposalDiscipline(newProposal.id, userId);

  return newProposal;
}

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
