"use client";

import type { CSSProperties, ReactNode } from "react";
import { useMemo, useState } from "react";
import { AlertTriangle, CalendarRange, CheckCircle2, Download, GitBranchPlus, Rows3, Printer, RotateCcw, Send } from "lucide-react";
import type { SchedulePlanCellType, SchedulePlanStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Day = { date: string; day: number; weekday: string; isWeekend: boolean };
type Employee = { employeeId: string; userId: string; name: string; email: string; position?: string | null };
type ShiftTemplate = { id: string; name: string; code: string; startsAt: string; endsAt: string; breakMinutes?: number | null; color?: string | null; isActive: boolean };
type SchedulePlan = {
  id: string;
  status: SchedulePlanStatus;
  version: number;
  title?: string | null;
  returnComment?: string | null;
};
type ScheduleCell = {
  id: string;
  schedulePlanId: string;
  employeeId: string;
  date: string;
  cellType: SchedulePlanCellType;
  shiftTemplateId?: string | null;
  comment?: string | null;
  shiftTemplate?: ShiftTemplate | null;
};
type PlannerData = {
  location: { id: string; name: string };
  year: number;
  month: number;
  days: Day[];
  employees: Employee[];
  shiftTemplates: ShiftTemplate[];
  schedulePlan: SchedulePlan | null;
  cells: ScheduleCell[];
};
type ValidationIssue = {
  severity: "error" | "warning";
  code: string;
  message: string;
  cellId?: string;
  employeeId?: string;
  employeeName?: string | null;
  date?: string;
};
type ValidationResult = {
  isValid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: {
    errorCount: number;
    warningCount: number;
    emptyCells: number;
    conflictedCells: number;
  };
};
type BulkMode =
  | { type: "employee"; employee: Employee }
  | { type: "day"; day: Day }
  | { type: "range" };
type PaletteValue = string;

const specialOptions = [
  { value: "empty", label: "Пусто" },
  { value: "day_off", label: "Выходной" },
  { value: "vacation", label: "Отпуск" },
  { value: "sick_leave", label: "Больничный" },
  { value: "business_trip", label: "Командировка / выезд" }
] as const;

export function SchedulePlannerMatrix({
  initialData,
  canEdit,
  canApprove
}: {
  initialData: PlannerData;
  canEdit: boolean;
  canApprove: boolean;
}) {
  const [data, setData] = useState(initialData);
  const [selectedCell, setSelectedCell] = useState<ScheduleCell | null>(null);
  const [bulkMode, setBulkMode] = useState<BulkMode | null>(null);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnComment, setReturnComment] = useState("");
  const [quickValue, setQuickValue] = useState<PaletteValue | null>(null);
  const [selectedValue, setSelectedValue] = useState("empty");
  const [comment, setComment] = useState("");
  const [bulkDateFrom, setBulkDateFrom] = useState(initialData.days[0]?.date ?? "");
  const [bulkDateTo, setBulkDateTo] = useState(initialData.days.at(-1)?.date ?? "");
  const [bulkScope, setBulkScope] = useState("all");
  const [isSaving, setSaving] = useState(false);
  const [isValidating, setValidating] = useState(false);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isApproving, setApproving] = useState(false);
  const [isReturning, setReturning] = useState(false);
  const [isCreatingRevision, setCreatingRevision] = useState(false);
  const [savingCellIds, setSavingCellIds] = useState<Set<string>>(() => new Set());
  const [message, setMessage] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  const cellsByKey = useMemo(() => new Map(data.cells.map((cell) => [`${cell.employeeId}:${cell.date}`, cell])), [data.cells]);
  const issuesByCellId = useMemo(() => {
    const issues = new Map<string, ValidationIssue[]>();
    for (const issue of [...(validation?.errors ?? []), ...(validation?.warnings ?? [])]) {
      if (!issue.cellId) continue;
      issues.set(issue.cellId, [...(issues.get(issue.cellId) ?? []), issue]);
    }
    return issues;
  }, [validation]);
  const activeShiftTemplates = data.shiftTemplates.filter((template) => template.isActive);
  const isEditable = Boolean(data.schedulePlan && canEdit && !["APPROVED", "PENDING_APPROVAL"].includes(data.schedulePlan.status));
  const isApprovalPending = data.schedulePlan?.status === "PENDING_APPROVAL";
  const canCreateRevision = Boolean(data.schedulePlan && canEdit && data.schedulePlan.status === "APPROVED");

  function resetEditor(value = "empty") {
    setSelectedValue(value);
    setComment("");
    setBulkScope("all");
    setBulkDateFrom(data.days[0]?.date ?? "");
    setBulkDateTo(data.days.at(-1)?.date ?? "");
  }

  function openCell(cell: ScheduleCell) {
    if (!isEditable) {
      setMessage("График заблокирован для редактирования.");
      return;
    }
    if (quickValue) {
      void applyQuickValue(cell, quickValue);
      return;
    }
    setSelectedCell(cell);
    resetEditor(cell.cellType === "SHIFT" && cell.shiftTemplateId ? `shift:${cell.shiftTemplateId}` : dbCellTypeToPublic(cell.cellType));
    setComment(cell.comment ?? "");
    setMessage(null);
    setValidation(null);
  }

  async function applyQuickValue(cell: ScheduleCell, value: PaletteValue) {
    if (!data.schedulePlan) return;
    const commentValue = value === "empty" ? "" : cell.comment ?? "";
    const optimisticCell = optimisticCellFromValue(cell, value, data.shiftTemplates, commentValue);
    if (!optimisticCell) {
      setMessage("Выбранная смена больше недоступна.");
      return;
    }

    setMessage(null);
    setValidation(null);
    setSavingCellIds((current) => new Set(current).add(cell.id));
    replaceCells([optimisticCell]);

    const response = await fetch(`/api/schedule-planner/${data.schedulePlan.id}/cells/${cell.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valuePayload(value, commentValue))
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      setData((current) => ({
        ...current,
        cells: current.cells.map((currentCell) => (
          currentCell.id === cell.id && isSameCellValue(currentCell, optimisticCell) ? cell : currentCell
        ))
      }));
      setMessage(body?.message ?? "Не удалось сохранить ячейку.");
    } else if (body?.cell) {
      replaceCells([body.cell]);
    }

    setSavingCellIds((current) => {
      const next = new Set(current);
      next.delete(cell.id);
      return next;
    });
  }

  function openBulk(mode: BulkMode) {
    if (!isEditable) {
      setMessage("График заблокирован для редактирования.");
      return;
    }
    setBulkMode(mode);
    resetEditor();
    if (mode.type === "day") {
      setBulkDateFrom(mode.day.date);
      setBulkDateTo(mode.day.date);
    }
    setMessage(null);
    setValidation(null);
  }

  async function saveCell() {
    if (!selectedCell || !data.schedulePlan) return;
    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/schedule-planner/${data.schedulePlan.id}/cells/${selectedCell.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(valuePayload(selectedValue, comment))
    });
    const body = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setMessage(body?.message ?? "Не удалось сохранить ячейку.");
      return;
    }
    replaceCells([body.cell]);
    setValidation(null);
    setSelectedCell(null);
  }

  async function saveBulk() {
    if (!bulkMode || !data.schedulePlan) return;
    const confirmed = window.confirm("Применить массовое заполнение к выбранным ячейкам?");
    if (!confirmed) return;

    setSaving(true);
    setMessage(null);
    const response = await fetch(`/api/schedule-planner/${data.schedulePlan.id}/bulk-update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...valuePayload(selectedValue, comment),
        ...(bulkMode.type === "employee" ? { employeeIds: [bulkMode.employee.employeeId] } : {}),
        ...(bulkMode.type === "day" ? { dates: [bulkMode.day.date] } : {}),
        ...(bulkMode.type === "range" || bulkMode.type === "employee" ? { dateFrom: bulkDateFrom, dateTo: bulkDateTo } : {}),
        applyToWeekdays: bulkScope === "weekdays",
        applyToWeekends: bulkScope === "weekends"
      })
    });
    const body = await response.json().catch(() => null);
    setSaving(false);
    if (!response.ok) {
      setMessage(body?.message ?? "Не удалось выполнить массовое заполнение.");
      return;
    }
    replaceCells(body.updatedCells ?? []);
    setValidation(null);
    setMessage(`Обновлено ячеек: ${body.updatedCount ?? 0}.`);
    setBulkMode(null);
  }

  async function validatePlan() {
    if (!data.schedulePlan) return null;
    setValidating(true);
    setMessage(null);
    const response = await fetch(`/api/schedule-planner/${data.schedulePlan.id}/validate`, { method: "POST" });
    const body = await response.json().catch(() => null);
    setValidating(false);
    if (!response.ok) {
      setMessage(body?.message ?? "Не удалось проверить график.");
      return null;
    }
    setValidation(body.validation);
    return body.validation as ValidationResult;
  }

  async function submitPlan(confirmWarnings = false) {
    if (!data.schedulePlan) return;
    setSubmitting(true);
    setMessage(null);
    const response = await fetch(`/api/schedule-planner/${data.schedulePlan.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmWarnings })
    });
    const body = await response.json().catch(() => null);
    setSubmitting(false);

    if (response.status === 409 && body?.validation) {
      setValidation(body.validation);
      const confirmed = window.confirm(`В графике есть предупреждения: ${body.validation.summary.warningCount}. Отправить на согласование?`);
      if (confirmed) await submitPlan(true);
      return;
    }
    if (!response.ok) {
      if (body?.validation) setValidation(body.validation);
      setMessage(body?.message ?? "Не удалось отправить график на согласование.");
      return;
    }

    if (body.validation) setValidation(body.validation);
    if (body.schedulePlan) {
      setData((current) => ({ ...current, schedulePlan: body.schedulePlan }));
    }
    setMessage("График отправлен на согласование.");
  }

  async function approvePlan() {
    if (!data.schedulePlan) return;
    const confirmed = window.confirm("Согласовать график? После согласования он будет заблокирован для прямого редактирования.");
    if (!confirmed) return;

    setApproving(true);
    setMessage(null);
    const response = await fetch(`/api/schedule-planner/${data.schedulePlan.id}/approve`, { method: "POST" });
    const body = await response.json().catch(() => null);
    setApproving(false);

    if (!response.ok) {
      if (body?.validation) setValidation(body.validation);
      setMessage(body?.message ?? "Не удалось согласовать график.");
      return;
    }
    if (body.validation) setValidation(body.validation);
    if (body.schedulePlan) {
      setData((current) => ({ ...current, schedulePlan: body.schedulePlan }));
    }
    setMessage("График согласован.");
  }

  async function returnPlan() {
    if (!data.schedulePlan) return;
    const commentValue = returnComment.trim();
    if (!commentValue) {
      setMessage("Укажите причину возврата.");
      return;
    }

    setReturning(true);
    setMessage(null);
    const response = await fetch(`/api/schedule-planner/${data.schedulePlan.id}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: commentValue })
    });
    const body = await response.json().catch(() => null);
    setReturning(false);

    if (!response.ok) {
      setMessage(body?.message ?? "Не удалось вернуть график на доработку.");
      return;
    }
    if (body.schedulePlan) {
      setData((current) => ({ ...current, schedulePlan: body.schedulePlan }));
    }
    setReturnDialogOpen(false);
    setReturnComment("");
    setValidation(null);
    setMessage("График возвращен на доработку.");
  }

  async function createRevision() {
    if (!data.schedulePlan) return;
    const confirmed = window.confirm("Создать новую версию графика? Текущая согласованная версия останется действующей до повторного согласования новой версии.");
    if (!confirmed) return;

    setCreatingRevision(true);
    setMessage(null);
    const response = await fetch(`/api/schedule-planner/${data.schedulePlan.id}/create-revision`, { method: "POST" });
    const body = await response.json().catch(() => null);
    setCreatingRevision(false);

    if (!response.ok) {
      setMessage(body?.message ?? "Не удалось создать новую версию графика.");
      return;
    }
    setData(body);
    setValidation(null);
    setMessage(body.created ? "Создана новая версия графика. После изменений отправьте ее на повторное согласование." : "Открыта уже созданная новая версия графика.");
  }

  function replaceCells(updatedCells: ScheduleCell[]) {
    setData((current) => {
      const updatedById = new Map(updatedCells.map((cell) => [cell.id, cell]));
      return { ...current, cells: current.cells.map((cell) => updatedById.get(cell.id) ?? cell) };
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card/70 p-2 print:hidden">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {data.schedulePlan ? (
            <>
              <Badge variant="secondary" className="h-7 px-2 text-xs">v{data.schedulePlan.version}</Badge>
              <Badge variant={isEditable ? "warning" : "secondary"} className="h-7 px-2 text-xs">{scheduleStatusLabel(data.schedulePlan.status)}</Badge>
            </>
          ) : null}
          <ToolbarButton
            title="Заполнить диапазон"
            disabled={!isEditable}
            onClick={() => openBulk({ type: "range" })}
            icon={<CalendarRange className="h-4 w-4" />}
            label="Диапазон"
          />
          <ToolbarButton
            title="Проверить график"
            disabled={!data.schedulePlan || isValidating}
            onClick={validatePlan}
            icon={<CheckCircle2 className="h-4 w-4" />}
            label={isValidating ? "Проверка" : "Проверить"}
          />
          <ToolbarButton
            title="Отправить на согласование"
            disabled={!isEditable || isSubmitting}
            onClick={() => submitPlan(false)}
            icon={<Send className="h-4 w-4" />}
            label={isSubmitting ? "Отправка" : "Отправить"}
            variant="default"
          />
          <ToolbarButton
            title="Создать новую версию"
            disabled={!canCreateRevision || isCreatingRevision}
            onClick={createRevision}
            icon={<GitBranchPlus className="h-4 w-4" />}
            label={isCreatingRevision ? "Создание" : "Версия"}
          />
          {canApprove ? (
            <>
              <ToolbarButton
                title="Согласовать график"
                disabled={!isApprovalPending || isApproving}
                onClick={approvePlan}
                icon={<CheckCircle2 className="h-4 w-4" />}
                label={isApproving ? "Согласование" : "Согласовать"}
                variant="default"
              />
              <ToolbarButton
                title="Вернуть на доработку"
                disabled={!isApprovalPending || isReturning}
                onClick={() => setReturnDialogOpen(true)}
                icon={<RotateCcw className="h-4 w-4" />}
                label="Вернуть"
              />
            </>
          ) : null}
        </div>
        {data.schedulePlan ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button asChild size="sm" variant="outline" className="h-8 px-2 text-xs">
              <a href={`/api/schedule-planner/${data.schedulePlan.id}/export?format=csv`} title="Скачать CSV" aria-label="Скачать CSV">
                <Download className="h-4 w-4" />
                CSV
              </a>
            </Button>
            <Button asChild size="sm" variant="outline" className="h-8 px-2 text-xs">
              <a href={`/api/schedule-planner/${data.schedulePlan.id}/export?format=xlsx`} title="Скачать XLSX" aria-label="Скачать XLSX">
                <Download className="h-4 w-4" />
                XLSX
              </a>
            </Button>
            <Button type="button" size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => window.print()} title="Печать" aria-label="Печать">
              <Printer className="h-4 w-4" />
              Печать
            </Button>
          </div>
        ) : null}
      </div>
      <Legend
        shiftTemplates={activeShiftTemplates}
        selectedValue={quickValue}
        disabled={!isEditable}
        onSelect={setQuickValue}
      />

      {message ? <div className="rounded-md border border-accent bg-accent/20 p-3 text-sm">{message}</div> : null}
      {data.schedulePlan?.status === "RETURNED_FOR_REVISION" && data.schedulePlan.returnComment ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <div className="font-medium">График возвращен на доработку</div>
          <div className="mt-1 text-muted-foreground">{data.schedulePlan.returnComment}</div>
        </div>
      ) : null}
      {data.schedulePlan?.status === "REQUIRES_REAPPROVAL" ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <div className="font-medium">Новая версия требует повторного согласования</div>
          <div className="mt-1 text-muted-foreground">Действующей остается последняя согласованная версия до отправки и утверждения этой версии.</div>
        </div>
      ) : null}
      <ValidationPanel validation={validation} />

      {!activeShiftTemplates.length ? (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <div className="font-medium">Для точки нет активных шаблонов смен</div>
          <div className="mt-1 text-muted-foreground">Можно отметить выходные, отпуска, больничные и командировки, но рабочие смены появятся после настройки активных шаблонов.</div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border">
        <div className="grid min-w-max" style={{ gridTemplateColumns: `240px repeat(${data.days.length}, 88px) 220px` }}>
          <div className="sticky left-0 z-20 border-b border-r bg-card p-3 text-sm font-medium">Сотрудник</div>
          {data.days.map((day) => (
            <div key={day.date} className={cn("border-b border-r p-1.5 text-center text-xs font-medium", day.isWeekend && "bg-muted/50")}>
              <button type="button" className="w-full rounded px-1 py-0.5 hover:bg-muted" disabled={!isEditable} onClick={() => openBulk({ type: "day", day })}>
                <div>{day.day}</div>
                <div className="text-muted-foreground">{day.weekday}</div>
              </button>
            </div>
          ))}
          <div className="sticky right-0 z-20 border-b border-l bg-card p-3 text-sm font-medium">Итого</div>

          {data.employees.map((employee) => (
            <div key={employee.employeeId} className="contents">
              <div className="sticky left-0 z-10 min-h-16 border-r border-t bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="line-clamp-2 break-words text-sm font-medium leading-snug">{employee.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{employee.position ?? employee.email}</div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    disabled={!isEditable}
                    title={`Заполнить строку: ${employee.name}`}
                    aria-label={`Заполнить строку: ${employee.name}`}
                    onClick={() => openBulk({ type: "employee", employee })}
                  >
                    <Rows3 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              {data.days.map((day) => {
                const cell = cellsByKey.get(`${employee.employeeId}:${day.date}`);
                return (
                  <div key={`${employee.employeeId}:${day.date}`} className={cn("min-h-16 border-r border-t p-1", day.isWeekend && "bg-muted/30")}>
                    {cell ? (
                      <button
                        type="button"
                        onClick={() => openCell(cell)}
                        disabled={!isEditable}
                        className={cn(
                          "flex h-14 w-20 flex-col justify-center rounded-md border px-1.5 text-left text-xs leading-tight transition-colors",
                          cellTone(cell),
                          cellIssueTone(issuesByCellId.get(cell.id)),
                          savingCellIds.has(cell.id) && "opacity-70",
                          isEditable ? "hover:ring-2 hover:ring-ring" : "cursor-not-allowed opacity-80"
                        )}
                        style={cellStyle(cell)}
                        title={cellIssueTitle(issuesByCellId.get(cell.id)) ?? (quickValue ? "Применить выбранное значение" : undefined)}
                      >
                        <span className="flex min-w-0 items-center gap-1">
                          {cell.cellType === "SHIFT" && cell.shiftTemplate?.color ? (
                            <span className="h-2 w-2 shrink-0 rounded-full border border-white/30" style={{ backgroundColor: cell.shiftTemplate.color }} aria-hidden="true" />
                          ) : null}
                          <span className="truncate font-medium">{cellLabel(cell)}</span>
                        </span>
                        {cell.comment ? <span className="truncate text-[10px] opacity-80">{cell.comment}</span> : null}
                      </button>
                    ) : null}
                  </div>
                );
              })}
              <ScheduleRowTotals cells={data.days.map((day) => cellsByKey.get(`${employee.employeeId}:${day.date}`) ?? null)} />
            </div>
          ))}
        </div>
      </div>

      {!data.employees.length ? <div className="rounded-md border p-6 text-sm text-muted-foreground">В выбранной точке нет активных сотрудников.</div> : null}

      <Dialog open={Boolean(selectedCell)} onOpenChange={(open) => !open && setSelectedCell(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать ячейку</DialogTitle></DialogHeader>
          <CellValueForm
            selectedValue={selectedValue}
            setSelectedValue={setSelectedValue}
            comment={comment}
            setComment={setComment}
            activeShiftTemplates={activeShiftTemplates}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setSelectedCell(null)}>Отмена</Button>
            <Button type="button" onClick={saveCell} disabled={isSaving}>{isSaving ? "Сохраняем..." : "Применить"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(bulkMode)} onOpenChange={(open) => !open && setBulkMode(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{bulkTitle(bulkMode)}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {(bulkMode?.type === "employee" || bulkMode?.type === "range") ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="bulk-date-from">Дата от</Label>
                  <Input id="bulk-date-from" type="date" value={bulkDateFrom} onChange={(event) => setBulkDateFrom(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bulk-date-to">Дата до</Label>
                  <Input id="bulk-date-to" type="date" value={bulkDateTo} onChange={(event) => setBulkDateTo(event.target.value)} />
                </div>
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="bulk-scope">Фильтр дней</Label>
              <NativeSelect id="bulk-scope" value={bulkScope} onChange={(event) => setBulkScope(event.target.value)}>
                <option value="all">Все дни</option>
                <option value="weekdays">Только будни</option>
                <option value="weekends">Только выходные</option>
              </NativeSelect>
            </div>
            <CellValueForm
              selectedValue={selectedValue}
              setSelectedValue={setSelectedValue}
              comment={comment}
              setComment={setComment}
              activeShiftTemplates={activeShiftTemplates}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setBulkMode(null)}>Отмена</Button>
              <Button type="button" onClick={saveBulk} disabled={isSaving}>{isSaving ? "Применяем..." : "Применить"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Вернуть график на доработку</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="return-comment">Причина возврата</Label>
              <Textarea
                id="return-comment"
                value={returnComment}
                onChange={(event) => setReturnComment(event.target.value)}
                placeholder="Что нужно исправить перед повторным согласованием"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setReturnDialogOpen(false)}>Отмена</Button>
              <Button type="button" variant="destructive" onClick={returnPlan} disabled={isReturning || !returnComment.trim()}>
                {isReturning ? "Возвращаем..." : "Вернуть"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CellValueForm({
  selectedValue,
  setSelectedValue,
  comment,
  setComment,
  activeShiftTemplates
}: {
  selectedValue: string;
  setSelectedValue: (value: string) => void;
  comment: string;
  setComment: (value: string) => void;
  activeShiftTemplates: ShiftTemplate[];
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cell-value">Значение</Label>
        <NativeSelect id="cell-value" value={selectedValue} onChange={(event) => setSelectedValue(event.target.value)}>
          {specialOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          {activeShiftTemplates.length ? <optgroup label="Смены">{activeShiftTemplates.map((template) => (
            <option key={template.id} value={`shift:${template.id}`}>{template.name} · {template.startsAt}-{template.endsAt}</option>
          ))}</optgroup> : null}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cell-comment">Комментарий</Label>
        <Textarea id="cell-comment" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Необязательно" />
      </div>
    </div>
  );
}

function ToolbarButton({
  title,
  label,
  icon,
  disabled,
  onClick,
  variant = "outline"
}: {
  title: string;
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  onClick: () => void;
  variant?: "default" | "outline";
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={disabled}
      onClick={onClick}
      className="h-8 px-2 text-xs"
      title={title}
      aria-label={title}
    >
      {icon}
      <span>{label}</span>
    </Button>
  );
}

function Legend({
  shiftTemplates,
  selectedValue,
  disabled,
  onSelect
}: {
  shiftTemplates: ShiftTemplate[];
  selectedValue: PaletteValue | null;
  disabled: boolean;
  onSelect: (value: PaletteValue | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {shiftTemplates.slice(0, 6).map((template) => {
        const value = `shift:${template.id}`;
        return (
          <PaletteButton
            key={template.id}
            value={value}
            label={template.name}
            title={template.code}
            color={template.color}
            selected={selectedValue === value}
            disabled={disabled}
            onSelect={onSelect}
          />
        );
      })}
      {shiftTemplates.length > 6 ? <span>+{shiftTemplates.length - 6} смен</span> : null}
      <PaletteButton value="day_off" label="Вых" colorClassName="bg-muted" selected={selectedValue === "day_off"} disabled={disabled} onSelect={onSelect} />
      <PaletteButton value="vacation" label="Отп" colorClassName="border-sky-500/40 bg-sky-500/30" selected={selectedValue === "vacation"} disabled={disabled} onSelect={onSelect} />
      <PaletteButton value="sick_leave" label="Бол" colorClassName="border-rose-500/40 bg-rose-500/30" selected={selectedValue === "sick_leave"} disabled={disabled} onSelect={onSelect} />
      <PaletteButton value="business_trip" label="Выезд" colorClassName="border-amber-500/40 bg-amber-500/30" selected={selectedValue === "business_trip"} disabled={disabled} onSelect={onSelect} />
      <PaletteButton value="empty" label="Пусто" colorClassName="bg-background" selected={selectedValue === "empty"} disabled={disabled} onSelect={onSelect} />
      {selectedValue ? (
        <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => onSelect(null)}>
          Обычный клик
        </Button>
      ) : null}
    </div>
  );
}

function PaletteButton({
  value,
  label,
  title,
  color,
  colorClassName,
  selected,
  disabled,
  onSelect
}: {
  value: PaletteValue;
  label: string;
  title?: string;
  color?: string | null;
  colorClassName?: string;
  selected: boolean;
  disabled: boolean;
  onSelect: (value: PaletteValue | null) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-pressed={selected}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-md border px-2 transition-colors",
        selected ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary/40" : "border-border hover:bg-muted",
        disabled && "cursor-not-allowed opacity-50"
      )}
      onClick={() => onSelect(selected ? null : value)}
    >
      <span
        className={cn("h-2.5 w-2.5 rounded-full border", colorClassName)}
        style={color ? { backgroundColor: color } : undefined}
        aria-hidden="true"
      />
      <span>{label}</span>
    </button>
  );
}

function ScheduleRowTotals({ cells }: { cells: Array<ScheduleCell | null> }) {
  const totals = calculateScheduleTotals(cells);

  return (
    <div className="sticky right-0 min-h-16 border-l border-t bg-card p-3 text-xs">
      <div>Смены: {totals.shiftCount}</div>
      <div>План: {formatHours(totals.plannedMinutes)}</div>
      <div className="text-muted-foreground">Вых/Пусто: {totals.dayOffCount}/{totals.emptyCount}</div>
      <div className="text-muted-foreground">Отп/Бол/Выезд: {totals.vacationCount}/{totals.sickLeaveCount}/{totals.businessTripCount}</div>
    </div>
  );
}

function calculateScheduleTotals(cells: Array<ScheduleCell | null>) {
  return cells.reduce((totals, cell) => {
    if (!cell || cell.cellType === "EMPTY") {
      totals.emptyCount += 1;
      return totals;
    }
    if (cell.cellType === "SHIFT") {
      totals.shiftCount += 1;
      totals.plannedMinutes += shiftTemplateMinutes(cell.shiftTemplate);
      return totals;
    }
    if (cell.cellType === "DAY_OFF") totals.dayOffCount += 1;
    if (cell.cellType === "VACATION") totals.vacationCount += 1;
    if (cell.cellType === "SICK_LEAVE") totals.sickLeaveCount += 1;
    if (cell.cellType === "BUSINESS_TRIP") totals.businessTripCount += 1;
    return totals;
  }, {
    shiftCount: 0,
    plannedMinutes: 0,
    dayOffCount: 0,
    vacationCount: 0,
    sickLeaveCount: 0,
    businessTripCount: 0,
    emptyCount: 0
  });
}

function shiftTemplateMinutes(template?: ShiftTemplate | null) {
  if (!template) return 0;
  const duration = timeToMinutes(template.endsAt) - timeToMinutes(template.startsAt);
  return Math.max(0, duration - (template.breakMinutes ?? 0));
}

function timeToMinutes(value: string) {
  const [hours = 0, minutes = 0] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function formatHours(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
}

function ValidationPanel({ validation }: { validation: ValidationResult | null }) {
  if (!validation) return null;
  const visibleErrors = validation.errors.slice(0, 12);
  const visibleWarnings = validation.warnings.slice(0, 12);

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <div className={cn(
        "rounded-md border p-3 text-sm",
        validation.errors.length ? "border-destructive/50 bg-destructive/10" : "border-emerald-500/40 bg-emerald-500/10"
      )}>
        <div className="mb-2 flex items-center gap-2 font-medium">
          {validation.errors.length ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
          Ошибки: {validation.summary.errorCount}
        </div>
        {visibleErrors.length ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {visibleErrors.map((issue, index) => <li key={`${issue.code}:${issue.cellId ?? index}`}>{issueText(issue)}</li>)}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Критических ошибок нет.</p>
        )}
        {validation.errors.length > visibleErrors.length ? (
          <p className="mt-2 text-xs text-muted-foreground">Еще ошибок: {validation.errors.length - visibleErrors.length}</p>
        ) : null}
      </div>

      <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
        <div className="mb-2 flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4 text-amber-300" />
          Предупреждения: {validation.summary.warningCount}
        </div>
        {visibleWarnings.length ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {visibleWarnings.map((issue, index) => <li key={`${issue.code}:${issue.cellId ?? index}`}>{issueText(issue)}</li>)}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">Предупреждений нет.</p>
        )}
        {validation.warnings.length > visibleWarnings.length ? (
          <p className="mt-2 text-xs text-muted-foreground">Еще предупреждений: {validation.warnings.length - visibleWarnings.length}</p>
        ) : null}
      </div>
    </div>
  );
}

function valuePayload(selectedValue: string, comment: string) {
  return selectedValue.startsWith("shift:")
    ? { cellType: "shift", shiftTemplateId: selectedValue.replace("shift:", ""), comment }
    : { cellType: selectedValue, comment };
}

function optimisticCellFromValue(
  cell: ScheduleCell,
  selectedValue: PaletteValue,
  shiftTemplates: ShiftTemplate[],
  comment: string
): ScheduleCell | null {
  if (selectedValue.startsWith("shift:")) {
    const shiftTemplateId = selectedValue.replace("shift:", "");
    const shiftTemplate = shiftTemplates.find((template) => template.id === shiftTemplateId);
    if (!shiftTemplate) return null;
    return {
      ...cell,
      cellType: "SHIFT",
      shiftTemplateId,
      shiftTemplate,
      comment: comment || null
    };
  }

  return {
    ...cell,
    cellType: publicCellTypeToDb(selectedValue),
    shiftTemplateId: null,
    shiftTemplate: null,
    comment: comment || null
  };
}

function isSameCellValue(left: ScheduleCell, right: ScheduleCell) {
  return (
    left.cellType === right.cellType &&
    (left.shiftTemplateId ?? null) === (right.shiftTemplateId ?? null) &&
    (left.comment ?? null) === (right.comment ?? null)
  );
}

function bulkTitle(mode: BulkMode | null) {
  if (!mode) return "Массовое заполнение";
  if (mode.type === "employee") return `Заполнить строку: ${mode.employee.name}`;
  if (mode.type === "day") return `Заполнить день: ${mode.day.day} ${mode.day.weekday}`;
  return "Заполнить диапазон";
}

function cellLabel(cell: ScheduleCell) {
  if (cell.cellType === "SHIFT") return cell.shiftTemplate?.name ?? "Смена";
  if (cell.cellType === "DAY_OFF") return "Вых";
  if (cell.cellType === "VACATION") return "Отп";
  if (cell.cellType === "SICK_LEAVE") return "Бол";
  if (cell.cellType === "BUSINESS_TRIP") return "Выезд";
  return "Пусто";
}

function cellTone(cell: ScheduleCell) {
  if (cell.cellType === "SHIFT") return cell.shiftTemplate?.color ? "text-foreground" : "border-primary/40 bg-primary/10 text-foreground";
  if (cell.cellType === "DAY_OFF") return "border-muted bg-muted/50 text-muted-foreground";
  if (cell.cellType === "VACATION") return "border-sky-500/40 bg-sky-500/10 text-sky-100";
  if (cell.cellType === "SICK_LEAVE") return "border-rose-500/40 bg-rose-500/10 text-rose-100";
  if (cell.cellType === "BUSINESS_TRIP") return "border-amber-500/40 bg-amber-500/10 text-amber-100";
  return "border-border bg-background text-muted-foreground";
}

function cellStyle(cell: ScheduleCell): CSSProperties | undefined {
  if (cell.cellType !== "SHIFT" || !cell.shiftTemplate?.color) return undefined;
  const color = cell.shiftTemplate.color;
  return {
    borderColor: color,
    backgroundColor: colorWithAlpha(color, 0.18),
    boxShadow: `inset 3px 0 0 ${color}`
  };
}

function colorWithAlpha(color: string, alpha: number) {
  const normalized = color.trim();
  const hex = normalized.match(/^#?([a-f\d]{6})$/i)?.[1];
  if (!hex) return normalized;
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function cellIssueTone(issues?: ValidationIssue[]) {
  if (!issues?.length) return "";
  if (issues.some((issue) => issue.severity === "error")) return "ring-2 ring-destructive border-destructive";
  return "ring-2 ring-amber-400/80 border-amber-400/80";
}

function cellIssueTitle(issues?: ValidationIssue[]) {
  if (!issues?.length) return undefined;
  return issues.map((issue) => issue.message).join("\n");
}

function issueText(issue: ValidationIssue) {
  const subject = [issue.employeeName, issue.date].filter(Boolean).join(" · ");
  return subject ? `${subject}: ${issue.message}` : issue.message;
}

function dbCellTypeToPublic(cellType: SchedulePlanCellType) {
  if (cellType === "SHIFT") return "shift";
  if (cellType === "DAY_OFF") return "day_off";
  if (cellType === "VACATION") return "vacation";
  if (cellType === "SICK_LEAVE") return "sick_leave";
  if (cellType === "BUSINESS_TRIP") return "business_trip";
  return "empty";
}

function publicCellTypeToDb(cellType: string): SchedulePlanCellType {
  if (cellType === "shift") return "SHIFT";
  if (cellType === "day_off") return "DAY_OFF";
  if (cellType === "vacation") return "VACATION";
  if (cellType === "sick_leave") return "SICK_LEAVE";
  if (cellType === "business_trip") return "BUSINESS_TRIP";
  return "EMPTY";
}

function scheduleStatusLabel(status: SchedulePlanStatus) {
  if (status === "DRAFT") return "Черновик";
  if (status === "PENDING_APPROVAL") return "На согласовании";
  if (status === "APPROVED") return "Согласован";
  if (status === "RETURNED_FOR_REVISION") return "Возвращен";
  if (status === "REQUIRES_REAPPROVAL") return "Требует повторного согласования";
  return "Архив";
}
