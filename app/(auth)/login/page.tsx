import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Вход в STURM CRM</CardTitle>
          <CardDescription>Используйте учетную запись сотрудника компании.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense>
            <LoginForm />
          </Suspense>
          <div className="mt-5 rounded-md bg-muted p-3 text-xs text-muted-foreground">
            Демо: owner@sturm.local / Sturm12345
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
