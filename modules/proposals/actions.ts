"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import {
  canChangeProposalFinancials,
  canChangeProposalResponsible,
  canChangeProposalStatus,
  canCreateProposal,
  canEditRecord
} from "@/permissions";
import {
  ensureSentRequirements,
  parseProposalForm,
  toProposalDocument
} from "@/modules/proposals/form";
import { getProposalFile, saveProposalFile } from "@/modules/proposals/files";
import { moveDealToInvoiceFromProposal } from "@/modules/proposals/services/deal-sync";
import {
  getDealForProposal,
  getProposalForMutation,
  getProposalWithDealForMutation
} from "@/modules/proposals/services/queries";
import { createProposalVersion } from "@/modules/proposals/services/versioning";
import { createProposal, updateProposal } from "@/modules/proposals/services/workflow";

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
  const document = toProposalDocument(parsed.data, deal, responsibleId, null, fileData);
  const sentError = await ensureSentRequirements(document.status, document.fileUrl, parsed.data);
  if (sentError) return { message: sentError };

  const proposal = await createProposal({
    data: parsed.data,
    deal,
    responsibleId,
    userId: user.id,
    fileData
  });

  redirect(`/proposals/${proposal.id}?saved=1`);
}

export async function updateProposalAction(id: string, _prevState: ProposalActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user) return { message: "Необходима авторизация" };

  const before = await getProposalForMutation(id);
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

  await updateProposal({
    id,
    before,
    data: parsed.data,
    deal,
    responsibleId,
    userId: user.id,
    fileData,
    lockFinancial: !canChangeProposalFinancials(user)
  });

  redirect(`/proposals/${id}?saved=1`);
}

export async function createProposalVersionAction(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const source = await getProposalForMutation(id);
  if (!source || !canEditRecord(user, source)) redirect(`/proposals/${id}?error=version`);

  const newProposal = await createProposalVersion(source, user.id);

  redirect(`/proposals/${newProposal.id}/edit?version=1`);
}

export async function moveDealToInvoiceFromProposalAction(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const proposal = await getProposalWithDealForMutation(id);
  if (!proposal || !canEditRecord(user, proposal)) redirect(`/proposals/${id}?error=permission`);

  await moveDealToInvoiceFromProposal(proposal, user.id);

  redirect(`/proposals/${id}?dealStage=1`);
}
