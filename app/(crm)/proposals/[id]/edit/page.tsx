import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { ProposalForm } from "@/components/proposals/proposal-form";
import { prisma } from "@/lib/prisma";
import { updateProposalAction } from "@/modules/proposals/actions";
import { getProposalForUser } from "@/modules/proposals/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { canChangeProposalResponsible, canEditRecord } from "@/permissions";

type EditProposalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProposalPage({ params }: EditProposalPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [proposal, users, deals] = await Promise.all([
    getProposalForUser(id, user),
    getAssignableUsers(),
    prisma.deal.findMany({
      where: { archivedAt: null },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        clientId: true,
        objectId: true,
        designerId: true,
        responsibleId: true,
        client: { select: { id: true, name: true } },
        projectObject: { select: { id: true, title: true } },
        designer: { select: { id: true, name: true, studio: true } },
        responsible: { select: { id: true, name: true } }
      }
    })
  ]);

  if (!canEditRecord(user, proposal)) redirect(`/proposals/${id}`);

  return (
    <FormPageShell title="Редактировать КП" description={proposal.proposalNumber} cardTitle="Основное">
      <ProposalForm
        action={updateProposalAction.bind(null, id)}
        proposal={proposal}
        deals={deals}
        users={users}
        currentUserId={user.id}
        canChangeResponsible={canChangeProposalResponsible(user)}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
