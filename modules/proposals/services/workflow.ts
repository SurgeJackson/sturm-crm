import type { CommercialProposal } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog, writeTrackedFieldAuditLogs } from "@/modules/crm/audit-helpers";
import { expireViolationsForEntity, syncProposalDiscipline } from "@/modules/crm-discipline/service";
import { toProposalDocument, type ProposalFileData, type ProposalFormData } from "@/modules/proposals/form";
import { proposalStatusAuditEvents, proposalTrackedFields } from "@/modules/proposals/services/audit";
import { createProposalFollowUpTask } from "@/modules/proposals/services/follow-up";

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
