import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DesignerForm } from "@/components/designers/designer-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Редактировать дизайнера</h1>
        <p className="mt-1 text-sm text-muted-foreground">{designer.name}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent>
          <DesignerForm
            action={action}
            designer={designer}
            users={users}
            currentUserId={user.id}
            canChangeResponsible={canChangeRecordResponsible(user)}
            submitLabel="Сохранить"
          />
        </CardContent>
      </Card>
    </div>
  );
}
