import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DesignerForm } from "@/components/designers/designer-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { createDesignerAction } from "@/modules/designers/actions";
import { getAssignableUsers } from "@/modules/users/queries";
import { canChangeRecordResponsible } from "@/permissions";

export default async function NewDesignerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const users = await getAssignableUsers();

  return (
    <FormPageShell title="Создать дизайнера" description="Добавьте контакт, этап отношений и следующий шаг." cardTitle="Основное">
      <DesignerForm
        action={createDesignerAction}
        users={users}
        currentUserId={user.id}
        canChangeResponsible={canChangeRecordResponsible(user)}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
