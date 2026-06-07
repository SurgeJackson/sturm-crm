import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { UsersFilters } from "@/components/users/users-filters";
import { UsersTable } from "@/components/users/users-table";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { getAdminUsers, type UserListSearchParams } from "@/modules/users/admin-queries";
import { canAccessSettings } from "@/permissions";

type UsersPageProps = {
  searchParams: Promise<UserListSearchParams & { invited?: string }>;
};

function pageHref(params: UserListSearchParams, page: number) {
  const next = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value && key !== "page" && key !== "invited") next.set(key, value);
  });
  next.set("page", String(page));
  return `/settings/users?${next.toString()}`;
}

export default async function SettingsUsersPage({ searchParams }: UsersPageProps) {
  const user = await getCurrentUser();
  if (!canAccessSettings(user)) redirect("/");

  const params = await searchParams;
  const users = await getAdminUsers(params);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Пользователи"
        description="Управление учетными записями, ролями и доступом."
        actions={<Button asChild><Link href="/settings/users/invite"><Plus className="h-4 w-4" />Пригласить</Link></Button>}
      />
      <PageNoticeStack notices={[{ show: Boolean(params.invited), message: "Приглашение отправлено." }]} />
      <UsersFilters params={params} />
      <UsersTable users={users.items} />
      <Pagination
        total={users.total}
        page={users.page}
        pageCount={users.pageCount}
        previousHref={users.page > 1 ? pageHref(params, users.page - 1) : undefined}
        nextHref={users.page < users.pageCount ? pageHref(params, users.page + 1) : undefined}
      />
    </div>
  );
}
