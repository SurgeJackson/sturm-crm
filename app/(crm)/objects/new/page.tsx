import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ProjectObjectForm } from "@/components/objects/project-object-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { getObjectFormContext } from "@/modules/crm/form-contexts";
import { createProjectObjectAction } from "@/modules/objects/actions";
import { canChangeObjectResponsible, canCreateObject } from "@/permissions";

export default async function NewObjectPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreateObject(user)) redirect("/objects");

  const { users, clients, designers } = await getObjectFormContext(user);

  return (
    <FormPageShell title="Создать объект" description="Укажите клиента, ответственного и базовую структуру проектной продажи." cardTitle="Основное">
      <ProjectObjectForm
        action={createProjectObjectAction}
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
