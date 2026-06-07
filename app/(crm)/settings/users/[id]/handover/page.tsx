import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { FormPageShell } from "@/components/layout/form-page-shell";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { UserHandoverForm } from "@/components/users/user-handover-form";
import { getUserHandover } from "@/modules/users/handover";
import { canDeactivateUser } from "@/permissions";

type HandoverPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function UserHandoverPage({ params, searchParams }: HandoverPageProps) {
  const currentUser = await getCurrentUser();
  if (!canDeactivateUser(currentUser)) redirect("/");

  const [{ id }, query] = await Promise.all([params, searchParams]);
  const handover = await getUserHandover(id);
  if (!handover) notFound();

  return (
    <FormPageShell
      title="Передать дела"
      description={`${handover.user.name} — ${handover.user.email}`}
      cardTitle="Ответственные записи"
    >
      <PageNoticeStack
        notices={[
          { show: query.error === "source", tone: "destructive", message: "Пользователь для передачи дел не найден." },
          { show: Boolean(query.error && query.error !== "source"), tone: "destructive", message: "Выберите активного пользователя для передачи дел." }
        ]}
      />
      <UserHandoverForm handover={handover} />
    </FormPageShell>
  );
}
