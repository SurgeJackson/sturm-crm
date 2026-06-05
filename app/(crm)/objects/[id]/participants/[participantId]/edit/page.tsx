import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ProjectObjectParticipantForm } from "@/components/objects/project-object-participant-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { updateProjectObjectParticipantAction } from "@/modules/objects/actions";
import { getProjectObjectParticipantForUser } from "@/modules/objects/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { canManageObjectParticipants } from "@/permissions";

type EditParticipantPageProps = {
  params: Promise<{ id: string; participantId: string }>;
};

export default async function EditObjectParticipantPage({ params }: EditParticipantPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id, participantId } = await params;
  const [{ object, participant }, users] = await Promise.all([
    getProjectObjectParticipantForUser(id, participantId, user),
    getAssignableUsers()
  ]);

  if (!canManageObjectParticipants(user, object)) redirect(`/objects/${id}`);

  const action = updateProjectObjectParticipantAction.bind(null, id, participantId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Редактировать участника</h1>
        <p className="mt-1 text-sm text-muted-foreground">{object.title}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>{participant.fullName}</CardTitle></CardHeader>
        <CardContent>
          <ProjectObjectParticipantForm
            action={action}
            participant={participant}
            users={users}
            currentUserId={user.id}
            submitLabel="Сохранить"
          />
        </CardContent>
      </Card>
    </div>
  );
}
