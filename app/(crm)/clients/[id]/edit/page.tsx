import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Редактировать клиента</h1>
        <p className="mt-1 text-sm text-muted-foreground">{client.name}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent>
          <ClientForm
            action={action}
            client={client}
            users={users}
            designers={designers}
            currentUserId={user.id}
            canChangeResponsible={canChangeRecordResponsible(user)}
            submitLabel="Сохранить"
          />
        </CardContent>
      </Card>
    </div>
  );
}
