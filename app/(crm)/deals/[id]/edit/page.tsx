import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DealForm } from "@/components/deals/deal-form";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { getDealFormContext } from "@/modules/crm/form-contexts";
import { updateDealAction } from "@/modules/deals/actions";
import { getDealForUser } from "@/modules/deals/queries";
import { canChangeDealResponsible, canEditRecord } from "@/permissions";

type EditDealPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDealPage({ params }: EditDealPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const [deal, context] = await Promise.all([
    getDealForUser(id, user),
    getDealFormContext(user)
  ]);

  if (!canEditRecord(user, deal)) redirect(`/deals/${id}`);

  const action = updateDealAction.bind(null, id);

  return (
    <FormPageShell title="Редактировать сделку" description={deal.title} cardTitle="Основное">
      <DealForm
        action={action}
        deal={deal}
        users={context.users}
        clients={context.clients}
        objects={context.objects}
        designers={context.designers}
        currentUserId={user.id}
        canChangeResponsible={canChangeDealResponsible(user)}
        submitLabel="Сохранить"
      />
    </FormPageShell>
  );
}
