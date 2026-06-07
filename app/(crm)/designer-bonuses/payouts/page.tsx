import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { BonusFilters } from "@/components/designer-bonuses/bonus-filters";
import { BonusPayoutsTable } from "@/components/designer-bonuses/bonus-tables";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getBonusFormContext, getBonusPayouts, type BonusListSearchParams } from "@/modules/designer-bonuses/queries";
import { canApproveDesignerBonusPayout, canCreateDesignerBonusPayout, canViewDesignerBonusAmounts, canViewDesignerBonusReports } from "@/permissions";

type PayoutsPageProps = {
  searchParams: Promise<BonusListSearchParams>;
};

function pageHref(params: BonusListSearchParams, page: number) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && !["page", "saved", "paid", "error", "payoutId"].includes(key)) next.set(key, value);
  });
  next.set("page", String(page));
  return `/designer-bonuses/payouts?${next.toString()}`;
}

export default async function BonusPayoutsPage({ searchParams }: PayoutsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canViewDesignerBonusReports(user)) redirect("/");

  const params = await searchParams;
  const [payouts, context] = await Promise.all([
    getBonusPayouts(params, user),
    getBonusFormContext(user)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Выплаты бонусов дизайнерам"
        description="Черновики, согласованные и выплаченные бонусы."
        actions={canCreateDesignerBonusPayout(user) ? (
          <Button asChild>
            <Link href="/designer-bonuses/payouts/new">
              <Plus className="h-4 w-4" />
              Создать выплату
            </Link>
          </Button>
        ) : null}
      />
      <PageNoticeStack
        notices={[
          { show: Boolean(params.saved), message: "Выплата сохранена." },
          { show: Boolean(params.paid), message: "Выплата отмечена как выплаченная, связанные начисления закрыты." },
          { show: Boolean(params.error), tone: "destructive", message: params.error ?? "Действие недоступно." }
        ]}
      />
      <BonusFilters params={params} designers={context.designers} basePath="/designer-bonuses/payouts" type="payouts" />
      <BonusPayoutsTable payouts={payouts.items} showDesigner showAmounts={canViewDesignerBonusAmounts(user)} canManage={canApproveDesignerBonusPayout(user)} />
      <Pagination
        total={payouts.total}
        page={payouts.page}
        pageCount={payouts.pageCount}
        previousHref={payouts.page > 1 ? pageHref(params, payouts.page - 1) : undefined}
        nextHref={payouts.page < payouts.pageCount ? pageHref(params, payouts.page + 1) : undefined}
      />
    </div>
  );
}
