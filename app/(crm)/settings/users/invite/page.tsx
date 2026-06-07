import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { InviteUserForm } from "@/components/users/invite-user-form";
import { inviteUserAction } from "@/modules/users/admin-actions";
import { canAccessSettings } from "@/permissions";

export default async function InviteUserPage() {
  const user = await getCurrentUser();
  if (!canAccessSettings(user)) redirect("/");

  return (
    <FormPageShell title="Пригласить пользователя" description="Пользователь получит письмо и сам задаст пароль." cardTitle="Приглашение">
      <InviteUserForm action={inviteUserAction} />
    </FormPageShell>
  );
}
