import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { getRequestContext } from "@/lib/request-context";
import { writeSecurityLog } from "@/lib/security-log";
import { runCrmDisciplineCheck } from "@/modules/crm-discipline/full-check";
import { canRunSecurityCheck } from "@/permissions";

export async function POST() {
  const user = await getCurrentUser();
  const context = await getRequestContext();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (!canRunSecurityCheck(user)) {
    await writeSecurityLog({
      action: "PERMISSION_DENIED",
      userId: user.id,
      entityType: "USER",
      entityId: user.id,
      severity: "WARNING",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { operation: "run_crm_discipline_check" }
    });
    return new NextResponse("Forbidden", { status: 403 });
  }

  const result = await runCrmDisciplineCheck(user.id);

  await writeAuditLog({
    entityType: "USER",
    entityId: user.id,
    action: "RUN_CRM_DISCIPLINE_CHECK",
    userId: user.id,
    after: result
  });
  await writeSecurityLog({
    action: "SECURITY_CHECK_RUN",
    userId: user.id,
    entityType: "USER",
    entityId: user.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: result
  });

  return NextResponse.json(result);
}
