import { AuthShell } from "@/components/auth/auth-shell";
import { EmailOnlyForm } from "@/components/auth/auth-action-form";
import { resendVerificationAction } from "@/modules/auth/actions";

export default function ResendVerificationPage() {
  return (
    <AuthShell title="Подтверждение email" description="Введите email, чтобы получить новую ссылку подтверждения.">
      <EmailOnlyForm action={resendVerificationAction} submitLabel="Отправить письмо" />
    </AuthShell>
  );
}
