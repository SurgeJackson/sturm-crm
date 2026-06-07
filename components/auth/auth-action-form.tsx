"use client";

import { useActionState } from "react";
import Link from "next/link";
import type { AuthActionState } from "@/modules/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InlineNotice } from "@/components/ui/bordered-list-item";

const initialState: AuthActionState = {};

function FieldError({ state, name }: { state: AuthActionState; name: string }) {
  const error = state.errors?.[name]?.[0];
  return error ? <p className="text-sm text-destructive">{error}</p> : null;
}

function FormNotice({ state }: { state: AuthActionState }) {
  if (!state.message) return null;
  return <InlineNotice tone={state.success ? "primary" : "destructive"}>{state.message}</InlineNotice>;
}

export function RegisterForm({ action }: { action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState> }) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <FormNotice state={state} />
      <div className="space-y-2">
        <Label htmlFor="name">Имя</Label>
        <Input id="name" name="name" autoComplete="name" required />
        <FieldError state={state} name="name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" autoComplete="email" type="email" required />
        <FieldError state={state} name="email" />
      </div>
      <PasswordFields state={state} />
      <Button className="w-full" type="submit" disabled={isPending}>{isPending ? "Регистрация..." : "Зарегистрироваться"}</Button>
      <AuthLinks />
    </form>
  );
}

export function EmailOnlyForm({
  action,
  submitLabel
}: {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <FormNotice state={state} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" autoComplete="email" type="email" required />
        <FieldError state={state} name="email" />
      </div>
      <Button className="w-full" type="submit" disabled={isPending}>{isPending ? "Отправка..." : submitLabel}</Button>
      <AuthLinks />
    </form>
  );
}

export function PasswordTokenForm({
  action,
  token,
  submitLabel
}: {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  token: string;
  submitLabel: string;
}) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  return (
    <form action={formAction} className="space-y-4">
      <FormNotice state={state} />
      <input type="hidden" name="token" value={token} />
      <PasswordFields state={state} />
      <Button className="w-full" type="submit" disabled={isPending}>{isPending ? "Сохранение..." : submitLabel}</Button>
      <AuthLinks />
    </form>
  );
}

function PasswordFields({ state }: { state: AuthActionState }) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="password">Пароль</Label>
        <Input id="password" name="password" autoComplete="new-password" type="password" required />
        <FieldError state={state} name="password" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="passwordRepeat">Повтор пароля</Label>
        <Input id="passwordRepeat" name="passwordRepeat" autoComplete="new-password" type="password" required />
        <FieldError state={state} name="passwordRepeat" />
      </div>
    </>
  );
}

function AuthLinks() {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
      <Link className="hover:underline" href="/auth/login">Войти</Link>
      <Link className="hover:underline" href="/auth/register">Зарегистрироваться</Link>
      <Link className="hover:underline" href="/auth/forgot-password">Забыли пароль?</Link>
    </div>
  );
}
