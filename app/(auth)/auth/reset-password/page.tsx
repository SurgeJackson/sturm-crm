import { AuthShell } from "@/components/auth/auth-shell";
import { PasswordTokenForm } from "@/components/auth/auth-action-form";
import { resetPasswordAction } from "@/modules/auth/actions";

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token = "" } = await searchParams;

  return (
    <AuthShell title="Новый пароль" description="Задайте новый пароль для учетной записи STURM CRM.">
      {token ? <PasswordTokenForm action={resetPasswordAction} token={token} submitLabel="Изменить пароль" /> : <p className="text-sm text-destructive">Ссылка восстановления недействительна.</p>}
    </AuthShell>
  );
}
