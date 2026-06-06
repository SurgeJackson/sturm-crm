import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ProjectObjectForm } from "@/components/objects/project-object-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { getObjectFormContext } from "@/modules/crm/form-contexts";
import { updateProjectObjectAction } from "@/modules/objects/actions";
import { getProjectObjectForUser } from "@/modules/objects/queries";
import { canChangeObjectResponsible, canEditRecord } from "@/permissions";

type EditObjectPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditObjectPage({ params }: EditObjectPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [projectObject, context] = await Promise.all([
    getProjectObjectForUser(id, user),
    getObjectFormContext(user)
  ]);

  if (!canEditRecord(user, projectObject)) redirect(`/objects/${id}`);

  const action = updateProjectObjectAction.bind(null, id);

  return (
    <FormPageShell title="Редактировать объект" description={projectObject.title} cardTitle="Основное">
      <ProjectObjectForm
        action={action}
        projectObject={projectObject}
        users={context.users}
        clients={context.clients}
        designers={context.designers}
        currentUserId={user.id}
        canChangeResponsible={canChangeObjectResponsible(user)}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
