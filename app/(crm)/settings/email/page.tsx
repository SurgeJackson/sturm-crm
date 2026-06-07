import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendTestEmailAction } from "@/modules/users/admin-actions";
import { canAccessSettings } from "@/permissions";

type EmailSettingsPageProps = {
  searchParams: Promise<{ sent?: string; error?: string }>;
};

export default async function EmailSettingsPage({ searchParams }: EmailSettingsPageProps) {
  const user = await getCurrentUser();
  if (!canAccessSettings(user)) redirect("/");
  const query = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader title="Email" description="Настройки системных писем и Resend." />
      <PageNoticeStack
        notices={[
          { show: Boolean(query.sent), message: "Тестовое письмо отправлено или залогировано в dev-режиме." },
          { show: Boolean(query.error), tone: "destructive", message: "Укажите email получателя." }
        ]}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Resend</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>EMAIL_FROM: {process.env.EMAIL_FROM || "Не задано"}</div>
            <div>SUPPORT_EMAIL: {process.env.SUPPORT_EMAIL || "Не задано"}</div>
            <div>APP_URL: {process.env.APP_URL || process.env.NEXTAUTH_URL || "Не задано"}</div>
            <div>RESEND_API_KEY: {process.env.RESEND_API_KEY ? "Задан" : "Не задан, письма логируются в dev-режиме"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Тестовое письмо</CardTitle></CardHeader>
          <CardContent>
            <form action={sendTestEmailAction} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email получателя</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <Button type="submit">Отправить тест</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
