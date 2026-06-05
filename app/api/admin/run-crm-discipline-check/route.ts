import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { writeAuditLog } from "@/lib/audit-log";
import { runCrmDisciplineCheck } from "@/modules/crm-discipline/service";

export async function POST() {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  if (user.role !== "OWNER") {
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

  return NextResponse.json(result);
}
