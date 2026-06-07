import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Button } from "@/components/ui/button";
import { UserDetailTabs } from "@/components/users/user-detail-tabs";
import { getAdminUser, getPermissionMatrix } from "@/modules/users/admin-queries";
import { canAccessSettings } from "@/permissions";

type UserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ activated?: string; deactivated?: string; roleChanged?: string; passwordReset?: string; error?: string }>;
};

export default async function SettingsUserPage({ params, searchParams }: UserPageProps) {
  const currentUser = await getCurrentUser();
  if (!canAccessSettings(currentUser)) redirect("/");

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [detail, permissions] = await Promise.all([getAdminUser(id), getPermissionMatrix()]);
  if (!detail) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={detail.user.name}
        description={detail.user.email}
        actions={<Button asChild variant="outline"><Link href="/settings/users">К списку</Link></Button>}
      />
      <PageNoticeStack
        notices={[
          { show: Boolean(query.activated), message: "Пользователь активирован." },
          { show: Boolean(query.deactivated), message: "Пользователь деактивирован." },
          { show: Boolean(query.roleChanged), message: "Роль изменена." },
          { show: Boolean(query.passwordReset), message: "Письмо восстановления пароля отправлено." },
          { show: Boolean(query.error), tone: "destructive", message: query.error === "selfDeactivate" ? "Нельзя деактивировать свою учетную запись." : "Действие недоступно." }
        ]}
      />
      <UserDetailTabs detail={detail} permissions={permissions} />
    </div>
  );
}
