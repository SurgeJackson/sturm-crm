import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { rowsToCsv } from "@/modules/reports/csv";
import { rowsToXlsx } from "@/modules/reports/xlsx";
import { getMonthDays } from "@/modules/schedule-planner/utils";
import { canViewSchedulePlanner } from "@/permissions";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canViewSchedulePlanner(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const { id } = await params;
  const format = request.nextUrl.searchParams.get("format") === "xlsx" ? "xlsx" : "csv";

  const plan = await prisma.schedulePlan.findUnique({
    where: { id },
    include: {
      location: true,
      cells: {
        include: {
          employee: { include: { user: { select: { name: true, email: true } } } },
          shiftTemplate: true
        },
        orderBy: [{ employee: { user: { name: "asc" } } }, { date: "asc" }]
      }
    }
  });
  if (!plan) return NextResponse.json({ message: "График не найден" }, { status: 404 });

  const days = getMonthDays(plan.year, plan.month);
  const employees = [...new Map(plan.cells.map((cell) => [cell.employeeId, cell.employee])).values()]
    .sort((left, right) => left.user.name.localeCompare(right.user.name, "ru"));
  const cellsByKey = new Map(plan.cells.map((cell) => [`${cell.employeeId}:${cell.date}`, cell]));
  const rows = [
    ["Сотрудник", "Email", ...days.map((day) => `${day.date} ${day.weekday}`)],
    ...employees.map((employee) => [
      employee.user.name,
      employee.user.email,
      ...days.map((day) => scheduleCellExportLabel(cellsByKey.get(`${employee.id}:${day.date}`)))
    ])
  ];

  await writeAuditLog({
    entityType: "SCHEDULE_PLAN",
    entityId: plan.id,
    action: "schedule_plan.exported",
    userId: user.id,
    after: { format, version: plan.version, locationId: plan.locationId, year: plan.year, month: plan.month }
  });

  const filename = `schedule-plan-${plan.location.code}-${plan.year}-${String(plan.month).padStart(2, "0")}-v${plan.version}.${format}`;
  if (format === "xlsx") {
    return new NextResponse(rowsToXlsx("График", rows), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=${filename}`
      }
    });
  }
  return new NextResponse(rowsToCsv(rows[0], rows.slice(1)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`
    }
  });
}

function scheduleCellExportLabel(cell?: {
  cellType: string;
  shiftTemplate?: { name: string; startsAt: string; endsAt: string } | null;
  comment?: string | null;
}) {
  if (!cell || cell.cellType === "EMPTY") return "";
  if (cell.cellType === "SHIFT") return cell.shiftTemplate ? `${cell.shiftTemplate.name} ${cell.shiftTemplate.startsAt}-${cell.shiftTemplate.endsAt}` : "Смена";
  const label = cell.cellType === "DAY_OFF"
    ? "Выходной"
    : cell.cellType === "VACATION"
      ? "Отпуск"
      : cell.cellType === "SICK_LEAVE"
        ? "Больничный"
        : "Командировка";
  return cell.comment ? `${label}: ${cell.comment}` : label;
}
