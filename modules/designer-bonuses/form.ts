import { z } from "zod";
import {
  designerBonusAgreementStatusLabels,
  designerBonusAgreementTypeLabels,
  designerBonusAdjustmentTypeLabels,
  designerBonusAppliesToLabels,
  designerBonusCalculationBaseLabels,
  designerBonusPayoutMethodLabels,
  designerBonusPayoutStatusLabels
} from "@/lib/constants";
import { compactString, optionalDate, optionalNumber, splitTextareaLines } from "@/modules/crm/form-utils";
import { enumParam } from "@/modules/crm/param-parsing";

export const supportedBonusAgreementTypes = ["STANDARD_PERCENT", "INDIVIDUAL_PERCENT"] as const;
export const supportedBonusCalculationBases = ["PAYMENT_AMOUNT"] as const;
export const supportedBonusAppliesTo = ["ALL_DEALS", "SPECIFIC_DEALS"] as const;

function selectedIds(formData: FormData, name: string, fallbackName: string) {
  const selected = formData.getAll(name).map(String).filter(Boolean);
  return selected.length > 0 ? selected : splitTextareaLines(String(formData.get(fallbackName) ?? ""));
}

export const bonusAgreementSchema = z.object({
  designerId: z.string().min(1, "Укажите дизайнера"),
  agreementType: z.enum(supportedBonusAgreementTypes, { error: "Для MVP доступны только процентные условия" }),
  bonusPercent: z.number().nullable(),
  calculationBase: z.enum(supportedBonusCalculationBases, { error: "Для MVP бонус начисляется только от суммы оплаты" }),
  appliesTo: z.enum(supportedBonusAppliesTo, { error: "Для MVP доступны все сделки или выбранные сделки" }),
  specificDealIds: z.array(z.string()),
  validFrom: z.date({ error: "Укажите дату начала" }),
  validTo: z.date().nullable(),
  status: z.enum(Object.keys(designerBonusAgreementStatusLabels) as [keyof typeof designerBonusAgreementStatusLabels, ...Array<keyof typeof designerBonusAgreementStatusLabels>]),
  requiresApproval: z.boolean(),
  comment: z.string().nullable()
}).superRefine((data, ctx) => {
  if ((data.agreementType === "STANDARD_PERCENT" || data.agreementType === "INDIVIDUAL_PERCENT") && (!data.bonusPercent || data.bonusPercent <= 0)) {
    ctx.addIssue({ code: "custom", path: ["bonusPercent"], message: "Укажите процент бонуса" });
  }

  if (data.validTo && data.validTo < data.validFrom) {
    ctx.addIssue({ code: "custom", path: ["validTo"], message: "Дата окончания не может быть раньше начала" });
  }

  if (data.appliesTo === "SPECIFIC_DEALS" && data.specificDealIds.length === 0) {
    ctx.addIssue({ code: "custom", path: ["specificDealIds"], message: "Укажите сделки для применения условий" });
  }
});

export type BonusAgreementFormData = z.infer<typeof bonusAgreementSchema>;

export function parseBonusAgreementForm(formData: FormData) {
  return bonusAgreementSchema.safeParse({
    designerId: compactString(formData.get("designerId")) ?? "",
    agreementType: enumParam(String(formData.get("agreementType") ?? ""), designerBonusAgreementTypeLabels) ?? "STANDARD_PERCENT",
    bonusPercent: optionalNumber(String(formData.get("bonusPercent") ?? "")),
    calculationBase: enumParam(String(formData.get("calculationBase") ?? ""), designerBonusCalculationBaseLabels) ?? "PAYMENT_AMOUNT",
    appliesTo: enumParam(String(formData.get("appliesTo") ?? ""), designerBonusAppliesToLabels) ?? "ALL_DEALS",
    specificDealIds: selectedIds(formData, "specificDealIds", "specificDealIdsManual"),
    validFrom: optionalDate(String(formData.get("validFrom") ?? "")),
    validTo: optionalDate(String(formData.get("validTo") ?? "")),
    status: enumParam(String(formData.get("status") ?? ""), designerBonusAgreementStatusLabels) ?? "DRAFT",
    requiresApproval: formData.get("requiresApproval") === "1",
    comment: compactString(formData.get("comment")) ?? null
  });
}

export const bonusPayoutSchema = z.object({
  designerId: z.string().min(1, "Укажите дизайнера"),
  amount: z.number().positive("Укажите сумму выплаты"),
  payoutDate: z.date({ error: "Укажите дату выплаты" }),
  payoutMethod: z.enum(Object.keys(designerBonusPayoutMethodLabels) as [keyof typeof designerBonusPayoutMethodLabels, ...Array<keyof typeof designerBonusPayoutMethodLabels>]),
  status: z.enum(Object.keys(designerBonusPayoutStatusLabels) as [keyof typeof designerBonusPayoutStatusLabels, ...Array<keyof typeof designerBonusPayoutStatusLabels>]),
  linkedAccrualIds: z.array(z.string()),
  comment: z.string().nullable(),
  documentFileUrl: z.string().nullable()
});

export type BonusPayoutFormData = z.infer<typeof bonusPayoutSchema>;

export function parseBonusPayoutForm(formData: FormData) {
  return bonusPayoutSchema.safeParse({
    designerId: compactString(formData.get("designerId")) ?? "",
    amount: optionalNumber(String(formData.get("amount") ?? "")) ?? 0,
    payoutDate: optionalDate(String(formData.get("payoutDate") ?? "")),
    payoutMethod: enumParam(String(formData.get("payoutMethod") ?? ""), designerBonusPayoutMethodLabels) ?? "BANK_TRANSFER",
    status: enumParam(String(formData.get("status") ?? ""), designerBonusPayoutStatusLabels) ?? "DRAFT",
    linkedAccrualIds: formData.getAll("linkedAccrualIds").map(String).filter(Boolean),
    comment: compactString(formData.get("comment")) ?? null,
    documentFileUrl: compactString(formData.get("documentFileUrl")) ?? null
  });
}

const adjustmentTypes = Object.keys(designerBonusAdjustmentTypeLabels) as [keyof typeof designerBonusAdjustmentTypeLabels, ...Array<keyof typeof designerBonusAdjustmentTypeLabels>];

export const bonusAdjustmentSchema = z.object({
  designerId: z.string().min(1, "Укажите дизайнера"),
  amount: z.number().positive("Укажите сумму корректировки"),
  adjustmentType: z.enum(adjustmentTypes),
  reason: z.string().min(1, "Укажите причину"),
  comment: z.string().nullable()
});

export type BonusAdjustmentFormData = z.infer<typeof bonusAdjustmentSchema>;

export function parseBonusAdjustmentForm(formData: FormData) {
  return bonusAdjustmentSchema.safeParse({
    designerId: compactString(formData.get("designerId")) ?? "",
    amount: optionalNumber(String(formData.get("amount") ?? "")) ?? 0,
    adjustmentType: enumParam(String(formData.get("adjustmentType") ?? ""), designerBonusAdjustmentTypeLabels) ?? "OTHER",
    reason: compactString(formData.get("reason")) ?? "",
    comment: compactString(formData.get("comment")) ?? null
  });
}
