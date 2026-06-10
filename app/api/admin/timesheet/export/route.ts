import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { writeAuditLog } from "@/lib/audit-log";
import { rowsToCsv } from "@/modules/reports/csv";
import { rowsToXlsx } from "@/modules/reports/xlsx";
import { getTimesheetDays, getTimesheetMatrix } from "@/modules/time-clock/queries";
import { timesheetDayStatusLabels } from "@/lib/constants";
import { canViewTimesheet } from "@/permissions";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canViewTimesheet(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const format = params.format === "xlsx" ? "xlsx" : "csv";
  const isMatrix = params.view === "matrix";

  if (isMatrix) {
    const matrix = await getTimesheetMatrix(params);
    const rows = [
      ["Сотрудник", "Email", ...matrix.days.map((day) => `${day.date} ${day.weekday}`), "План, мин", "Факт, мин", "Опоздание, мин", "Ранний уход, мин", "Pending review", "Отпуск", "Больничный", "Командировка"],
      ...matrix.rows.map((row) => [
        row.employee.name,
        row.employee.email,
        ...row.cells.map((cell) => exportCellLabel(cell)),
        row.totals.plannedMinutes,
        row.totals.workedMinutes,
        row.totals.lateMinutes,
        row.totals.earlyLeaveMinutes,
        row.totals.pendingReviewCount,
        row.totals.vacationCount,
        row.totals.sickLeaveCount,
        row.totals.businessTripCount
      ])
    ];
    await writeAuditLog({
      entityType: matrix.location ? "WORK_LOCATION" : "TIMESHEET_DAY",
      entityId: matrix.location?.id ?? `timesheet:${matrix.year}:${matrix.month}`,
      action: "timesheet_matrix.exported",
      userId: user.id,
      after: { format, locationId: matrix.location?.id ?? null, year: matrix.year, month: matrix.month }
    });
    return exportRows(rows, `timesheet-matrix-${matrix.year}-${String(matrix.month).padStart(2, "0")}.${format}`, format);
  }

  const days = await getTimesheetDays(params);
  const rows = [
    ["Дата", "Сотрудник", "Точка", "План начало", "План конец", "Факт приход", "Факт уход", "Работа, мин", "Опоздание, мин", "Ранний уход, мин", "Переработка, мин", "Статус", "Pending"],
    ...days.items.map((day) => [
      day.date,
      day.employee.user.name,
      day.location?.name,
      day.plannedStart?.toISOString(),
      day.plannedEnd?.toISOString(),
      day.actualCheckIn?.toISOString(),
      day.actualCheckOut?.toISOString(),
      day.workedMinutes,
      day.lateMinutes,
      day.earlyLeaveMinutes,
      day.overtimeMinutes,
      timesheetDayStatusLabels[day.status],
      day.hasPendingEvents ? "Да" : "Нет"
    ])
  ];
  await writeAuditLog({
    entityType: "TIMESHEET_DAY",
    entityId: "timesheet:list",
    action: "timesheet.exported",
    userId: user.id,
    after: { format, params }
  });
  return exportRows(rows, `timesheet.${format}`, format);
}

function exportRows(rows: Array<Array<string | number | null | undefined>>, filename: string, format: "csv" | "xlsx") {
  if (format === "xlsx") {
    return new NextResponse(rowsToXlsx("Табель", rows), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename=${filename}`
      }
    });
  }
  return new NextResponse(rowsToCsv(rows[0].map(String), rows.slice(1)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename=${filename}`
    }
  });
}

function exportCellLabel(cell: {
  timesheetDay: {
    status: string;
    plannedStart: string | null;
    plannedEnd: string | null;
    actualCheckIn: string | null;
    actualCheckOut: string | null;
    workedMinutes: number;
    lateMinutes: number;
    earlyLeaveMinutes: number;
  } | null;
  events: Array<{ type: string; occurredAt: string }>;
}) {
  const day = cell.timesheetDay;
  if (!day && !cell.events.length) return "";
  const plan = day?.plannedStart && day.plannedEnd ? `${formatTime(day.plannedStart)}-${formatTime(day.plannedEnd)}` : timesheetDayStatusLabels[day?.status as keyof typeof timesheetDayStatusLabels] ?? "";
  const fact = day?.actualCheckIn || day?.actualCheckOut
    ? `${day.actualCheckIn ? formatTime(day.actualCheckIn) : "нет"}/${day.actualCheckOut ? formatTime(day.actualCheckOut) : "нет"}`
    : "";
  const metrics = day ? `работа ${day.workedMinutes}м, опозд ${day.lateMinutes}м, ранний ${day.earlyLeaveMinutes}м` : "";
  return [plan, fact, metrics].filter(Boolean).join("; ");
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
