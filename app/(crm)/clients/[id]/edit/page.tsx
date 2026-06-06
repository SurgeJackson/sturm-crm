import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ClientForm } from "@/components/clients/client-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { getClientFormContext } from "@/modules/crm/form-contexts";
import { updateClientAction } from "@/modules/clients/actions";
import { getClientForUser } from "@/modules/clients/queries";
import { canChangeRecordResponsible } from "@/permissions";

type EditClientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditClientPage({ params }: EditClientPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [client, context] = await Promise.all([
    getClientForUser(id, user),
    getClientFormContext(user)
  ]);
  const action = updateClientAction.bind(null, id);

  return (
    <FormPageShell title="Редактировать клиента" description={client.name} cardTitle="Основное">
      <ClientForm
        action={action}
        client={client}
        users={context.users}
        designers={context.designers}
        currentUserId={user.id}
        canChangeResponsible={canChangeRecordResponsible(user)}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
