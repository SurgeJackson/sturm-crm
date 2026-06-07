"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { canConfirmPayment, canCreatePayment } from "@/permissions";
import { parsePaymentForm } from "@/modules/payments/form";
import { changePaymentStatus, createPayment, PaymentServiceError } from "@/modules/payments/service";

export type PaymentActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function createPaymentAction(_prevState: PaymentActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !canCreatePayment(user)) return { message: "Недостаточно прав для создания оплаты" };

  const parsed = parsePaymentForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    const payment = await createPayment(parsed.data, user.id);
    redirect(`/payments?saved=1&paymentId=${payment.id}`);
  } catch (error) {
    if (error instanceof PaymentServiceError) return { message: error.message };
    throw error;
  }
}

export async function confirmPaymentAction(id: string) {
  const user = await getCurrentUser();
  if (!user || !canConfirmPayment(user)) redirect("/payments?error=permission");

  try {
    await changePaymentStatus(id, "CONFIRMED", user.id);
    redirect("/payments?confirmed=1");
  } catch (error) {
    if (error instanceof PaymentServiceError) redirect(`/payments?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
}

export async function cancelPaymentAction(id: string) {
  const user = await getCurrentUser();
  if (!user || !canConfirmPayment(user)) redirect("/payments?error=permission");

  try {
    await changePaymentStatus(id, "CANCELLED", user.id);
    redirect("/payments?cancelled=1");
  } catch (error) {
    if (error instanceof PaymentServiceError) redirect(`/payments?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
}
