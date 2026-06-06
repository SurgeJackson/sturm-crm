import { z } from "zod";
import type { DealLossReason, DealProbability, DealSource, DealStage } from "@/generated/prisma/client";
import { compactString, optionalDate, optionalNumber } from "@/modules/crm/form-utils";

export const dealStages = [
  "NEW_REQUEST",
  "QUALIFICATION",
  "SELECTION",
  "PROPOSAL_IN_PROGRESS",
  "PROPOSAL_SENT",
  "WAITING_DECISION",
  "NEGOTIATION",
  "INVOICE_OR_ORDER",
  "PAID",
  "IN_DELIVERY",
  "COMPLETED",
  "LOST"
] as const;

const dealProbabilities = ["LOW", "MEDIUM", "HIGH", "VERY_HIGH"] as const;
const dealSources = [
  "DESIGNER",
  "SHOWROOM",
  "WEBSITE",
  "PHONE",
  "RECOMMENDATION",
  "REPEAT_CLIENT",
  "COMMERCIAL_PROJECT",
  "OTHER"
] as const;
export const dealLossReasons = [
  "PRICE",
  "DEADLINES",
  "COMPETITOR",
  "CHINA",
  "SELF_PURCHASE",
  "CLIENT_DISAPPEARED",
  "ASSORTMENT",
  "PAYMENT_TERMS",
  "DELIVERY_TERMS",
  "DESIGNER_NOT_SUPPORT",
  "PROCUREMENT_CHOSE_OTHER",
  "PROJECT_FROZEN",
  "OTHER"
] as const;

export const dealSchema = z
  .object({
    title: z.string().trim().min(1, "Укажите название сделки"),
    clientId: z.string().trim().min(1, "Укажите клиента сделки"),
    objectId: z.string().trim().min(1, "Укажите объект сделки"),
    designerId: z.string().trim().optional(),
    responsibleId: z.string().trim().min(1, "Укажите ответственного по сделке"),
    stage: z.enum(dealStages),
    potentialAmount: z.string().trim().optional(),
    probability: z.union([z.literal(""), z.enum(dealProbabilities)]).optional(),
    nextActionAt: z.string().trim().optional(),
    nextActionText: z.string().trim().optional(),
    source: z.enum(dealSources, { message: "Укажите источник сделки" }),
    lossReason: z.union([z.literal(""), z.enum(dealLossReasons)]).optional(),
    lossComment: z.string().trim().optional(),
    comment: z.string().trim().optional()
  })
  .superRefine((value, ctx) => {
    if (value.stage === "LOST") {
      if (!value.lossReason) ctx.addIssue({ code: "custom", message: "Укажите причину проигрыша сделки", path: ["lossReason"] });
      return;
    }

    if (value.stage === "COMPLETED") return;
    if (!value.nextActionText) ctx.addIssue({ code: "custom", message: "Укажите следующий шаг по сделке", path: ["nextActionText"] });
    if (!value.nextActionAt) ctx.addIssue({ code: "custom", message: "Укажите дату следующего действия", path: ["nextActionAt"] });
  });

export type DealFormData = z.infer<typeof dealSchema>;

export function parseDealForm(formData: FormData) {
  return dealSchema.safeParse({
    title: formData.get("title"),
    clientId: formData.get("clientId"),
    objectId: formData.get("objectId"),
    designerId: compactString(formData.get("designerId")),
    responsibleId: formData.get("responsibleId"),
    stage: formData.get("stage"),
    potentialAmount: compactString(formData.get("potentialAmount")),
    probability: formData.get("probability") ?? "",
    nextActionAt: compactString(formData.get("nextActionAt")),
    nextActionText: compactString(formData.get("nextActionText")),
    source: formData.get("source"),
    lossReason: formData.get("lossReason") ?? "",
    lossComment: compactString(formData.get("lossComment")),
    comment: compactString(formData.get("comment"))
  });
}

export function closedAtForStage(stage: DealStage, previous?: Date | null, now = new Date()) {
  if (stage === "LOST" || stage === "COMPLETED") return previous ?? now;
  return null;
}

export function toDealDocument(
  data: DealFormData,
  object: { clientId: string; designerId: string | null },
  responsibleId: string,
  previousClosedAt?: Date | null,
  lockFinancial = false,
  previousFinancial?: { potentialAmount: number | null; probability: DealProbability | null }
) {
  const stage = data.stage as DealStage;
  const isClosed = stage === "LOST" || stage === "COMPLETED";

  return {
    title: data.title,
    clientId: object.clientId,
    objectId: data.objectId,
    designerId: data.designerId || object.designerId || null,
    responsibleId,
    stage,
    potentialAmount: lockFinancial ? previousFinancial?.potentialAmount ?? null : optionalNumber(data.potentialAmount),
    probability: lockFinancial ? previousFinancial?.probability ?? null : data.probability ? (data.probability as DealProbability) : null,
    nextActionAt: isClosed ? null : optionalDate(data.nextActionAt),
    nextActionText: isClosed ? null : data.nextActionText || null,
    source: data.source as DealSource,
    lossReason: stage === "LOST" ? (data.lossReason as DealLossReason) : null,
    lossComment: stage === "LOST" ? data.lossComment || null : null,
    comment: data.comment || null,
    notes: data.comment || null,
    closedAt: closedAtForStage(stage, previousClosedAt)
  };
}
