import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ClientForm } from "@/components/clients/client-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { createClientAction } from "@/modules/clients/actions";
import { getAssignableUsers } from "@/modules/users/queries";
import { prisma } from "@/lib/prisma";
import { canChangeRecordResponsible } from "@/permissions";

export default async function NewClientPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [users, designers] = await Promise.all([
    getAssignableUsers(),
    prisma.designer.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, studio: true }
    })
  ]);

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
