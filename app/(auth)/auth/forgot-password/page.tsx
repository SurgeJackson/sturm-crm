import { AuthShell } from "@/components/auth/auth-shell";
import { EmailOnlyForm } from "@/components/auth/auth-action-form";
import { forgotPasswordAction } from "@/modules/auth/actions";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Восстановление пароля" description="Мы отправим ссылку для восстановления, если email зарегистрирован.">
      <EmailOnlyForm action={forgotPasswordAction} submitLabel="Отправить ссылку" />
    </AuthShell>
  );
}
