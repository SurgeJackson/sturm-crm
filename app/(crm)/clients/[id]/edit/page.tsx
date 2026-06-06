import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ClientForm } from "@/components/clients/client-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { updateClientAction } from "@/modules/clients/actions";
import { getClientForUser } from "@/modules/clients/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { prisma } from "@/lib/prisma";
import { canChangeRecordResponsible } from "@/permissions";

type EditClientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditClientPage({ params }: EditClientPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [client, users, designers] = await Promise.all([
    getClientForUser(id, user),
    getAssignableUsers(),
    prisma.designer.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, studio: true }
    })
  ]);
  const action = updateClientAction.bind(null, id);

  return (
    <FormPageShell title="Редактировать клиента" description={client.name} cardTitle="Основное">
      <ClientForm
        action={action}
        client={client}
        users={users}
        designers={designers}
        currentUserId={user.id}
        canChangeResponsible={canChangeRecordResponsible(user)}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
