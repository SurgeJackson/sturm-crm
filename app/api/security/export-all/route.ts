import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { getRequestContext } from "@/lib/request-context";
import { writeSecurityLog } from "@/lib/security-log";
import { rowsToCsv } from "@/modules/reports/csv";
import { enforceSecurityEventLimit } from "@/modules/security/rate-limit";
import { canExportAllData } from "@/permissions";

const FULL_EXPORT_LIMIT_PER_HOUR = 3;

export async function GET() {
  const user = await getCurrentUser();
  const context = await getRequestContext();

  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (!canExportAllData(user)) {
    await writeSecurityLog({
      action: "EXPORT_DENIED",
      userId: user.id,
      entityType: "USER",
      entityId: user.id,
      severity: "WARNING",
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      metadata: { exportType: "all_data" }
    });
    return new NextResponse("Недостаточно прав для экспорта данных", { status: 403 });
  }

  const rateLimit = await enforceSecurityEventLimit({
    userId: user.id,
    eventAction: "EXPORT_STARTED",
    deniedAction: "MASS_EXPORT_ATTEMPT",
    limit: FULL_EXPORT_LIMIT_PER_HOUR,
    since: new Date(Date.now() - 60 * 60 * 1000),
    context,
    metadata: { exportType: "all_data" }
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
    metadata: { exportType: "all_data" }
  });

  const [clients, designers, objects, deals, proposals, tasks] = await Promise.all([
    prisma.client.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.designer.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.projectObject.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.deal.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.commercialProposal.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.taskActivity.findMany({ orderBy: { createdAt: "desc" } })
  ]);

  const csv = [
    rowsToCsv(["Секция", "ID", "Название", "Ответственный", "Создано", "Архивировано"], clients.map((item) => ["Клиент", item.id, item.name, item.responsibleId, item.createdAt.toISOString(), item.archivedAt?.toISOString() ?? ""])),
    rowsToCsv(["Секция", "ID", "Название", "Ответственный", "Создано", "Архивировано"], designers.map((item) => ["Дизайнер", item.id, item.name, item.responsibleId, item.createdAt.toISOString(), item.archivedAt?.toISOString() ?? ""])),
    rowsToCsv(["Секция", "ID", "Название", "Ответственный", "Создано", "Архивировано"], objects.map((item) => ["Объект", item.id, item.title, item.responsibleId, item.createdAt.toISOString(), item.archivedAt?.toISOString() ?? ""])),
    rowsToCsv(["Секция", "ID", "Название", "Ответственный", "Создано", "Архивировано"], deals.map((item) => ["Сделка", item.id, item.title, item.responsibleId, item.createdAt.toISOString(), item.archivedAt?.toISOString() ?? ""])),
    rowsToCsv(["Секция", "ID", "Название", "Ответственный", "Создано", "Архивировано"], proposals.map((item) => ["КП", item.id, item.proposalNumber, item.responsibleId, item.createdAt.toISOString(), item.archivedAt?.toISOString() ?? ""])),
    rowsToCsv(["Секция", "ID", "Название", "Ответственный", "Создано", "Архивировано"], tasks.map((item) => [item.recordType, item.id, item.title, item.responsibleId, item.createdAt.toISOString(), item.archivedAt?.toISOString() ?? ""]))
  ].join("\n\n");

  await writeSecurityLog({
    action: "EXPORT_COMPLETED",
    userId: user.id,
    entityType: "USER",
    entityId: user.id,
    ipAddress: context.ipAddress,
    userAgent: context.userAgent,
    metadata: {
      exportType: "all_data",
      counts: { clients: clients.length, designers: designers.length, objects: objects.length, deals: deals.length, proposals: proposals.length, tasks: tasks.length }
    }
  });

  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": "attachment; filename=\"sturm-crm-export.csv\""
    }
  });
}
