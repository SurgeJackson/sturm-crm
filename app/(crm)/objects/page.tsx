import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { ObjectsFilters } from "@/components/objects/objects-filters";
import { ObjectsTable } from "@/components/objects/objects-table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getObjectFilterContext } from "@/modules/crm/form-contexts";
import { getProjectObjects, type ObjectListSearchParams } from "@/modules/objects/queries";
import { canCreateObject } from "@/permissions";

type ObjectsPageProps = {
  searchParams: Promise<ObjectListSearchParams>;
};

function currentUrl(params: ObjectListSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  return `/objects?${next.toString()}`;
}

export default async function ObjectsPage({ searchParams }: ObjectsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [objects, context] = await Promise.all([
    getProjectObjects(params, user),
    getObjectFilterContext(user)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Объекты"
        description="Проектные продажи, комплектации и контроль участников объекта."
        actions={canCreateObject(user) ? (
          <Button asChild>
            <Link href="/objects/new">
              <Plus className="h-4 w-4" />
              Создать объект
            </Link>
          </Button>
        ) : null}
      />

      <ObjectsFilters params={params} users={context.users} clients={context.clients} designers={context.designers} />
      <ObjectsTable objects={objects.items} />

      <Pagination
        total={objects.total}
        page={objects.page}
        pageCount={objects.pageCount}
        previousHref={objects.page > 1 ? currentUrl(params, { page: String(objects.page - 1) }) : undefined}
        nextHref={objects.page < objects.pageCount ? currentUrl(params, { page: String(objects.page + 1) }) : undefined}
      />
    </div>
  );
}
