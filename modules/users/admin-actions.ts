"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser } from "@/auth/get-current-user";
import { roleLabels } from "@/lib/constants";
import { getRequestContext } from "@/lib/request-context";
import { sendEmail } from "@/lib/email";
import { canAccessSettings } from "@/permissions";
import { enumParam } from "@/modules/crm/param-parsing";
import { activateUser, createUserInvitation, deactivateUser, requestPasswordReset, updateUserRole } from "@/modules/auth/service";

type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

const inviteSchema = z.object({
  name: z.string().min(1, "Укажите имя"),
  email: z.string().email("Укажите корректный email"),
  role: z.enum(["OWNER", "SALES_LEAD", "STORE_MANAGER", "PROJECT_MANAGER", "ADMINISTRATOR"]),
  comment: z.string().nullable()
});

export type AdminUserActionState = {
  errors?: Record<string, string[]>;
  message?: string;
};

function requireOwner(user: Awaited<ReturnType<typeof getCurrentUser>>): CurrentUser {
  if (!canAccessSettings(user)) redirect("/");
  if (!user) redirect("/");
  return user;
}

export async function inviteUserAction(_state: AdminUserActionState, formData: FormData): Promise<AdminUserActionState> {
  const user = requireOwner(await getCurrentUser());
  const parsed = inviteSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: enumParam(String(formData.get("role") ?? ""), roleLabels) ?? "STORE_MANAGER",
    comment: String(formData.get("comment") ?? "") || null
  });
  if (!parsed.success) return { errors: parsed.error.flatten().fieldErrors };

  const result = await createUserInvitation(parsed.data, user.id);
  if (!result.ok) return { message: result.message };
  redirect("/settings/users?invited=1");
}

export async function activateUserAction(id: string) {
  const user = requireOwner(await getCurrentUser());
  await activateUser(id, user.id);
  redirect(`/settings/users/${id}?activated=1`);
}

export async function deactivateUserAction(id: string) {
  const user = requireOwner(await getCurrentUser());
  if (id === user.id) redirect(`/settings/users/${id}?error=selfDeactivate`);
  await deactivateUser(id, user.id);
  redirect(`/settings/users/${id}?deactivated=1`);
}

export async function changeUserRoleAction(id: string, formData: FormData) {
  const user = requireOwner(await getCurrentUser());
  const role = enumParam(String(formData.get("role") ?? ""), roleLabels);
  if (!role) redirect(`/settings/users/${id}?error=role`);
  await updateUserRole(id, role, user.id);
  redirect(`/settings/users/${id}?roleChanged=1`);
}

export async function sendUserPasswordResetAction(id: string, email: string) {
  requireOwner(await getCurrentUser());
  await requestPasswordReset(email, await getRequestContext());
  redirect(`/settings/users/${id}?passwordReset=1`);
}

export async function sendTestEmailAction(formData: FormData) {
  const user = requireOwner(await getCurrentUser());
  const email = String(formData.get("email") ?? "");
  if (!email) redirect("/settings/email?error=email");
  await sendEmail({
    to: email,
    subject: "Тестовое письмо STURM CRM",
    html: "<p>Это тестовое письмо STURM CRM.</p>",
    userId: user.id,
    metadata: { template: "test_email" }
  });
  redirect("/settings/email?sent=1");
}
