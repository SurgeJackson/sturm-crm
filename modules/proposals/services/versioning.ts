import type { CommercialProposal } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog } from "@/modules/crm/audit-helpers";
import { syncProposalDiscipline } from "@/modules/crm-discipline/service";
import { reserveProposalNumber } from "@/modules/proposals/services/numbering";

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

  const newProposal = await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${rootId}))`;

    const latest = await tx.commercialProposal.findFirst({
      where: { OR: [{ id: rootId }, { parentProposalId: rootId }] },
      orderBy: { version: "desc" },
      select: { version: true }
    });
    const proposalNumber = await reserveProposalNumber(tx);
    const nextVersion = (latest?.version ?? source.version) + 1;

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
