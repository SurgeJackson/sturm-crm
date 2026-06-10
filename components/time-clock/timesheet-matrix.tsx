"use client";

import type React from "react";
import { useMemo, useState } from "react";
import { AlertTriangle, BriefcaseBusiness, CalendarOff, Clock, Plane, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  timeAdjustmentActionLabels,
  timeAdjustmentStatusLabels,
  timeEventStatusLabels,
  timeEventTypeLabels,
  timeRiskFlagLabels,
  timesheetDayStatusLabels
} from "@/lib/constants/time-clock";

type MatrixDay = { date: string; day: number; weekday: string; isWeekend: boolean };
type MatrixTimesheetDay = {
  id: string;
  status: string;
  location: { id: string; name: string } | null;
  shift: { id: string; startsAt: string; endsAt: string; breakMinutes: number } | null;
  scheduleDayStatus: { id: string; status: string; comment: string | null } | null;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualCheckIn: string | null;
  actualCheckOut: string | null;
  workedMinutes: number;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  overtimeMinutes: number;
  hasPendingEvents: boolean;
};
type MatrixEvent = {
  id: string;
  type: string;
  status: string;
  occurredAt: string;
  location: { id: string; name: string } | null;
  distanceFromLocationMeters: number | null;
  accuracy: number | null;
  ipAddress: string | null;
  riskFlags: string[];
  reviewComment: string | null;
  reviewedBy: { id: string; name: string } | null;
  reviewedAt: string | null;
};
type MatrixAdjustment = {
  id: string;
  requestedAction: string;
  eventType: string | null;
  requestedOccurredAt: string | null;
  comment: string;
  status: string;
  reviewedBy: { id: string; name: string } | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  createdAt: string;
};
type MatrixAuditLog = {
  id: string;
  action: string;
  user: { id: string; name: string } | null;
  createdAt: string;
};
type MatrixCell = {
  date: string;
  isWeekend: boolean;
  timesheetDay: MatrixTimesheetDay | null;
  events: MatrixEvent[];
  adjustments: MatrixAdjustment[];
  auditLogs: MatrixAuditLog[];
  riskFlags: string[];
};
type MatrixRow = {
  employee: {
    id: string;
    name: string;
    email: string;
    position?: string | null;
    defaultLocation: { id: string; name: string } | null;
  };
  cells: MatrixCell[];
  totals: {
    plannedMinutes: number;
    workedMinutes: number;
    lateCount: number;
    lateMinutes: number;
    earlyLeaveCount: number;
    earlyLeaveMinutes: number;
    pendingReviewCount: number;
    vacationCount: number;
    sickLeaveCount: number;
    businessTripCount: number;
    dayOffCount: number;
  };
};
type MatrixData = {
  location: { id: string; name: string } | null;
  year: number;
  month: number;
  days: MatrixDay[];
  rows: MatrixRow[];
};
type SelectedCell = { row: MatrixRow; cell: MatrixCell } | null;

