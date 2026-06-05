import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ProposalForm } from "@/components/proposals/proposal-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Создать КП</h1>
        <p className="mt-1 text-sm text-muted-foreground">Выберите сделку, сумму, статус, получателя и файл КП.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent>
          <ProposalForm
            action={createProposalAction}
            deals={deals}
            users={users}
            currentUserId={user.id}
            canChangeResponsible={canChangeProposalResponsible(user)}
            preselectedDealId={query.dealId}
            submitLabel="Сохранить"
          />
        </CardContent>
      </Card>
    </div>
  );
}
