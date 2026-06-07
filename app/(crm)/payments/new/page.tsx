import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { PaymentForm } from "@/components/payments/payment-form";
import { createPaymentAction } from "@/modules/payments/actions";
import { getPaymentFormContext } from "@/modules/payments/queries";
import { canCreatePayment } from "@/permissions";

type NewPaymentPageProps = {
  searchParams: Promise<{ dealId?: string }>;
};

export default async function NewPaymentPage({ searchParams }: NewPaymentPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreatePayment(user)) redirect("/payments");

  const [params, context] = await Promise.all([searchParams, getPaymentFormContext(user)]);

  return (
    <FormPageShell title="Создать оплату" description="Зафиксируйте оплату по сделке. Подтвержденная оплата создаст бонусное начисление." cardTitle="Оплата">
      <PaymentForm action={createPaymentAction} deals={context.deals} preselectedDealId={params.dealId} />
    </FormPageShell>
  );
}
