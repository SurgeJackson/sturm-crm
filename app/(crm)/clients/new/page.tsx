import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Создать клиента</h1>
        <p className="mt-1 text-sm text-muted-foreground">Заполните обязательные поля и контакт клиента.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent>
          <ClientForm
            action={createClientAction}
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
