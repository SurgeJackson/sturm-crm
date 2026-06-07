"use server";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ignoreCrmViolation } from "@/modules/crm-discipline/mutations";
import { canIgnoreCrmViolation } from "@/permissions";

export async function ignoreCrmViolationAction(id: string, returnTo: string) {
  const user = await getCurrentUser();
  if (!user || !canIgnoreCrmViolation(user)) {
    redirect(`${returnTo}?error=disciplinePermission`);
  }

  const violation = await ignoreCrmViolation(id, user.id);
  if (!violation) redirect(returnTo);

  redirect(`${returnTo}?disciplineIgnored=1`);
}
