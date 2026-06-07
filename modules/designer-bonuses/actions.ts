"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import {
  canApproveDesignerBonusPayout,
  canCreateDesignerBonusAdjustment,
  canCreateDesignerBonusPayout,
  canManageDesignerBonusAgreement
} from "@/permissions";
import { parseBonusAdjustmentForm, parseBonusAgreementForm, parseBonusPayoutForm } from "@/modules/designer-bonuses/form";
import { createAdjustment, createOrUpdateAgreement, createPayout, DesignerBonusServiceError, markPayoutPaid } from "@/modules/designer-bonuses/service";

export type DesignerBonusActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

export async function saveDesignerBonusAgreementAction(id: string | null, _prevState: DesignerBonusActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !canManageDesignerBonusAgreement(user)) return { message: "Недостаточно прав для управления условиями бонусов" };

  const parsed = parseBonusAgreementForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const agreement = await createOrUpdateAgreement({ ...parsed.data, id: id ?? undefined }, user.id);
  redirect(`/designers/${agreement.designerId}?bonusSaved=1`);
}

export async function createDesignerBonusPayoutAction(_prevState: DesignerBonusActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !canCreateDesignerBonusPayout(user)) return { message: "Недостаточно прав для создания выплаты" };

  const parsed = parseBonusPayoutForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  try {
    const payout = await createPayout(parsed.data, user.id, { allowOverpayment: canApproveDesignerBonusPayout(user) });
    redirect(`/designer-bonuses/payouts?saved=1&payoutId=${payout.id}`);
  } catch (error) {
    if (error instanceof DesignerBonusServiceError) return { message: error.message };
    throw error;
  }
}

export async function markDesignerBonusPayoutPaidAction(id: string) {
  const user = await getCurrentUser();
  if (!user || !canApproveDesignerBonusPayout(user)) redirect("/designer-bonuses/payouts?error=permission");

  try {
    await markPayoutPaid(id, user.id, { allowOverpayment: canApproveDesignerBonusPayout(user) });
    redirect("/designer-bonuses/payouts?paid=1");
  } catch (error) {
    if (error instanceof DesignerBonusServiceError) redirect(`/designer-bonuses/payouts?error=${encodeURIComponent(error.message)}`);
    throw error;
  }
}

export async function createDesignerBonusAdjustmentAction(_prevState: DesignerBonusActionState, formData: FormData) {
  const user = await getCurrentUser();
  if (!user || !canCreateDesignerBonusAdjustment(user)) return { message: "Недостаточно прав для корректировок бонусов" };

  const parsed = parseBonusAdjustmentForm(formData);
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const adjustment = await createAdjustment(parsed.data, user.id);
  redirect(`/designers/${adjustment.designerId}?bonusAdjustment=1`);
}
