import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { writeAuditLog } from "@/lib/audit-log";
import { writeSecurityLog } from "@/lib/security-log";
import { fallbackReportCsv, reportExporters } from "@/modules/reports/exporters";
import type { ReportSearchParams } from "@/modules/reports/queries";

function paramsFromUrl(url: URL): ReportSearchParams {
  return Object.fromEntries(url.searchParams.entries()) as ReportSearchParams;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const report = url.searchParams.get("report") ?? "activity";
  const params = paramsFromUrl(url);
  const user = session.user;
  const csv = await (reportExporters[report] ?? (() => Promise.resolve(fallbackReportCsv(report))))(params, user);

  await writeAuditLog({
    entityType: "USER",
    entityId: user.id,
    action: "REPORT_EXPORT",
    userId: user.id,
    after: { report, params }
  });
  if (report === "designer-bonuses") {
    await writeSecurityLog({
      action: "EXPORT_DESIGNER_BONUS_REPORT",
      userId: user.id,
      entityType: "DESIGNER_BONUS_ACCRUAL",
      metadata: { params }
    });
  }

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${report}.csv"`
    }
  });
}
