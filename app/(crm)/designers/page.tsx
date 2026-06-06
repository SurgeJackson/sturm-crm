import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DesignersFilters } from "@/components/designers/designers-filters";
import { DesignersTable } from "@/components/designers/designers-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getDesigners, type DesignerListSearchParams } from "@/modules/designers/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { canCreateDesigner } from "@/permissions";

type DesignersPageProps = {
  searchParams: Promise<DesignerListSearchParams>;
};

function pageHref(params: DesignerListSearchParams, page: number) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") search.set(key, value);
  });
  search.set("page", String(page));
  return `/designers?${search.toString()}`;
}

export default async function DesignersPage({ searchParams }: DesignersPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [designers, users] = await Promise.all([getDesigners(params, user), getAssignableUsers()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Дизайнеры / архитекторы"
        description="Партнерская база и воронка отношений."
        actions={
          <>
          <Button asChild variant="outline"><Link href="/designers/pipeline">Воронка</Link></Button>
          {canCreateDesigner(user) ? (
            <Button asChild>
              <Link href="/designers/new">
                <Plus className="h-4 w-4" />
                Создать дизайнера
              </Link>
            </Button>
          ) : null}
          </>
        }
      />

      <DesignersFilters params={params} users={users} />
      <DesignersTable designers={designers.items} />

      <Pagination
        total={designers.total}
        page={designers.page}
        pageCount={designers.pageCount}
        previousHref={designers.page > 1 ? pageHref(params, designers.page - 1) : undefined}
        nextHref={designers.page < designers.pageCount ? pageHref(params, designers.page + 1) : undefined}
      />
    </div>
  );
}
