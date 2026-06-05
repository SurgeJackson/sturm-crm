"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import type {
  CommercialProposal,
  CommercialProposalStatus,
  ProposalDeclineReason,
  RecipientType
} from "@/generated/prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { prisma } from "@/lib/prisma";
import {
  canArchiveRecord,
  canChangeProposalFinancials,
  canChangeProposalResponsible,
  canChangeProposalStatus,
  canCreateProposal,
  canEditRecord
} from "@/permissions";
import { compactString, optionalDate, toAuditValue } from "@/modules/crm/form-utils";

export type ProposalActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

const proposalStatuses = [
  "DRAFT",
  "INTERNAL_REVIEW",
  "SENT",
  "CLIENT_THINKING",
  "NEEDS_RECALCULATION",
  "NEW_VERSION_CREATED",
  "ACCEPTED",
  "DECLINED",
  "ARCHIVED"
] as const;

const recipientTypes = ["CLIENT", "DESIGNER", "PURCHASE_INFLUENCER", "IMPLEMENTATION_CONTACT", "OTHER"] as const;
const declineReasons = [
  "PRICE",
  "DEADLINES",
  "ASSORTMENT",
  "COMPETITOR",
  "CHINA",
  "SELF_PURCHASE",
  "PROJECT_FROZEN",
  "CLIENT_DISAPPEARED",
  "DESIGNER_NOT_SUPPORT",
  "PROCUREMENT_CHOSE_OTHER",
  "OTHER"
] as const;

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".xls", ".xlsx", ".doc", ".docx"]);
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "proposals");

const proposalSchema = z
  .object({
    dealId: z.string().trim().min(1, "Укажите сделку КП"),
    responsibleId: z.string().trim().min(1, "Укажите ответственного по КП"),
    amount: z.string().trim().min(1, "Укажите сумму КП"),
    discountPercent: z.string().trim().optional(),
    discountAmount: z.string().trim().optional(),
    status: z.enum(proposalStatuses),
    recipientType: z.union([z.literal(""), z.enum(recipientTypes)]).optional(),
    recipientName: z.string().trim().optional(),
    recipientContact: z.string().trim().optional(),
    approvalRequiredFrom: z.string().trim().optional(),
    sentAt: z.string().trim().optional(),
    nextTouchAt: z.string().trim().optional(),
    declineReason: z.union([z.literal(""), z.enum(declineReasons)]).optional(),
    declineComment: z.string().trim().optional(),
    comment: z.string().trim().optional()
  })
  .superRefine((value, ctx) => {
    if (value.status === "SENT") {
      if (!value.recipientType) {
        ctx.addIssue({ code: "custom", message: "Укажите тип получателя КП", path: ["recipientType"] });
      }
      if (!value.recipientName) {
        ctx.addIssue({ code: "custom", message: "Укажите получателя КП", path: ["recipientName"] });
      }
      if (!value.sentAt) {
        ctx.addIssue({ code: "custom", message: "Укажите дату отправки КП", path: ["sentAt"] });
      }
      if (!value.nextTouchAt) {
        ctx.addIssue({ code: "custom", message: "Укажите дату следующего касания по КП", path: ["nextTouchAt"] });
      }
    }

    if (value.status === "DECLINED" && !value.declineReason) {
      ctx.addIssue({ code: "custom", message: "Укажите причину отклонения КП", path: ["declineReason"] });
    }
  });

function parseProposalForm(formData: FormData) {
  return proposalSchema.safeParse({
    dealId: formData.get("dealId"),
    responsibleId: formData.get("responsibleId"),
    amount: formData.get("amount"),
    discountPercent: compactString(formData.get("discountPercent")),
    discountAmount: compactString(formData.get("discountAmount")),
    status: formData.get("status"),
    recipientType: formData.get("recipientType") ?? "",
    recipientName: compactString(formData.get("recipientName")),
    recipientContact: compactString(formData.get("recipientContact")),
    approvalRequiredFrom: compactString(formData.get("approvalRequiredFrom")),
    sentAt: compactString(formData.get("sentAt")),
    nextTouchAt: compactString(formData.get("nextTouchAt")),
    declineReason: formData.get("declineReason") ?? "",
    declineComment: compactString(formData.get("declineComment")),
    comment: compactString(formData.get("comment"))
  });
}

function parseMoney(value?: string) {
  if (!value) return null;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function safeFileName(name: string) {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, ext).replace(/[^a-zA-Z0-9а-яА-Я_-]+/g, "-").slice(0, 80);
  return `${randomUUID()}-${base || "proposal"}${ext}`;
}

function getFile(formData: FormData) {
  const value = formData.get("file");
  if (!value || typeof value === "string" || value.size === 0) return null;
  return value;
}

