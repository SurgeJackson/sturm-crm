import type { CommercialProposal, DealStage } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog, writeTrackedFieldAuditLogs, type TrackedAuditField } from "@/modules/crm/audit-helpers";
import { expireViolationsForEntity, syncDealDiscipline, syncProposalDiscipline, syncTaskDiscipline } from "@/modules/crm-discipline/service";
import { toProposalDocument, type ProposalFileData, type ProposalFormData } from "@/modules/proposals/form";

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

export function proposalTrackedFields(before: CommercialProposal, after: CommercialProposal): readonly TrackedAuditField[] {
  return [
    ["status", "CHANGE_STATUS", before.status, after.status],
    ["amount", "CHANGE_AMOUNT", before.amount, after.amount],
    ["discountPercent", "CHANGE_DISCOUNT", before.discountPercent, after.discountPercent],
    ["discountAmount", "CHANGE_DISCOUNT", before.discountAmount, after.discountAmount],
    ["nextTouchAt", "CHANGE_NEXT_TOUCH", before.nextTouchAt?.toISOString?.(), after.nextTouchAt?.toISOString?.()],
    ["declineReason", "DECLINE", before.declineReason, after.declineReason]
  ] as const;
}

export function proposalStatusAuditEvents(before: Pick<CommercialProposal, "status">, after: Pick<CommercialProposal, "status">) {
  return before.status !== "ACCEPTED" && after.status === "ACCEPTED"
    ? [{
        action: "ACCEPT",
        before: { status: before.status },
        after: { status: after.status }
      }]
    : [];
}

export async function createProposal(input: {
  data: ProposalFormData;
  deal: { clientId: string; objectId: string; designerId: string | null; responsibleId: string };
  responsibleId: string;
  proposalNumber: string;
  userId: string;
  fileData?: ProposalFileData;
}) {
  const proposal = await prisma.$transaction(async (tx) => {
    const created = await tx.commercialProposal.create({
      data: {
        ...toProposalDocument(input.data, input.deal, input.responsibleId, null, input.fileData),
        proposalNumber: input.proposalNumber,
        version: 1,
        parentProposalId: null,
        createdById: input.userId
      }
    });

    await writeEntityAuditLog({
      entityType: "PROPOSAL",
      entityId: created.id,
      action: "CREATE",
      userId: input.userId,
      after: created,
      client: tx
    });

    if (input.fileData) {
      await writeEntityAuditLog({
        entityType: "PROPOSAL",
        entityId: created.id,
        action: "UPLOAD_FILE",
        userId: input.userId,
        after: input.fileData,
        client: tx
      });
    }

    return created;
  });

  if (proposal.status === "SENT") await createProposalFollowUpTask(proposal);
  await syncProposalDiscipline(proposal.id, input.userId);

  return proposal;
}

export async function updateProposal(input: {
  id: string;
  before: CommercialProposal;
  data: ProposalFormData;
  deal: { clientId: string; objectId: string; designerId: string | null; responsibleId: string };
  responsibleId: string;
  userId: string;
  fileData?: ProposalFileData;
  lockFinancial: boolean;
}) {
  const document = toProposalDocument(
    input.data,
    input.deal,
    input.responsibleId,
    input.before,
    input.fileData,
    input.lockFinancial
  );

  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.commercialProposal.update({
      where: { id: input.id },
      data: document
    });

    await writeEntityAuditLog({
      entityType: "PROPOSAL",
      entityId: input.id,
      action: "UPDATE",
      userId: input.userId,
      before: input.before,
      after: updated,
      client: tx
    });

    await writeTrackedFieldAuditLogs({
      entityType: "PROPOSAL",
      entityId: input.id,
      userId: input.userId,
      fields: proposalTrackedFields(input.before, updated),
      client: tx
    });

    if (input.fileData) {
      await writeEntityAuditLog({
        entityType: "PROPOSAL",
        entityId: input.id,
        action: "UPLOAD_FILE",
        userId: input.userId,
        after: input.fileData,
        client: tx
      });
    }

    for (const event of proposalStatusAuditEvents(input.before, updated)) {
      await writeEntityAuditLog({
        entityType: "PROPOSAL",
        entityId: input.id,
        action: event.action,
        userId: input.userId,
        before: event.before,
        after: event.after,
        client: tx
      });
    }

    return updated;
  });

  if (input.before.status !== "SENT" && after.status === "SENT") await createProposalFollowUpTask(after);
  await syncProposalDiscipline(input.id, input.userId);

  return after;
}

export async function archiveProposal(id: string, before: CommercialProposal, userId: string) {
  const after = await prisma.$transaction(async (tx) => {
    const archived = await tx.commercialProposal.update({
      where: { id },
      data: { status: "ARCHIVED", archivedAt: new Date() }
    });

    await writeEntityAuditLog({
      entityType: "PROPOSAL",
      entityId: id,
      action: "ARCHIVE",
      userId,
      before,
      after: archived,
      client: tx
    });

    return archived;
  });

  await expireViolationsForEntity("PROPOSAL", id, userId);
  return after;
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
