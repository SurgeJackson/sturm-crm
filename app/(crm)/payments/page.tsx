import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { PaymentsFilters } from "@/components/payments/payments-filters";
import { PaymentsTable } from "@/components/payments/payments-table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getPaymentFormContext, getPayments, type PaymentListSearchParams } from "@/modules/payments/queries";
import { canConfirmPayment, canCreatePayment, canViewPayments } from "@/permissions";

type PaymentsPageProps = {
  searchParams: Promise<PaymentListSearchParams>;
};

function pageHref(params: PaymentListSearchParams, page: number) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && !["page", "saved", "confirmed", "cancelled", "error", "paymentId"].includes(key)) next.set(key, value);
  });
  next.set("page", String(page));
  return `/payments?${next.toString()}`;
}

function presentOption<T>(value: T | null | undefined): value is T {
  return Boolean(value);
}

function uniqueById<T extends { id: string }>(items: T[]) {
  return Array.from(new Map(items.map((item) => [item.id, item])).values());
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canViewPayments(user)) redirect("/");

  const params = await searchParams;
  const [payments, context] = await Promise.all([
    getPayments(params, user),
    getPaymentFormContext(user)
  ]);
  const designers = uniqueById(context.deals.map((deal) => deal.designer).filter(presentOption));
  const clients = uniqueById(context.deals.map((deal) => deal.client));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Оплаты"
        description="Управленческий учет оплат по сделкам и автоматическое начисление дизайнерских бонусов."
        actions={canCreatePayment(user) ? (
          <Button asChild>
            <Link href="/payments/new">
              <Plus className="h-4 w-4" />
              Создать оплату
            </Link>
          </Button>
        ) : null}
      />
      <PageNoticeStack
        notices={[
          { show: Boolean(params.saved), message: "Оплата сохранена." },
          { show: Boolean(params.confirmed), message: "Оплата подтверждена, начисление бонуса создано при наличии активных условий." },
          { show: Boolean(params.cancelled), message: "Оплата отменена, связанные начисления отменены." },
          { show: Boolean(params.error), tone: "destructive", message: params.error ?? "Действие недоступно." }
        ]}
      />
      <PaymentsFilters params={params} deals={context.deals} designers={designers} clients={clients} />
      <PaymentsTable payments={payments.items} canManage={canConfirmPayment(user)} />
      <Pagination
        total={payments.total}
        page={payments.page}
        pageCount={payments.pageCount}
        previousHref={payments.page > 1 ? pageHref(params, payments.page - 1) : undefined}
        nextHref={payments.page < payments.pageCount ? pageHref(params, payments.page + 1) : undefined}
      />
    </div>
  );
}
