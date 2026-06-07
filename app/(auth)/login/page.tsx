import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell title="Вход в STURM CRM" description="Используйте подтвержденную и активированную учетную запись сотрудника.">
      <Suspense>
        <LoginForm />
      </Suspense>
      <div className="mt-5 rounded-md bg-muted p-3 text-xs text-muted-foreground">
        Демо: owner@sturm.local / Sturm12345
      </div>
    </AuthShell>
  );
}
