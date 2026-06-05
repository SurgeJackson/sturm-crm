import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ProjectObjectForm } from "@/components/objects/project-object-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { updateProjectObjectAction } from "@/modules/objects/actions";
import { getProjectObjectForUser } from "@/modules/objects/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { canChangeObjectResponsible, canEditRecord } from "@/permissions";

type EditObjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditObjectPage({ params }: EditObjectPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [projectObject, users, clients, designers] = await Promise.all([
    getProjectObjectForUser(id, user),
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

  if (!canEditRecord(user, projectObject)) redirect(`/objects/${id}`);

  const action = updateProjectObjectAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Редактировать объект</h1>
        <p className="mt-1 text-sm text-muted-foreground">{projectObject.title}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent>
          <ProjectObjectForm
            action={action}
            projectObject={projectObject}
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
