import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { ProposalForm } from "@/components/proposals/proposal-form";
import { getProposalFormContext } from "@/modules/crm/form-contexts";
import { createProposalAction } from "@/modules/proposals/actions";
import { canChangeProposalResponsible, canCreateProposal } from "@/permissions";

type NewProposalPageProps = {
  searchParams: Promise<{ dealId?: string }>;
};

export default async function NewProposalPage({ searchParams }: NewProposalPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreateProposal(user)) redirect("/proposals");

  const query = await searchParams;
  const { users, deals } = await getProposalFormContext(user);

  return (
    <FormPageShell title="Создать КП" description="Выберите сделку, сумму, статус, получателя и файл КП." cardTitle="Основное">
      <ProposalForm
        action={createProposalAction}
        deals={deals}
        users={users}
        currentUserId={user.id}
        canChangeResponsible={canChangeProposalResponsible(user)}
        preselectedDealId={query.dealId}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
