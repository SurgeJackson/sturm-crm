import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { BonusFilters } from "@/components/designer-bonuses/bonus-filters";
import { BonusAccrualsTable } from "@/components/designer-bonuses/bonus-tables";
import { PageHeader } from "@/components/layout/page-header";
import { Pagination } from "@/components/ui/pagination";
import { getBonusAccruals, getBonusFormContext, type BonusListSearchParams } from "@/modules/designer-bonuses/queries";
import { canViewDesignerBonusAmounts, canViewDesignerBonusReports } from "@/permissions";

type AccrualsPageProps = {
  searchParams: Promise<BonusListSearchParams>;
};

function pageHref(params: BonusListSearchParams, page: number) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && !["page", "saved", "paid", "error"].includes(key)) next.set(key, value);
  });
  next.set("page", String(page));
  return `/designer-bonuses/accruals?${next.toString()}`;
}

export default async function BonusAccrualsPage({ searchParams }: AccrualsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canViewDesignerBonusReports(user)) redirect("/");

  const params = await searchParams;
  const [accruals, context] = await Promise.all([
    getBonusAccruals(params, user),
    getBonusFormContext(user)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader title="Начисления бонусов дизайнеров" description="Автоматические и ручные начисления по подтвержденным оплатам." />
      <BonusFilters params={params} designers={context.designers} deals={context.deals} objects={context.objects} basePath="/designer-bonuses/accruals" type="accruals" />
      <BonusAccrualsTable accruals={accruals.items} showDesigner showAmounts={canViewDesignerBonusAmounts(user)} />
      <Pagination
        total={accruals.total}
        page={accruals.page}
        pageCount={accruals.pageCount}
        previousHref={accruals.page > 1 ? pageHref(params, accruals.page - 1) : undefined}
        nextHref={accruals.page < accruals.pageCount ? pageHref(params, accruals.page + 1) : undefined}
      />
    </div>
  );
}
