import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ClientForm } from "@/components/clients/client-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { getClientFormContext } from "@/modules/crm/form-contexts";
import { createClientAction } from "@/modules/clients/actions";
import { canChangeRecordResponsible } from "@/permissions";

export default async function NewClientPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { users, designers } = await getClientFormContext(user);

  return (
    <FormPageShell title="Создать клиента" description="Заполните обязательные поля и контакт клиента." cardTitle="Основное">
      <ClientForm
        action={createClientAction}
        users={users}
        designers={designers}
        currentUserId={user.id}
        canChangeResponsible={canChangeRecordResponsible(user)}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
