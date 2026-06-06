"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import {
  canArchiveRecord,
  canChangeProposalFinancials,
  canChangeProposalResponsible,
  canChangeProposalStatus,
  canCreateProposal,
  canEditRecord
} from "@/permissions";
import { writeEntityAuditLog, writeTrackedFieldAuditLogs } from "@/modules/crm/audit-helpers";
import { expireViolationsForEntity, syncProposalDiscipline } from "@/modules/crm-discipline/service";
import {
  ensureSentRequirements,
  parseProposalForm,
  toProposalDocument
} from "@/modules/proposals/form";
import { getProposalFile, saveProposalFile } from "@/modules/proposals/files";
import {
  createProposalFollowUpTask,
  createProposalVersion,
  generateProposalNumber,
  getDealForProposal,
  moveDealToInvoiceFromProposal
} from "@/modules/proposals/service";

export type ProposalActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createProposalAction(_prevState: ProposalActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !canCreateProposal(user)) return { message: "Недостаточно прав для создания КП" };

  const parsed = parseProposalForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const deal = await getDealForProposal(parsed.data.dealId);
  if (!deal) return { message: "Укажите сделку КП" };

  const file = getProposalFile(formData);
  let fileData: Awaited<ReturnType<typeof saveProposalFile>> | undefined;
  try {
    fileData = file ? await saveProposalFile(file, user.id) : undefined;
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Не удалось загрузить файл КП" };
  }

  const responsibleId = canChangeProposalResponsible(user) ? parsed.data.responsibleId : deal.responsibleId;
  const proposalNumber = await generateProposalNumber();
  const document = toProposalDocument(parsed.data, deal, responsibleId, null, fileData);
  const sentError = await ensureSentRequirements(document.status, document.fileUrl, parsed.data);
  if (sentError) return { message: sentError };

  const proposal = await prisma.commercialProposal.create({
    data: {
      ...document,
      proposalNumber,
      version: 1,
      parentProposalId: null,
      createdById: user.id
    }
  });

  if (proposal.status === "SENT") await createProposalFollowUpTask(proposal);

  await writeEntityAuditLog({
    entityType: "PROPOSAL",
    entityId: proposal.id,
    action: "CREATE",
    userId: user.id,
    after: proposal
  });

  if (fileData) {
    await writeEntityAuditLog({
      entityType: "PROPOSAL",
      entityId: proposal.id,
      action: "UPLOAD_FILE",
      userId: user.id,
      after: fileData
    });
  }

  await syncProposalDiscipline(proposal.id, user.id);

  redirect(`/proposals/${proposal.id}?saved=1`);
}

export async function updateProposalAction(id: string, _prevState: ProposalActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { message: "Необходима авторизация" };

  const before = await prisma.commercialProposal.findUnique({ where: { id } });
  if (!before || !canEditRecord(user, before)) return { message: "Недостаточно прав для редактирования КП" };

  const parsed = parseProposalForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  if (!canChangeProposalStatus(user) && parsed.data.status !== before.status) {
    return { message: "Недостаточно прав для изменения статуса КП" };
  }

  const deal = await getDealForProposal(parsed.data.dealId);
  if (!deal) return { message: "Укажите сделку КП" };

  const file = getProposalFile(formData);
  let fileData: Awaited<ReturnType<typeof saveProposalFile>> | undefined;
  try {
    fileData = file ? await saveProposalFile(file, user.id) : undefined;
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Не удалось загрузить файл КП" };
  }

  const responsibleId = canChangeProposalResponsible(user) ? parsed.data.responsibleId : before.responsibleId;
  const existingFinancials = canChangeProposalFinancials(user)
    ? before
    : {
        ...before,
        amount: before.amount,
        discountPercent: before.discountPercent,
        discountAmount: before.discountAmount
      };
  const document = toProposalDocument(parsed.data, deal, responsibleId, existingFinancials, fileData, !canChangeProposalFinancials(user));
  const sentError = await ensureSentRequirements(document.status, document.fileUrl, parsed.data);
  if (sentError) return { message: sentError };

  const after = await prisma.commercialProposal.update({
    where: { id },
    data: document
  });

  if (before.status !== "SENT" && after.status === "SENT") await createProposalFollowUpTask(after);

  await writeEntityAuditLog({
    entityType: "PROPOSAL",
    entityId: id,
    action: "UPDATE",
    userId: user.id,
    before,
    after
  });

  const trackedFields = [
    ["status", "CHANGE_STATUS", before.status, after.status],
    ["amount", "CHANGE_AMOUNT", before.amount, after.amount],
    ["discountPercent", "CHANGE_DISCOUNT", before.discountPercent, after.discountPercent],
    ["discountAmount", "CHANGE_DISCOUNT", before.discountAmount, after.discountAmount],
    ["nextTouchAt", "CHANGE_NEXT_TOUCH", before.nextTouchAt?.toISOString?.(), after.nextTouchAt?.toISOString?.()],
    ["declineReason", "DECLINE", before.declineReason, after.declineReason]
  ] as const;

  await writeTrackedFieldAuditLogs({
    entityType: "PROPOSAL",
    entityId: id,
    userId: user.id,
    fields: trackedFields
  });

  if (fileData) {
    await writeEntityAuditLog({
      entityType: "PROPOSAL",
      entityId: id,
      action: "UPLOAD_FILE",
      userId: user.id,
      after: fileData
    });
  }

  if (before.status !== "ACCEPTED" && after.status === "ACCEPTED") {
    await writeEntityAuditLog({
      entityType: "PROPOSAL",
      entityId: id,
      action: "ACCEPT",
      userId: user.id,
      before: { status: before.status },
      after: { status: after.status }
    });
  }

  await syncProposalDiscipline(id, user.id);

  redirect(`/proposals/${id}?saved=1`);
}

export async function archiveProposalAction(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const before = await prisma.commercialProposal.findUnique({ where: { id } });
  if (!before || !canArchiveRecord(user, before)) redirect(`/proposals/${id}?error=archive`);

  const after = await prisma.commercialProposal.update({
    where: { id },
    data: { status: "ARCHIVED", archivedAt: new Date() }
  });

  await writeEntityAuditLog({
    entityType: "PROPOSAL",
    entityId: id,
    action: "ARCHIVE",
    userId: user.id,
    before,
    after
  });

  await expireViolationsForEntity("PROPOSAL", id, user.id);

  redirect(`/proposals/${id}?archived=1`);
}

export async function createProposalVersionAction(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const source = await prisma.commercialProposal.findUnique({ where: { id } });
  if (!source || !canEditRecord(user, source)) redirect(`/proposals/${id}?error=version`);

  const newProposal = await createProposalVersion(source, user.id);

  redirect(`/proposals/${newProposal.id}/edit?version=1`);
}

export async function moveDealToInvoiceFromProposalAction(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const proposal = await prisma.commercialProposal.findUnique({
    where: { id },
    include: { deal: true }
  });
  if (!proposal || !canEditRecord(user, proposal)) redirect(`/proposals/${id}?error=permission`);

  await moveDealToInvoiceFromProposal(proposal, user.id);

  redirect(`/proposals/${id}?dealStage=1`);
}
