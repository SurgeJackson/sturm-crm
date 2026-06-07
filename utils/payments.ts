import type { paymentTypeLabels } from "@/lib/constants";

export function paymentSignedAmount(payment: { amount: number; paymentType: keyof typeof paymentTypeLabels }) {
  return payment.paymentType === "REFUND" ? -Math.abs(payment.amount) : payment.amount;
}