export function TimesheetMatrix({ data }: { data: MatrixData }) {
  const [selectedCell, setSelectedCell] = useState<SelectedCell>(null);
  const selectedDay = selectedCell?.cell.timesheetDay;

  const totals = useMemo(() => data.rows.reduce((acc, row) => {
    acc.plannedMinutes += row.totals.plannedMinutes;
    acc.workedMinutes += row.totals.workedMinutes;
    acc.lateMinutes += row.totals.lateMinutes;
    acc.pendingReviewCount += row.totals.pendingReviewCount;
    return acc;
  }, { plannedMinutes: 0, workedMinutes: 0, lateMinutes: 0, pendingReviewCount: 0 }), [data.rows]);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 md:grid-cols-4">
        <Metric label="План" value={formatHours(totals.plannedMinutes)} />
        <Metric label="Факт" value={formatHours(totals.workedMinutes)} />
        <Metric label="Опоздания" value={`${totals.lateMinutes} мин`} />
        <Metric label="На проверке" value={String(totals.pendingReviewCount)} />
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <div className="grid min-w-max" style={{ gridTemplateColumns: `240px repeat(${data.days.length}, 86px) 260px` }}>
          <div className="sticky left-0 z-20 border-b border-r bg-card p-3 text-sm font-medium">Сотрудник</div>
          {data.days.map((day) => (
            <div key={day.date} className={cn("border-b border-r p-1.5 text-center text-xs font-medium", day.isWeekend && "bg-muted/50")}>
              <div>{day.day}</div>
              <div className="text-muted-foreground">{day.weekday}</div>
            </div>
          ))}
          <div className="sticky right-0 z-20 border-b border-l bg-card p-3 text-sm font-medium">Итого</div>

          {data.rows.length ? data.rows.map((row) => (
            <div key={row.employee.id} className="contents">
              <div className="sticky left-0 z-10 min-h-20 border-r border-t bg-card p-3">
                <div className="truncate text-sm font-medium">{row.employee.name}</div>
                <div className="truncate text-xs text-muted-foreground">{row.employee.position ?? row.employee.email}</div>
                <div className="mt-1 truncate text-xs text-muted-foreground">{row.employee.defaultLocation?.name ?? data.location?.name ?? "Точка не назначена"}</div>
              </div>
              {row.cells.map((cell) => (
                <div key={`${row.employee.id}:${cell.date}`} className={cn("min-h-20 border-r border-t p-1", cell.isWeekend && "bg-muted/30")}>
                  <button
                    type="button"
                    className={cn(
                      "flex h-[72px] w-[78px] flex-col justify-between rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight transition-colors hover:ring-2 hover:ring-ring",
                      cellTone(cell)
                    )}
                    onClick={() => setSelectedCell({ row, cell })}
                  >
                    <span className="truncate font-medium">{planLabel(cell)}</span>
                    <span className="truncate text-muted-foreground">{factLabel(cell)}</span>
                    <span className="flex items-center gap-1">
                      {cellIcon(cell)}
                      <span className="truncate">{statusShortLabel(cell)}</span>
                    </span>
                  </button>
                </div>
              ))}
              <div className="sticky right-0 min-h-20 border-l border-t bg-card p-3 text-xs">
                <div>План: {formatHours(row.totals.plannedMinutes)}</div>
                <div>Факт: {formatHours(row.totals.workedMinutes)}</div>
                <div className="text-muted-foreground">Опозд.: {row.totals.lateCount} / {row.totals.lateMinutes} мин</div>
                <div className="text-muted-foreground">Ранний: {row.totals.earlyLeaveCount} / {row.totals.earlyLeaveMinutes} мин</div>
                <div className="text-muted-foreground">Review: {row.totals.pendingReviewCount}</div>
                <div className="text-muted-foreground">Отп/Бол/Выезд: {row.totals.vacationCount}/{row.totals.sickLeaveCount}/{row.totals.businessTripCount}</div>
              </div>
            </div>
          )) : (
            <div className="col-span-full border-t p-8 text-center text-sm text-muted-foreground">Нет сотрудников или данных табеля за выбранный период.</div>
          )}
        </div>
      </div>

      <Dialog open={Boolean(selectedCell)} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{selectedCell ? `${selectedCell.row.employee.name} · ${selectedCell.cell.date}` : "Детали дня"}</DialogTitle>
          </DialogHeader>
          {selectedCell ? (
            <div className="max-h-[75vh] space-y-4 overflow-y-auto pr-1">
              <div className="grid gap-2 md:grid-cols-4">
                <Info label="План" value={planDetailLabel(selectedCell.cell)} />
                <Info label="Факт" value={factLabel(selectedCell.cell)} />
                <Info label="Статус" value={selectedDay ? timesheetDayStatusLabels[selectedDay.status as keyof typeof timesheetDayStatusLabels] : "Нет данных"} />
                <Info label="Отработано" value={selectedDay ? formatHours(selectedDay.workedMinutes) : "0 ч"} />
              </div>
              <DetailSection title="События">
                {selectedCell.cell.events.length ? selectedCell.cell.events.map((event) => (
                  <div key={event.id} className="rounded-md border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="font-medium">{timeEventTypeLabels[event.type as keyof typeof timeEventTypeLabels] ?? event.type} · {formatTime(event.occurredAt)}</div>
                      <Badge variant={event.status === "PENDING_REVIEW" ? "warning" : "outline"}>{timeEventStatusLabels[event.status as keyof typeof timeEventStatusLabels] ?? event.status}</Badge>
                    </div>
                    <div className="mt-1 text-muted-foreground">
                      {event.location?.name ?? "Точка не указана"}
                      {event.distanceFromLocationMeters != null ? ` · ${Math.round(event.distanceFromLocationMeters)} м` : ""}
                      {event.accuracy != null ? ` · точность ${Math.round(event.accuracy)} м` : ""}
                    </div>
                    {event.riskFlags.length ? <div className="mt-2">Риски: {event.riskFlags.map((flag) => timeRiskFlagLabels[flag] ?? flag).join("; ")}</div> : null}
                    {event.reviewComment ? <div className="mt-2 text-muted-foreground">Комментарий: {event.reviewComment}</div> : null}
                  </div>
                )) : <EmptyLine text="Событий нет" />}
              </DetailSection>
              <DetailSection title="Корректировки">
                {selectedCell.cell.adjustments.length ? selectedCell.cell.adjustments.map((adjustment) => (
                  <div key={adjustment.id} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">{timeAdjustmentActionLabels[adjustment.requestedAction as keyof typeof timeAdjustmentActionLabels] ?? adjustment.requestedAction}</div>
                    <div className="mt-1 text-muted-foreground">{adjustment.comment}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{timeAdjustmentStatusLabels[adjustment.status as keyof typeof timeAdjustmentStatusLabels] ?? adjustment.status} · {formatDateTime(adjustment.createdAt)}</div>
                    {adjustment.reviewComment ? <div className="mt-2 text-muted-foreground">Решение: {adjustment.reviewComment}</div> : null}
                  </div>
                )) : <EmptyLine text="Корректировок нет" />}
              </DetailSection>
              <DetailSection title="История">
                {selectedCell.cell.auditLogs.length ? selectedCell.cell.auditLogs.map((log) => (
                  <div key={log.id} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">{log.action}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{formatDateTime(log.createdAt)} · {log.user?.name ?? "Система"}</div>
                  </div>
                )) : <EmptyLine text="Истории изменений нет" />}
              </DetailSection>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold">{value}</div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </section>
  );
}

function EmptyLine({ text }: { text: string }) {
  return <div className="rounded-md border p-3 text-sm text-muted-foreground">{text}</div>;
}

function planLabel(cell: MatrixCell) {
  const day = cell.timesheetDay;
  if (!day) return "Нет";
  if (day.shift && day.plannedStart && day.plannedEnd) return `${formatTime(day.plannedStart)}-${formatTime(day.plannedEnd)}`;
  if (day.scheduleDayStatus) return statusShortLabel(cell);
  return "Нет";
}

function planDetailLabel(cell: MatrixCell) {
  const day = cell.timesheetDay;
  if (!day) return "Не назначен";
  if (day.shift && day.plannedStart && day.plannedEnd) return `${formatTime(day.plannedStart)} - ${formatTime(day.plannedEnd)}, перерыв ${day.shift.breakMinutes} мин`;
  if (day.scheduleDayStatus) return `${timesheetDayStatusLabels[day.status as keyof typeof timesheetDayStatusLabels] ?? day.status}${day.scheduleDayStatus.comment ? `: ${day.scheduleDayStatus.comment}` : ""}`;
  return "Не назначен";
}

function factLabel(cell: MatrixCell) {
  const day = cell.timesheetDay;
  if (!day) {
    const checkIn = cell.events.find((event) => event.type === "CHECK_IN");
    const checkOut = cell.events.filter((event) => event.type === "CHECK_OUT").at(-1);
    if (checkIn || checkOut) return `${checkIn ? formatTime(checkIn.occurredAt) : "нет"}/${checkOut ? formatTime(checkOut.occurredAt) : "нет"}`;
    return "Факт: нет";
  }
  const start = day.actualCheckIn ? formatTime(day.actualCheckIn) : "нет";
  const end = day.actualCheckOut ? formatTime(day.actualCheckOut) : "нет";
  return `${start}/${end}`;
}

function statusShortLabel(cell: MatrixCell) {
  const status = cell.timesheetDay?.status;
  if (!status && cell.events.length) return "Факт";
  if (!status) return "Нет";
  if (status === "DAY_OFF") return "Вых";
  if (status === "VACATION") return "Отп";
  if (status === "SICK_LEAVE") return "Бол";
  if (status === "BUSINESS_TRIP") return "Выезд";
  if (status === "PENDING_REVIEW") return "Review";
  if (status === "LATE") return "Опозд";
  if (status === "EARLY_LEAVE") return "Ранний";
  if (status === "LATE_AND_EARLY_LEAVE") return "Оп/Ран";
  if (status === "OK") return "OK";
  if (status === "SCHEDULED") return "План";
  return timesheetDayStatusLabels[status as keyof typeof timesheetDayStatusLabels] ?? status;
}

function cellTone(cell: MatrixCell) {
  const status = cell.timesheetDay?.status;
  if (!cell.timesheetDay && (cell.events.length || cell.riskFlags.length)) return "border-amber-400/70 bg-amber-500/10";
  if (!cell.timesheetDay) return "border-border bg-background text-muted-foreground";
  if (cell.timesheetDay.hasPendingEvents || status === "PENDING_REVIEW" || cell.riskFlags.length) return "border-amber-400/70 bg-amber-500/10";
  if (status === "LATE" || status === "EARLY_LEAVE" || status === "LATE_AND_EARLY_LEAVE" || status === "MISSING_CHECK_IN" || status === "MISSING_CHECK_OUT" || status === "ABSENT") {
    return "border-destructive/70 bg-destructive/10";
  }
  if (status === "VACATION") return "border-sky-500/40 bg-sky-500/10";
  if (status === "SICK_LEAVE") return "border-rose-500/40 bg-rose-500/10";
  if (status === "BUSINESS_TRIP") return "border-blue-500/40 bg-blue-500/10";
  if (status === "DAY_OFF") return "border-muted bg-muted/50 text-muted-foreground";
  return "border-primary/30 bg-primary/10";
}

function cellIcon(cell: MatrixCell) {
  const status = cell.timesheetDay?.status;
  if (cell.timesheetDay?.hasPendingEvents || cell.riskFlags.length) return <AlertTriangle className="h-3 w-3 text-amber-300" />;
  if (status === "DAY_OFF") return <CalendarOff className="h-3 w-3" />;
  if (status === "VACATION") return <Plane className="h-3 w-3" />;
  if (status === "SICK_LEAVE") return <Stethoscope className="h-3 w-3" />;
  if (status === "BUSINESS_TRIP") return <BriefcaseBusiness className="h-3 w-3" />;
  return <Clock className="h-3 w-3" />;
}

function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}
