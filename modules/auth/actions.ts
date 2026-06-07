"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getRequestContext } from "@/lib/request-context";
import { acceptInvitation, registerUser, requestPasswordReset, resendVerification, resetPassword } from "@/modules/auth/service";
import { passwordSchema } from "@/modules/auth/password";

export type AuthActionState = {
  message?: string;
  success?: boolean;
  errors?: Record<string, string[]>;
};

const registerSchema = z.object({
  name: z.string().min(1, "Укажите имя"),
  email: z.string().email("Укажите корректный email"),
  password: passwordSchema,
  passwordRepeat: z.string().min(1, "Повторите пароль")
}).superRefine((data, ctx) => {
  if (data.password !== data.passwordRepeat) {
    ctx.addIssue({ code: "custom", path: ["passwordRepeat"], message: "Пароли не совпадают" });
  }
});

const emailSchema = z.object({
  email: z.string().email("Укажите корректный email")
});

const passwordResetSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
  passwordRepeat: z.string().min(1, "Повторите пароль")
}).superRefine((data, ctx) => {
  if (data.password !== data.passwordRepeat) {
    ctx.addIssue({ code: "custom", path: ["passwordRepeat"], message: "Пароли не совпадают" });
  }
});

export async function registerAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordRepeat: formData.get("passwordRepeat")
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const result = await registerUser(parsed.data, await getRequestContext());
  if (!result.ok) return { message: result.message };

  return { success: true, message: "Регистрация выполнена. Проверьте почту и подтвердите email. После этого руководитель активирует доступ." };
}

export async function resendVerificationAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const result = await resendVerification(parsed.data.email, await getRequestContext());
  if (result.status === "verified") return { success: true, message: "Email уже подтвержден." };
  return { success: true, message: "Если такой email зарегистрирован, письмо будет отправлено." };
}

export async function forgotPasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  await requestPasswordReset(parsed.data.email, await getRequestContext());
  return { success: true, message: "Если такой email зарегистрирован, ссылка для восстановления будет отправлена." };
}

export async function resetPasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    passwordRepeat: formData.get("passwordRepeat")
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const result = await resetPassword(parsed.data.token, parsed.data.password, await getRequestContext());
  if (result.status === "success") return { success: true, message: "Пароль успешно изменен." };
  if (result.status === "expired") return { message: "Ссылка восстановления устарела." };
  if (result.status === "invalid-password") return { message: result.message };
  return { message: "Ссылка восстановления недействительна." };
}

export async function acceptInvitationAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = passwordResetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    passwordRepeat: formData.get("passwordRepeat")
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const result = await acceptInvitation(parsed.data.token, parsed.data.password);
  if (result.status === "success") redirect("/auth/login?invitation=accepted");
  if (result.status === "expired") return { message: "Ссылка приглашения устарела." };
  if (result.status === "invalid-password") return { message: result.message };
  return { message: "Ссылка приглашения недействительна." };
}
