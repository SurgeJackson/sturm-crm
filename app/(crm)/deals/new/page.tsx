import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DealForm } from "@/components/deals/deal-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { createDealAction } from "@/modules/deals/actions";
import { getAssignableUsers } from "@/modules/users/queries";
import { canChangeDealResponsible, canCreateDeal } from "@/permissions";

type NewDealPageProps = {
  searchParams: Promise<{ objectId?: string }>;
};

export default async function NewDealPage({ searchParams }: NewDealPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreateDeal(user)) redirect("/deals");

  const query = await searchParams;
  const [users, clients, objects, designers] = await Promise.all([
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Создать сделку</h1>
        <p className="mt-1 text-sm text-muted-foreground">Свяжите сделку с объектом, клиентом и ответственным менеджером.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Основное</CardTitle></CardHeader>
        <CardContent>
          <DealForm
            action={createDealAction}
            users={users}
            clients={clients}
            objects={objects}
            designers={designers}
            currentUserId={user.id}
            canChangeResponsible={canChangeDealResponsible(user)}
            preselectedObjectId={query.objectId}
            submitLabel="Сохранить"
          />
        </CardContent>
      </Card>
    </div>
  );
}
