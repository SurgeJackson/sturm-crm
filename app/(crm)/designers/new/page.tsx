import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DesignerForm } from "@/components/designers/designer-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createDesignerAction } from "@/modules/designers/actions";
import { getAssignableUsers } from "@/modules/users/queries";
import { canChangeRecordResponsible } from "@/permissions";

export default async function NewDesignerPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const users = await getAssignableUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Создать дизайнера</h1>
        <p className="mt-1 text-sm text-muted-foreground">Добавьте контакт, этап отношений и следующий шаг.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent>
          <DesignerForm
            action={createDesignerAction}
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
