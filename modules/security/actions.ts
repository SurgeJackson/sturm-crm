"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { getRequestContext } from "@/lib/request-context";
import { writeSecurityLog } from "@/lib/security-log";

export async function acceptConfidentialityAction() {
  const user = await getCurrentUser();
  if (!user) return;

  const context = await getRequestContext();
  await prisma.user.update({
    where: { id: user.id },
    data: { confidentialityAcceptedAt: new Date() }
  });
  await writeSecurityLog({
    action: "CONFIDENTIALITY_ACCEPTED",
    userId: user.id,
    entityType: "USER",
    entityId: user.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent
  });
  revalidatePath("/", "layout");
}
