import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DealForm } from "@/components/deals/deal-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { getDealFormContext } from "@/modules/crm/form-contexts";
import { createDealAction } from "@/modules/deals/actions";
import { canChangeDealResponsible, canCreateDeal } from "@/permissions";

type NewDealPageProps = {
  searchParams: Promise<{ objectId?: string }>;
};

export default async function NewDealPage({ searchParams }: NewDealPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!canCreateDeal(user)) redirect("/deals");

  const query = await searchParams;
  const { users, clients, objects, designers } = await getDealFormContext(user);

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
