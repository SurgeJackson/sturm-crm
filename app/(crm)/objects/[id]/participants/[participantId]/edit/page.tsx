import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { ProjectObjectParticipantForm } from "@/components/objects/project-object-participant-form";
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
    <FormPageShell title="Редактировать участника" description={object.title} cardTitle={participant.fullName}>
      <ProjectObjectParticipantForm
        action={action}
        participant={participant}
        users={users}
        currentUserId={user.id}
        objectId={id}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