async function saveProposalFile(file: File, userId: string) {
  const extension = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    throw new Error("Поддерживаются только PDF, XLS, XLSX, DOC и DOCX");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Файл КП не должен превышать 20 МБ");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });
  const fileName = safeFileName(file.name);
  const absolutePath = path.join(UPLOAD_DIR, fileName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolutePath, buffer);

  return {
    fileUrl: `/uploads/proposals/${fileName}`,
    fileName: file.name,
    fileSize: file.size,
    fileMimeType: file.type || "application/octet-stream",
    uploadedById: userId,
    uploadedAt: new Date()
  };
}

async function generateProposalNumber() {
  const year = new Date().getFullYear();
  const prefix = `КП-${year}-`;
  const latest = await prisma.commercialProposal.findFirst({
    where: { proposalNumber: { startsWith: prefix } },
    orderBy: { proposalNumber: "desc" },
    select: { proposalNumber: true }
  });
  const nextNumber = latest ? Number(latest.proposalNumber.replace(prefix, "")) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}

async function getDealForProposal(dealId: string) {
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

function toProposalDocument(
  data: z.infer<typeof proposalSchema>,
  deal: { clientId: string; objectId: string; designerId: string | null; responsibleId: string },
  responsibleId: string,
  existing?: Pick<
    CommercialProposal,
    "amount" | "discountPercent" | "discountAmount" | "fileUrl" | "fileName" | "fileSize" | "fileMimeType" | "uploadedById" | "uploadedAt"
  > | null,
  fileData?: Awaited<ReturnType<typeof saveProposalFile>>,
  lockFinancial = false
) {
  const status = data.status as CommercialProposalStatus;

  return {
    dealId: data.dealId,
    clientId: deal.clientId,
    objectId: deal.objectId,
    designerId: deal.designerId,
    responsibleId,
    amount: lockFinancial ? existing?.amount ?? 0 : parseMoney(data.amount) ?? 0,
    discountPercent: lockFinancial ? existing?.discountPercent ?? null : parseMoney(data.discountPercent),
    discountAmount: lockFinancial ? existing?.discountAmount ?? null : parseMoney(data.discountAmount),
    status,
    recipientType: data.recipientType ? (data.recipientType as RecipientType) : null,
    recipientName: data.recipientName || null,
    recipientContact: data.recipientContact || null,
    approvalRequiredFrom: data.approvalRequiredFrom || null,
    sentAt: optionalDate(data.sentAt),
    nextTouchAt: optionalDate(data.nextTouchAt),
    fileUrl: fileData?.fileUrl ?? existing?.fileUrl ?? null,
    fileName: fileData?.fileName ?? existing?.fileName ?? null,
    fileSize: fileData?.fileSize ?? existing?.fileSize ?? null,
    fileMimeType: fileData?.fileMimeType ?? existing?.fileMimeType ?? null,
    uploadedById: fileData?.uploadedById ?? existing?.uploadedById ?? null,
    uploadedAt: fileData?.uploadedAt ?? existing?.uploadedAt ?? null,
    declineReason: status === "DECLINED" && data.declineReason ? (data.declineReason as ProposalDeclineReason) : null,
    declineComment: status === "DECLINED" ? data.declineComment || null : null,
    comment: data.comment || null,
    notes: data.comment || null,
    archivedAt: status === "ARCHIVED" ? new Date() : null
  };
}

async function ensureSentRequirements(
  status: CommercialProposalStatus,
  fileUrl?: string | null,
  parsed?: z.infer<typeof proposalSchema>
) {
  if (status !== "SENT") return null;
  if (!fileUrl) return "Прикрепите файл КП перед отправкой";
  if (!parsed?.nextTouchAt) return "Укажите дату следующего касания по КП";
  return null;
}

async function createFollowUpTask(proposal: CommercialProposal) {
  if (proposal.status !== "SENT" || !proposal.nextTouchAt) return;

  const existing = await prisma.taskActivity.findFirst({
    where: {
      proposalId: proposal.id,
      title: { contains: proposal.proposalNumber }
    },
    select: { id: true }
  });

  if (existing) return;

  await prisma.taskActivity.create({
    data: {
      title: `Связаться по КП ${proposal.proposalNumber}`,
      status: "NEW",
      projectObjectId: proposal.objectId,
      dealId: proposal.dealId,
      proposalId: proposal.id,
      clientId: proposal.clientId,
      dueAt: proposal.nextTouchAt,
      responsibleId: proposal.responsibleId,
      createdById: proposal.createdById,
      notes: `Follow-up по КП ${proposal.proposalNumber}`
    }
  });
}

export async function createProposalAction(_prevState: ProposalActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !canCreateProposal(user)) return { message: "Недостаточно прав для создания КП" };

  const parsed = parseProposalForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const deal = await getDealForProposal(parsed.data.dealId);
  if (!deal) return { message: "Укажите сделку КП" };

  const file = getFile(formData);
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

  if (proposal.status === "SENT") await createFollowUpTask(proposal);

  await writeAuditLog({
    entityType: "PROPOSAL",
    entityId: proposal.id,
    action: "CREATE",
    userId: user.id,
    after: toAuditValue(proposal)
  });

  if (fileData) {
    await writeAuditLog({
      entityType: "PROPOSAL",
      entityId: proposal.id,
      action: "UPLOAD_FILE",
      userId: user.id,
      after: toAuditValue(fileData)
    });
  }

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

  const file = getFile(formData);
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

  if (before.status !== "SENT" && after.status === "SENT") await createFollowUpTask(after);

  await writeAuditLog({
    entityType: "PROPOSAL",
    entityId: id,
    action: "UPDATE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  const trackedFields = [
    ["status", "CHANGE_STATUS", before.status, after.status],
    ["amount", "CHANGE_AMOUNT", before.amount, after.amount],
    ["discountPercent", "CHANGE_DISCOUNT", before.discountPercent, after.discountPercent],
    ["discountAmount", "CHANGE_DISCOUNT", before.discountAmount, after.discountAmount],
    ["nextTouchAt", "CHANGE_NEXT_TOUCH", before.nextTouchAt?.toISOString?.(), after.nextTouchAt?.toISOString?.()],
    ["declineReason", "DECLINE", before.declineReason, after.declineReason]
  ] as const;

  for (const [field, action, previous, next] of trackedFields) {
    if (previous !== next) {
      await writeAuditLog({
        entityType: "PROPOSAL",
        entityId: id,
        action,
        userId: user.id,
        before: { [field]: previous },
        after: { [field]: next }
      });
    }
  }

  if (fileData) {
    await writeAuditLog({
      entityType: "PROPOSAL",
      entityId: id,
      action: "UPLOAD_FILE",
      userId: user.id,
      after: toAuditValue(fileData)
    });
  }

  if (before.status !== "ACCEPTED" && after.status === "ACCEPTED") {
    await writeAuditLog({
      entityType: "PROPOSAL",
      entityId: id,
      action: "ACCEPT",
      userId: user.id,
      before: { status: before.status },
      after: { status: after.status }
    });
  }

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

  await writeAuditLog({
    entityType: "PROPOSAL",
    entityId: id,
    action: "ARCHIVE",
    userId: user.id,
    before: toAuditValue(before),
    after: toAuditValue(after)
  });

  redirect(`/proposals/${id}?archived=1`);
}

export async function createProposalVersionAction(id: string) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const source = await prisma.commercialProposal.findUnique({ where: { id } });
  if (!source || !canEditRecord(user, source)) redirect(`/proposals/${id}?error=version`);

  const rootId = source.parentProposalId ?? source.id;
  const latest = await prisma.commercialProposal.findFirst({
    where: { OR: [{ id: rootId }, { parentProposalId: rootId }] },
    orderBy: { version: "desc" },
    select: { version: true }
  });
  const proposalNumber = await generateProposalNumber();
  const nextVersion = (latest?.version ?? source.version) + 1;

  const newProposal = await prisma.commercialProposal.create({
    data: {
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
      status: "DRAFT",
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
      createdById: user.id,
      notes: source.notes
    }
  });

  await prisma.commercialProposal.update({
    where: { id: source.id },
    data: { status: "NEW_VERSION_CREATED" }
  });

  await writeAuditLog({
    entityType: "PROPOSAL",
    entityId: source.id,
    action: "CREATE_VERSION",
    userId: user.id,
    before: { id: source.id, version: source.version },
    after: { id: newProposal.id, version: newProposal.version }
  });

  await writeAuditLog({
    entityType: "PROPOSAL",
    entityId: newProposal.id,
    action: "CREATE",
    userId: user.id,
    after: toAuditValue(newProposal)
  });

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

  const beforeStage = proposal.deal.stage;
  await prisma.deal.update({
    where: { id: proposal.dealId },
    data: { stage: "INVOICE_OR_ORDER" }
  });

  await writeAuditLog({
    entityType: "DEAL",
    entityId: proposal.dealId,
    action: "CHANGE_STAGE_FROM_ACCEPTED_PROPOSAL",
    userId: user.id,
    before: { stage: beforeStage, proposalId: proposal.id },
    after: { stage: "INVOICE_OR_ORDER", proposalId: proposal.id }
  });

  redirect(`/proposals/${id}?dealStage=1`);
}
