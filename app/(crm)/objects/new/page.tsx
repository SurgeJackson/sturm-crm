import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ProjectObjectForm } from "@/components/objects/project-object-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { createProjectObjectAction } from "@/modules/objects/actions";
import { getAssignableUsers } from "@/modules/users/queries";
import { canChangeObjectResponsible, canCreateObject } from "@/permissions";

export default async function NewObjectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreateObject(user)) redirect("/objects");

  const [users, clients, designers] = await Promise.all([
    getAssignableUsers(),
    prisma.client.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true, email: true }
    }),
    prisma.designer.findMany({
      where: { archivedAt: null },
      orderBy: { name: "asc" },
      select: { id: true, name: true, studio: true }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Создать объект</h1>
        <p className="mt-1 text-sm text-muted-foreground">Укажите клиента, ответственного и базовую структуру проектной продажи.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent>
          <ProjectObjectForm
            action={createProjectObjectAction}
            users={users}
            clients={clients}
            designers={designers}
            currentUserId={user.id}
            canChangeResponsible={canChangeObjectResponsible(user)}
            submitLabel="Сохранить"
          />
        </CardContent>
      </Card>
    </div>
  );
}
