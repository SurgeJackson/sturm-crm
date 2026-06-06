import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ClientsFilters } from "@/components/clients/clients-filters";
import { ClientsTable } from "@/components/clients/clients-table";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getClients, type ClientListSearchParams } from "@/modules/clients/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { canCreateClient } from "@/permissions";

type ClientsPageProps = {
  searchParams: Promise<ClientListSearchParams>;
};

function pageHref(params: ClientListSearchParams, page: number) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") search.set(key, value);
  });
  search.set("page", String(page));
  return `/clients?${search.toString()}`;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [clients, users] = await Promise.all([getClients(params, user), getAssignableUsers()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Клиенты"
        description="База клиентов STURM с ответственными и следующим контактом."
        actions={canCreateClient(user) ? (
          <Button asChild>
            <Link href="/clients/new">
              <Plus className="h-4 w-4" />
              Создать клиента
            </Link>
          </Button>
        ) : null}
      />

      <ClientsFilters params={params} users={users} />
      <ClientsTable clients={clients.items} />

      <Pagination
        total={clients.total}
        page={clients.page}
        pageCount={clients.pageCount}
        previousHref={clients.page > 1 ? pageHref(params, clients.page - 1) : undefined}
        nextHref={clients.page < clients.pageCount ? pageHref(params, clients.page + 1) : undefined}
      />
    </div>
  );
}
