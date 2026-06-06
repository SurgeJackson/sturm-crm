import { redirect } from "next/navigation";
import type { ProjectObjectParticipantType } from "@/generated/prisma/client";
import { getCurrentUser } from "@/auth/get-current-user";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { ProjectObjectParticipantForm } from "@/components/objects/project-object-participant-form";
import { createProjectObjectParticipantAction } from "@/modules/objects/actions";
import { getProjectObjectForUser } from "@/modules/objects/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { canManageObjectParticipants } from "@/permissions";

type NewParticipantPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
};

function participantType(value?: string): ProjectObjectParticipantType {
  return value === "IMPLEMENTATION_CONTACT" ? "IMPLEMENTATION_CONTACT" : "PURCHASE_INFLUENCER";
}

export default async function NewObjectParticipantPage({ params, searchParams }: NewParticipantPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const [projectObject, users] = await Promise.all([
    getProjectObjectForUser(id, user),
    getAssignableUsers()
  ]);

  if (!canManageObjectParticipants(user, projectObject)) redirect(`/objects/${id}`);

  const action = createProjectObjectParticipantAction.bind(null, id);

  return (
    <FormPageShell title="Добавить участника объекта" description={projectObject.title} cardTitle="Участник">
      <ProjectObjectParticipantForm
        action={action}
        defaultParticipantType={participantType(query.type)}
        users={users}
        currentUserId={user.id}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
