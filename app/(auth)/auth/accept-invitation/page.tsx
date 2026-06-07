import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordTokenForm } from "@/components/auth/auth-action-form";
import { acceptInvitationAction } from "@/modules/auth/actions";

type AcceptInvitationPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function AcceptInvitationPage({ searchParams }: AcceptInvitationPageProps) {
  const { token = "" } = await searchParams;

  return (
    <AuthShell title="Принять приглашение" description="Создайте пароль и завершите регистрацию в STURM CRM.">
      {token ? <PasswordTokenForm action={acceptInvitationAction} token={token} submitLabel="Принять приглашение" /> : <p className="text-sm text-destructive">Ссылка приглашения недействительна.</p>}
    </AuthShell>
  );
}
