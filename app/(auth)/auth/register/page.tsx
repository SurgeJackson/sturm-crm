import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/auth-action-form";
import { registerAction } from "@/modules/auth/actions";

export default function RegisterPage() {
  return (
    <AuthShell title="Регистрация" description="Создайте учетную запись. Email нужно подтвердить, а доступ активирует руководитель.">
      <RegisterForm action={registerAction} />
    </AuthShell>
  );
}
