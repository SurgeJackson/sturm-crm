import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { ProposalForm } from "@/components/proposals/proposal-form";
import { getProposalFormContext } from "@/modules/crm/form-contexts";
import { updateProposalAction } from "@/modules/proposals/actions";
import { getProposalForUser } from "@/modules/proposals/queries";
import { canChangeProposalResponsible, canEditRecord } from "@/permissions";

type EditProposalPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProposalPage({ params }: EditProposalPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [proposal, context] = await Promise.all([
    getProposalForUser(id, user),
    getProposalFormContext(user)
  ]);

  if (!canEditRecord(user, proposal)) redirect(`/proposals/${id}`);

  return (
    <FormPageShell title="Редактировать КП" description={proposal.proposalNumber} cardTitle="Основное">
      <ProposalForm
        action={updateProposalAction.bind(null, id)}
        proposal={proposal}
        deals={context.deals}
        users={context.users}
        currentUserId={user.id}
        canChangeResponsible={canChangeProposalResponsible(user)}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
