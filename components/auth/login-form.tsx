"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authErrorMessages } from "@/modules/auth/errors";
import Link from "next/link";

export function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("owner@sturm.local");
  const [password, setPassword] = useState("Sturm12345");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const queryError = searchParams.get("error");
  const rawCallbackUrl = searchParams.get("callbackUrl");
  const visibleError = error ?? (queryError ? authErrorMessages[queryError] ?? "Не удалось выполнить вход." : null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const callbackUrl = safeCallbackUrl(rawCallbackUrl);
    let result;
    try {
      result = await signIn("credentials", {
        email,
        password,
        redirect: false,
        callbackUrl
      });
    } catch {
      setIsLoading(false);
      setError("Не удалось выполнить вход. Проверьте подключение и повторите попытку.");
      return;
    }

    setIsLoading(false);

    if (result?.error) {
      setError(authErrorMessages[result.error] ?? "Неверный email или пароль.");
      return;
    }

    window.location.assign(safeCallbackUrl(result?.url ?? callbackUrl));
  }

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          autoComplete="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input
          id="password"
          autoComplete="current-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      {visibleError ? <p className="text-sm text-destructive">{visibleError}</p> : null}
      {searchParams.get("invitation") === "accepted" ? (
        <p className="text-sm text-muted-foreground">Приглашение принято. Теперь можно войти.</p>
      ) : null}
      <Button className="w-full" type="submit" disabled={isLoading}>
        <LogIn className="h-4 w-4" />
        {isLoading ? "Вход..." : "Войти"}
      </Button>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <Link className="hover:underline" href="/auth/forgot-password">Забыли пароль?</Link>
        <Link className="hover:underline" href="/auth/register">Зарегистрироваться</Link>
        <Link className="hover:underline" href="/auth/resend-verification">Подтвердить email</Link>
      </div>
    </form>
  );
}

function safeCallbackUrl(value: string | null) {
  if (!value) return "/";
  if (value.startsWith("/") && !value.startsWith("//")) return value;

  try {
    const url = new URL(value);
    if (url.origin === window.location.origin) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  } catch {
    return "/";
  }

  return "/";
}
