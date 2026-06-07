import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Mail, ShieldCheck, Users } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canAccessSettings } from "@/permissions";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!canAccessSettings(user)) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Настройки" description="Пользователи, права доступа, безопасность и системные email." />
      <div className="grid gap-4 md:grid-cols-3">
        <SettingsLink href="/settings/users" title="Пользователи" description="Список, роли, активация и приглашения." icon={<Users className="h-5 w-5" />} />
        <SettingsLink href="/settings/permissions" title="Права доступа" description="Матрица прав по ролям CRM." icon={<ShieldCheck className="h-5 w-5" />} />
        <SettingsLink href="/settings/email" title="Email" description="Resend, отправитель и тестовые письма." icon={<Mail className="h-5 w-5" />} />
      </div>
    </div>
  );
}

function SettingsLink({ href, title, description, icon }: { href: string; title: string; description: string; icon: ReactNode }) {
  return (
    <Link href={href}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader className="flex flex-row items-center gap-3">
          {icon}
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{description}</CardContent>
      </Card>
    </Link>
  );
}
