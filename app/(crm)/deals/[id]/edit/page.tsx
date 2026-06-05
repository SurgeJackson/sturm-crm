import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DealForm } from "@/components/deals/deal-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { updateDealAction } from "@/modules/deals/actions";
import { getDealForUser } from "@/modules/deals/queries";
import { getAssignableUsers } from "@/modules/users/queries";
import { canChangeDealResponsible, canEditRecord } from "@/permissions";

type EditDealPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDealPage({ params }: EditDealPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [deal, users, clients, objects, designers] = await Promise.all([
    getDealForUser(id, user),
    getAssignableUsers(),
    prisma.client.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.projectObject.findMany({
      where: { archivedAt: null },
      orderBy: { title: "asc" },
      select: {
        id: true,
        title: true,
        clientId: true,
        designerId: true,
        client: { select: { id: true, name: true } },
        designer: { select: { id: true, name: true, studio: true } }
      }
    }),
    prisma.designer.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true, studio: true } })
  ]);

  if (!canEditRecord(user, deal)) redirect(`/deals/${id}`);

  const action = updateDealAction.bind(null, id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Редактировать сделку</h1>
        <p className="mt-1 text-sm text-muted-foreground">{deal.title}</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent>
          <DealForm
            action={action}
            deal={deal}
            users={users}
            clients={clients}
            objects={objects}
            designers={designers}
            currentUserId={user.id}
            canChangeResponsible={canChangeDealResponsible(user)}
            submitLabel="Сохранить"
          />
        </CardContent>
      </Card>
    </div>
  );
}
