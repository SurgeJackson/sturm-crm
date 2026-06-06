import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DesignerForm } from "@/components/designers/designer-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { updateDesignerAction } from "@/modules/designers/actions";
import { getDesignerForUser } from "@/modules/designers/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { canChangeRecordResponsible } from "@/permissions";

type EditDesignerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDesignerPage({ params }: EditDesignerPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [designer, users] = await Promise.all([getDesignerForUser(id, user), getAssignableUsers()]);
  const action = updateDesignerAction.bind(null, id);

  return (
    <FormPageShell title="Редактировать дизайнера" description={designer.name} cardTitle="Основное">
      <DesignerForm
        action={action}
        designer={designer}
        users={users}
        currentUserId={user.id}
        canChangeResponsible={canChangeRecordResponsible(user)}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
