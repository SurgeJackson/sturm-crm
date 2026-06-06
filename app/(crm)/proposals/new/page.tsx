import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { ProposalForm } from "@/components/proposals/proposal-form";
import { prisma } from "@/lib/prisma";
import { createProposalAction } from "@/modules/proposals/actions";
import { getAssignableUsers } from "@/modules/users/queries";
import { canChangeProposalResponsible, canCreateProposal } from "@/permissions";

type NewProposalPageProps = {
  searchParams: Promise<{ dealId?: string }>;
};

export default async function NewProposalPage({ searchParams }: NewProposalPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreateProposal(user)) redirect("/proposals");

  const query = await searchParams;
  const [users, deals] = await Promise.all([
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
