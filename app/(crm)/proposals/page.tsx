import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { ProposalsFilters } from "@/components/proposals/proposals-filters";
import { ProposalsTable } from "@/components/proposals/proposals-table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getProposalFilterContext } from "@/modules/crm/form-contexts";
import { getProposals, type ProposalListSearchParams } from "@/modules/proposals/queries";
import { canCreateProposal } from "@/permissions";

type ProposalsPageProps = {
  searchParams: Promise<ProposalListSearchParams>;
};

function currentUrl(params: ProposalListSearchParams, patch: Record<string, string | undefined>) {
  const next = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...params, ...patch })) {
    if (value) next.set(key, value);
  }
  return `/proposals?${next.toString()}`;
}

export default async function ProposalsPage({ searchParams }: ProposalsPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [proposals, context] = await Promise.all([
    getProposals(params, user),
    getProposalFilterContext(user)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="КП"
        description="Коммерческие предложения, версии, файлы и follow-up."
        actions={canCreateProposal(user) ? (
          <Button asChild>
            <Link href="/proposals/new">
              <Plus className="h-4 w-4" />
              Создать КП
            </Link>
          </Button>
        ) : null}
      />

      <ProposalsFilters params={params} users={context.users} clients={context.clients} objects={context.objects} deals={context.deals} designers={context.designers} />
      <ProposalsTable proposals={proposals.items} user={user} />

      <Pagination
        total={proposals.total}
        page={proposals.page}
        pageCount={proposals.pageCount}
        previousHref={proposals.page > 1 ? currentUrl(params, { page: String(proposals.page - 1) }) : undefined}
        nextHref={proposals.page < proposals.pageCount ? currentUrl(params, { page: String(proposals.page + 1) }) : undefined}
      />
    </div>
  );
}
