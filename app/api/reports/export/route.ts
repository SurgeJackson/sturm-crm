import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { getRequestContext } from "@/lib/request-context";
import { writeSecurityLog } from "@/lib/security-log";
import { fallbackReportCsv, reportExporters } from "@/modules/reports/exporters";
import type { ReportSearchParams } from "@/modules/reports/common";
import { enforceSecurityEventLimit } from "@/modules/security/rate-limit";
import { canExportReports } from "@/permissions";

const REPORT_EXPORT_LIMIT_PER_HOUR = 10;

function paramsFromUrl(url: URL): ReportSearchParams {
  return Object.fromEntries(url.searchParams.entries()) as ReportSearchParams;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  const context = await getRequestContext();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const url = new URL(request.url);
  const report = url.searchParams.get("report") ?? "activity";
  const params = paramsFromUrl(url);

  if (!canExportReports(user)) {
    await writeSecurityLog({
      action: "EXPORT_DENIED",
      userId: user.id,
      entityType: "USER",
      entityId: user.id,
      severity: "WARNING",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { report, params }
    });
    return new NextResponse("Недостаточно прав для экспорта данных", { status: 403 });
  }

  const rateLimit = await enforceSecurityEventLimit({
    userId: user.id,
    eventAction: "EXPORT_STARTED",
    deniedAction: "MASS_EXPORT_ATTEMPT",
    limit: REPORT_EXPORT_LIMIT_PER_HOUR,
    since: new Date(Date.now() - 60 * 60 * 1000),
    context,
    metadata: { report, params, exportType: "report" }
  });
  if (!rateLimit.allowed) {
    return new NextResponse("Слишком много экспортов за последний час", { status: 429 });
  }

  await writeSecurityLog({
    action: "EXPORT_STARTED",
    userId: user.id,
    entityType: "USER",
    entityId: user.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { report, params }
  });

  const csv = await (reportExporters[report] ?? (() => Promise.resolve(fallbackReportCsv(report))))(params, user);

  await writeAuditLog({
    entityType: "USER",
    entityId: user.id,
    action: "REPORT_EXPORT",
    userId: user.id,
    after: { report, params }
  });
  await writeSecurityLog({
    action: "EXPORT_COMPLETED",
    userId: user.id,
    entityType: "USER",
    entityId: user.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: { report, params }
  });

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${report}.csv"`
    }
  });
}
