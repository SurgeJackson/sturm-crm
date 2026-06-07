import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { CompactMetricCard } from "@/components/crm/summary-card";
import { Pagination } from "@/components/ui/pagination";
import { SecurityFilters } from "@/components/security/security-filters";
import { SecurityLogTable } from "@/components/security/security-log-table";
import { getSecurityDashboard, securityActionLabels, type SecurityLogSearchParams } from "@/modules/security/queries";
import { canViewSecurityLog } from "@/permissions";

type SecurityPageProps = {
  searchParams: Promise<SecurityLogSearchParams>;
};

function pageHref(params: SecurityLogSearchParams, page: number) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page") next.set(key, value);
  });
  next.set("page", String(page));
  return `/security?${next.toString()}`;
}

export default async function SecurityPage({ searchParams }: SecurityPageProps) {
  const user = await getCurrentUser();
  if (!canViewSecurityLog(user)) redirect("/");

  const params = await searchParams;
  const dashboard = await getSecurityDashboard(params);

  return (
    <div className="space-y-6">
      <PageHeader title="Безопасность" description="Контроль входов, экспортов, скачиваний файлов и подозрительной активности." />
      <div className="grid gap-4 md:grid-cols-4">
        {dashboard.summary.slice(0, 4).map((item) => (
          <CompactMetricCard key={item.action} title={securityActionLabels[item.action] ?? item.action} value={item._count._all} />
        ))}
      </div>
      <SecurityFilters params={params} users={dashboard.users} actions={dashboard.actions} />
      <SecurityLogTable logs={dashboard.logs.items} />
      <Pagination
        total={dashboard.logs.total}
        page={dashboard.logs.page}
        pageCount={dashboard.logs.pageCount}
        previousHref={dashboard.logs.page > 1 ? pageHref(params, dashboard.logs.page - 1) : undefined}
        nextHref={dashboard.logs.page < dashboard.logs.pageCount ? pageHref(params, dashboard.logs.page + 1) : undefined}
      />
    </div>
  );
}
