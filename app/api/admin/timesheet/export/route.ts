import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { rowsToCsv } from "@/modules/reports/csv";
import { getTimesheetDays } from "@/modules/time-clock/queries";
import { timesheetDayStatusLabels } from "@/lib/constants";
import { canViewTimesheet } from "@/permissions";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canViewTimesheet(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const params = Object.fromEntries(request.nextUrl.searchParams.entries());
  const days = await getTimesheetDays(params);
  const csv = rowsToCsv(
    ["Дата", "Сотрудник", "Точка", "План начало", "План конец", "Факт приход", "Факт уход", "Работа, мин", "Опоздание, мин", "Ранний уход, мин", "Переработка, мин", "Статус", "Pending"],
    days.items.map((day) => [
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
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=timesheet.csv"
    }
  });
}
