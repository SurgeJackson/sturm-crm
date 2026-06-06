import { z } from "zod";
import type {
  CommercialProposal,
  CommercialProposalStatus,
  ProposalDeclineReason,
  RecipientType
} from "@/generated/prisma/client";
import { compactString, optionalDate, optionalNumber } from "@/modules/crm/form-utils";

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

export const proposalSchema = z
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
      if (!value.recipientType) ctx.addIssue({ code: "custom", message: "Укажите тип получателя КП", path: ["recipientType"] });
      if (!value.recipientName) ctx.addIssue({ code: "custom", message: "Укажите получателя КП", path: ["recipientName"] });
      if (!value.sentAt) ctx.addIssue({ code: "custom", message: "Укажите дату отправки КП", path: ["sentAt"] });
      if (!value.nextTouchAt) ctx.addIssue({ code: "custom", message: "Укажите дату следующего касания по КП", path: ["nextTouchAt"] });
    }

    if (value.status === "DECLINED" && !value.declineReason) {
      ctx.addIssue({ code: "custom", message: "Укажите причину отклонения КП", path: ["declineReason"] });
    }
  });

export type ProposalFormData = z.infer<typeof proposalSchema>;

export type ProposalFileData = {
  fileUrl: string;
  fileName: string;
  fileSize: number;
  fileMimeType: string;
  uploadedById: string;
  uploadedAt: Date;
};

export function parseProposalForm(formData: FormData) {
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

export function toProposalDocument(
  data: ProposalFormData,
  deal: { clientId: string; objectId: string; designerId: string | null; responsibleId: string },
  responsibleId: string,
  existing?: Pick<
    CommercialProposal,
    "amount" | "discountPercent" | "discountAmount" | "fileUrl" | "fileName" | "fileSize" | "fileMimeType" | "uploadedById" | "uploadedAt"
  > | null,
  fileData?: ProposalFileData,
  lockFinancial = false
) {
  const status = data.status as CommercialProposalStatus;

  return {
    dealId: data.dealId,
    clientId: deal.clientId,
    objectId: deal.objectId,
    designerId: deal.designerId,
    responsibleId,
    amount: lockFinancial ? existing?.amount ?? 0 : optionalNumber(data.amount) ?? 0,
    discountPercent: lockFinancial ? existing?.discountPercent ?? null : optionalNumber(data.discountPercent),
    discountAmount: lockFinancial ? existing?.discountAmount ?? null : optionalNumber(data.discountAmount),
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

export function ensureSentRequirements(
  status: CommercialProposalStatus,
  fileUrl?: string | null,
  parsed?: ProposalFormData
) {
  if (status !== "SENT") return null;
  if (!fileUrl) return "Прикрепите файл КП перед отправкой";
  if (!parsed?.nextTouchAt) return "Укажите дату следующего касания по КП";
  return null;
}
