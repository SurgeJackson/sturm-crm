import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { getRequestContext } from "@/lib/request-context";
import { verifyEmailToken } from "@/modules/auth/service";

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string }>;
};

function messageForStatus(status: string) {
  if (status === "success") return "Email подтвержден. Доступ к CRM активирует руководитель.";
  if (status === "expired") return "Ссылка подтверждения устарела.";
  return "Ссылка подтверждения недействительна.";
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token = "" } = await searchParams;
  const result = token ? await verifyEmailToken(token, await getRequestContext()) : { status: "invalid" as const };

  return (
    <AuthShell title="Подтверждение email" description={messageForStatus(result.status)}>
      <div className="flex flex-wrap gap-3">
        <Button asChild><Link href="/auth/login">Войти</Link></Button>
        <Button asChild variant="outline"><Link href="/auth/resend-verification">Отправить письмо повторно</Link></Button>
      </div>
    </AuthShell>
  );
}
