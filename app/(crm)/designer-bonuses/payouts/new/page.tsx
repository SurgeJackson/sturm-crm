import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { BonusPayoutForm } from "@/components/designer-bonuses/bonus-payout-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { createDesignerBonusPayoutAction } from "@/modules/designer-bonuses/actions";
import { getBonusFormContext } from "@/modules/designer-bonuses/queries";
import { canCreateDesignerBonusPayout } from "@/permissions";

type NewPayoutPageProps = {
  searchParams: Promise<{ designerId?: string }>;
};

export default async function NewBonusPayoutPage({ searchParams }: NewPayoutPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreateDesignerBonusPayout(user)) redirect("/designer-bonuses/payouts");

  const [params, context] = await Promise.all([searchParams, getBonusFormContext(user)]);

  return (
    <FormPageShell title="Создать выплату дизайнеру" description="Выплата уменьшает управленческий баланс после статуса 'Выплачено'." cardTitle="Выплата">
      <BonusPayoutForm action={createDesignerBonusPayoutAction} designers={context.designers} accruals={context.payableAccruals} preselectedDesignerId={params.designerId} />
    </FormPageShell>
  );
}
