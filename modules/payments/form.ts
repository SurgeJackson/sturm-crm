import { z } from "zod";
import { paymentStatusLabels, paymentTypeLabels } from "@/lib/constants";
import { compactString, optionalDate, optionalNumber } from "@/modules/crm/form-utils";
import { enumParam } from "@/modules/crm/param-parsing";

const paymentTypes = Object.keys(paymentTypeLabels) as [keyof typeof paymentTypeLabels, ...Array<keyof typeof paymentTypeLabels>];
export const supportedPaymentCreateStatuses = ["DRAFT", "CONFIRMED"] as const;

export const paymentSchema = z.object({
  dealId: z.string().min(1, "Укажите сделку"),
  amount: z.number().positive("Укажите сумму оплаты"),
  paymentDate: z.date({ error: "Укажите дату оплаты" }),
  paymentType: z.enum(paymentTypes),
  status: z.enum(supportedPaymentCreateStatuses, { error: "Оплату можно создать только как черновик или подтвержденную" }),
  comment: z.string().nullable()
});

export type PaymentFormData = z.infer<typeof paymentSchema>;

export function parsePaymentForm(formData: FormData) {
  return paymentSchema.safeParse({
    dealId: compactString(formData.get("dealId")) ?? "",
    amount: optionalNumber(String(formData.get("amount") ?? "")) ?? 0,
    paymentDate: optionalDate(String(formData.get("paymentDate") ?? "")),
    paymentType: enumParam(String(formData.get("paymentType") ?? ""), paymentTypeLabels) ?? "PARTIAL_PAYMENT",
    status: enumParam(String(formData.get("status") ?? ""), paymentStatusLabels) ?? "DRAFT",
    comment: compactString(formData.get("comment")) ?? null
  });
}
