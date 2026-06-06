import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ProjectObjectForm } from "@/components/objects/project-object-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
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
    <FormPageShell title="Редактировать объект" description={projectObject.title} cardTitle="Основное">
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
    </FormPageShell>
  );
}
