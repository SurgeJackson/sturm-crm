import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { DealsFilters } from "@/components/deals/deals-filters";
import { DealsTable } from "@/components/deals/deals-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getDealFilterContext } from "@/modules/crm/form-contexts";
import { getDeals, type DealListSearchParams } from "@/modules/deals/queries";
import { canCreateDeal } from "@/permissions";

type DealsPageProps = {
  searchParams: Promise<DealListSearchParams>;
};

function currentUrl(params: DealListSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  return `/deals?${next.toString()}`;
}

export default async function DealsPage({ searchParams }: DealsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [deals, context] = await Promise.all([
    getDeals(params, user),
    getDealFilterContext(user)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Сделки"
        description="Воронка продаж по клиентам, объектам и дизайнерам."
        actions={
          <>
          <Button asChild variant="outline"><Link href="/deals/pipeline">Воронка</Link></Button>
          {canCreateDeal(user) ? (
            <Button asChild>
              <Link href="/deals/new">
                <Plus className="h-4 w-4" />
                Создать сделку
              </Link>
            </Button>
          ) : null}
          </>
        }
      />

      <DealsFilters params={params} users={context.users} clients={context.clients} objects={context.objects} designers={context.designers} />
      <DealsTable deals={deals.items} />

      <Pagination
        total={deals.total}
        page={deals.page}
        pageCount={deals.pageCount}
        previousHref={deals.page > 1 ? currentUrl(params, { page: String(deals.page - 1) }) : undefined}
        nextHref={deals.page < deals.pageCount ? currentUrl(params, { page: String(deals.page + 1) }) : undefined}
      />
    </div>
  );
}
