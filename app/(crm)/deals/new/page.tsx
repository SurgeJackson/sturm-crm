import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DealForm } from "@/components/deals/deal-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
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
    <FormPageShell title="Создать сделку" description="Свяжите сделку с объектом, клиентом и ответственным менеджером." cardTitle="Основное">
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
    </FormPageShell>
  );
}
