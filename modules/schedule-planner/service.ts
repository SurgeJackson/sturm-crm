import type { Prisma, SchedulePlanCellType, ScheduleDayStatusType } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit-log";
import { getMonthDays } from "@/modules/schedule-planner/utils";
import { recalculateTimesheetDay } from "@/modules/time-clock/service";
import { combineDateAndTime } from "@/modules/time-clock/utils";

const MAX_CONSECUTIVE_WORK_DAYS = 6;
const MAX_WEEKLY_WORK_HOURS = 40;

export class SchedulePlannerServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SchedulePlannerServiceError";
  }
}

export type SchedulePlanValidationIssue = {
  severity: "error" | "warning";
  code:
    | "shift_template_required"
    | "shift_template_inactive"
    | "cross_location_shift_conflict"
    | "empty_cell"
    | "too_many_consecutive_work_days"
    | "weekly_hours_exceeded";
  message: string;
  cellId?: string;
  employeeId?: string;
  employeeName?: string | null;
  date?: string;
};

export type SchedulePlanValidationResult = {
  isValid: boolean;
  errors: SchedulePlanValidationIssue[];
  warnings: SchedulePlanValidationIssue[];
  summary: {
    errorCount: number;
    warningCount: number;
    emptyCells: number;
    conflictedCells: number;
  };
};

type ScheduleSyncResult = {
  createdOrUpdatedShifts: number;
  cancelledShifts: number;
  createdOrUpdatedDayStatuses: number;
  clearedDayStatuses: number;
  recalculatedTimesheetDays: number;
};

type AffectedTimesheetDay = {
  employeeId: string;
  date: string;
};

export class SchedulePlannerValidationError extends SchedulePlannerServiceError {
  constructor(message: string, public readonly validation: SchedulePlanValidationResult) {
    super(message);
    this.name = "SchedulePlannerValidationError";
  }
}

export async function getSchedulePlannerData({
  locationId,
  year,
  month
}: {
  locationId: string;
  year: number;
  month: number;
}) {
  const [location, employees, shiftTemplates, schedulePlan] = await Promise.all([
    prisma.workLocation.findUnique({ where: { id: locationId } }),
    getScheduleEmployees(locationId),
    prisma.shiftTemplate.findMany({
      where: { locationId },
      orderBy: [{ sortOrder: "asc" }, { startsAt: "asc" }, { name: "asc" }]
    }),
    prisma.schedulePlan.findFirst({
      where: {
        locationId,
        year,
        month,
        status: { not: "ARCHIVED" }
      },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }],
      include: {
        createdBy: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        returnedBy: { select: { id: true, name: true } }
      }
    })
  ]);

  if (!location) throw new SchedulePlannerServiceError("Рабочая точка не найдена");

  const cells = schedulePlan
    ? await prisma.schedulePlanCell.findMany({
        where: { schedulePlanId: schedulePlan.id },
        orderBy: [{ employee: { user: { name: "asc" } } }, { date: "asc" }],
        include: {
          shiftTemplate: true
        }
      })
    : [];

  return {
    location,
    year,
    month,
    days: getMonthDays(year, month),
    employees: employees.map((employee) => ({
      employeeId: employee.id,
      userId: employee.userId,
      name: employee.user.name,
      email: employee.user.email,
      position: employee.position
    })),
    shiftTemplates,
    schedulePlan,
    cells
  };
}

export async function createSchedulePlan({
  locationId,
  year,
  month,
  title,
  actorUserId
}: {
  locationId: string;
  year: number;
  month: number;
  title?: string;
  actorUserId: string;
}) {
  const location = await prisma.workLocation.findUnique({ where: { id: locationId } });
  if (!location) throw new SchedulePlannerServiceError("Рабочая точка не найдена");
  if (!location.isActive) throw new SchedulePlannerServiceError("Рабочая точка выключена");

  const existing = await prisma.schedulePlan.findFirst({
    where: {
      locationId,
      year,
      month,
      status: { not: "ARCHIVED" }
    },
    orderBy: [{ version: "desc" }, { createdAt: "desc" }]
  });
  if (existing) {
    return { schedulePlan: existing, created: false };
  }

  const employees = await getScheduleEmployees(locationId);
  const days = getMonthDays(year, month);
  const maxVersion = await prisma.schedulePlan.aggregate({
    where: { locationId, year, month },
    _max: { version: true }
  });
  const version = (maxVersion._max.version ?? 0) + 1;

  const schedulePlan = await prisma.$transaction(async (tx) => {
    const created = await tx.schedulePlan.create({
      data: {
        locationId,
        year,
        month,
        version,
        title: title || `${location.name}: ${String(month).padStart(2, "0")}.${year}`,
        status: "DRAFT",
        createdById: actorUserId
      }
    });

    if (employees.length && days.length) {
      await tx.schedulePlanCell.createMany({
        data: employees.flatMap((employee) => days.map((day) => ({
          schedulePlanId: created.id,
          employeeId: employee.id,
          userId: employee.userId,
          locationId,
          date: day.date,
          cellType: "EMPTY" as const
        })))
      });
    }

    await tx.schedulePlanApprovalLog.create({
      data: {
        schedulePlanId: created.id,
        action: "CREATED",
        actorUserId
      }
    });

    await writeAuditLog({
      entityType: "SCHEDULE_PLAN",
      entityId: created.id,
      action: "schedule_plan.created",
      userId: actorUserId,
      after: {
        locationId,
        year,
        month,
        version,
        employees: employees.length,
        days: days.length,
        cells: employees.length * days.length
      }
    }, tx);

    return created;
  });

  return { schedulePlan, created: true };
}

export async function updateSchedulePlanCell({
  schedulePlanId,
  cellId,
  cellType,
  shiftTemplateId,
  comment,
  actorUserId
}: {
  schedulePlanId: string;
  cellId: string;
  cellType: "shift" | "day_off" | "vacation" | "sick_leave" | "business_trip" | "empty";
  shiftTemplateId?: string;
  comment?: string;
  actorUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const schedulePlan = await tx.schedulePlan.findUnique({ where: { id: schedulePlanId } });
    if (!schedulePlan) throw new SchedulePlannerServiceError("График не найден");
    if (schedulePlan.status === "APPROVED" || schedulePlan.status === "PENDING_APPROVAL") {
      throw new SchedulePlannerServiceError("График заблокирован для редактирования");
    }

    const before = await tx.schedulePlanCell.findFirst({
      where: { id: cellId, schedulePlanId }
    });
    if (!before) throw new SchedulePlannerServiceError("Ячейка графика не найдена");

    let data: {
      cellType: "SHIFT" | "DAY_OFF" | "VACATION" | "SICK_LEAVE" | "BUSINESS_TRIP" | "EMPTY";
      shiftTemplateId: string | null;
      startsAt: Date | null;
      endsAt: Date | null;
      breakMinutes: number | null;
      comment: string | null;
    };

    if (cellType === "shift") {
      if (!shiftTemplateId) throw new SchedulePlannerServiceError("Выберите смену");
      const shiftTemplate = await tx.shiftTemplate.findFirst({
        where: {
          id: shiftTemplateId,
          locationId: schedulePlan.locationId,
          isActive: true
        }
      });
      if (!shiftTemplate) throw new SchedulePlannerServiceError("Эта смена больше не активна. Выберите другую смену.");
      data = {
        cellType: "SHIFT",
        shiftTemplateId: shiftTemplate.id,
        startsAt: combineDateAndTime(before.date, shiftTemplate.startsAt),
        endsAt: combineDateAndTime(before.date, shiftTemplate.endsAt),
        breakMinutes: shiftTemplate.breakMinutes,
        comment: comment || null
      };
    } else {
      data = {
        cellType: publicCellTypeToDb(cellType),
        shiftTemplateId: null,
        startsAt: null,
        endsAt: null,
        breakMinutes: null,
        comment: comment || null
      };
    }

    const cell = await tx.schedulePlanCell.update({
      where: { id: before.id },
      data,
      include: { shiftTemplate: true }
    });

    await writeAuditLog({
      entityType: "SCHEDULE_PLAN_CELL",
      entityId: cell.id,
      action: "schedule_plan_cell.updated",
      userId: actorUserId,
      before,
      after: cell
    }, tx);

    return cell;
  });
}

export async function bulkUpdateSchedulePlanCells({
  schedulePlanId,
  employeeIds,
  dates,
  dateFrom,
  dateTo,
  applyToWeekdays,
  applyToWeekends,
  cellType,
  shiftTemplateId,
  comment,
  actorUserId
}: {
  schedulePlanId: string;
  employeeIds?: string[];
  dates?: string[];
  dateFrom?: string;
  dateTo?: string;
  applyToWeekdays?: boolean;
  applyToWeekends?: boolean;
  cellType: "shift" | "day_off" | "vacation" | "sick_leave" | "business_trip" | "empty";
  shiftTemplateId?: string;
  comment?: string;
  actorUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const schedulePlan = await tx.schedulePlan.findUnique({ where: { id: schedulePlanId } });
    if (!schedulePlan) throw new SchedulePlannerServiceError("График не найден");
    if (schedulePlan.status === "APPROVED" || schedulePlan.status === "PENDING_APPROVAL") {
      throw new SchedulePlannerServiceError("График заблокирован для редактирования");
    }

    let selectedDates = dates?.length ? [...new Set(dates)] : [];
    if (!selectedDates.length && dateFrom && dateTo) {
      selectedDates = getDatesInRange(dateFrom, dateTo);
    }
    if (!selectedDates.length) throw new SchedulePlannerServiceError("Выберите даты для массового заполнения");

    selectedDates = selectedDates.filter((date) => {
      const isWeekend = isWeekendDate(date);
      if (applyToWeekdays && !applyToWeekends) return !isWeekend;
      if (applyToWeekends && !applyToWeekdays) return isWeekend;
      return true;
    });
    if (!selectedDates.length) throw new SchedulePlannerServiceError("В выбранном диапазоне нет подходящих дат");

    const where = {
      schedulePlanId,
      employeeId: employeeIds?.length ? { in: [...new Set(employeeIds)] } : undefined,
      date: { in: selectedDates }
    };

    const existingCells = await tx.schedulePlanCell.findMany({
      where,
      select: { id: true, employeeId: true, date: true }
    });
    if (!existingCells.length) throw new SchedulePlannerServiceError("Не найдены ячейки для массового заполнения");

    let data: {
      cellType: "SHIFT" | "DAY_OFF" | "VACATION" | "SICK_LEAVE" | "BUSINESS_TRIP" | "EMPTY";
      shiftTemplateId: string | null;
      startsAt?: Date | null;
      endsAt?: Date | null;
      breakMinutes: number | null;
      comment: string | null;
    };

    if (cellType === "shift") {
      if (!shiftTemplateId) throw new SchedulePlannerServiceError("Выберите смену");
      const shiftTemplate = await tx.shiftTemplate.findFirst({
        where: { id: shiftTemplateId, locationId: schedulePlan.locationId, isActive: true }
      });
      if (!shiftTemplate) throw new SchedulePlannerServiceError("Эта смена больше не активна. Выберите другую смену.");
      data = {
        cellType: "SHIFT",
        shiftTemplateId: shiftTemplate.id,
        breakMinutes: shiftTemplate.breakMinutes,
        comment: comment || null
      };

      for (const cell of existingCells) {
        await tx.schedulePlanCell.update({
          where: { id: cell.id },
          data: {
            ...data,
            startsAt: combineDateAndTime(cell.date, shiftTemplate.startsAt),
            endsAt: combineDateAndTime(cell.date, shiftTemplate.endsAt)
          }
        });
      }
    } else {
      data = {
        cellType: publicCellTypeToDb(cellType),
        shiftTemplateId: null,
        startsAt: null,
        endsAt: null,
        breakMinutes: null,
        comment: comment || null
      };
      await tx.schedulePlanCell.updateMany({ where, data });
    }

    await writeAuditLog({
      entityType: "SCHEDULE_PLAN",
      entityId: schedulePlan.id,
      action: "schedule_plan_cells.bulk_updated",
      userId: actorUserId,
      after: {
        cellType,
        shiftTemplateId: shiftTemplateId ?? null,
        employeeIds: employeeIds?.length ?? "all",
        dates: selectedDates,
        updatedCells: existingCells.length
      }
    }, tx);

    const updatedCells = await tx.schedulePlanCell.findMany({
      where: { id: { in: existingCells.map((cell) => cell.id) } },
      include: { shiftTemplate: true },
      orderBy: [{ employee: { user: { name: "asc" } } }, { date: "asc" }]
    });

    return { updatedCells, updatedCount: existingCells.length };
  });
}

export async function validateSchedulePlan(schedulePlanId: string): Promise<SchedulePlanValidationResult> {
  const schedulePlan = await prisma.schedulePlan.findUnique({
    where: { id: schedulePlanId },
    include: { location: true }
  });
  if (!schedulePlan) throw new SchedulePlannerServiceError("График не найден");

  const cells = await prisma.schedulePlanCell.findMany({
    where: { schedulePlanId },
    include: {
      shiftTemplate: true,
      employee: { include: { user: { select: { id: true, name: true, email: true } } } }
    },
    orderBy: [{ employee: { user: { name: "asc" } } }, { date: "asc" }]
  });

  const errors: SchedulePlanValidationIssue[] = [];
  const warnings: SchedulePlanValidationIssue[] = [];

  for (const cell of cells) {
    if (cell.cellType === "EMPTY") {
      warnings.push({
        severity: "warning",
        code: "empty_cell",
        message: "Пустая ячейка в графике.",
        cellId: cell.id,
        employeeId: cell.employeeId,
        employeeName: cell.employee.user.name,
        date: cell.date
      });
      continue;
    }

    if (cell.cellType !== "SHIFT") continue;
    if (!cell.shiftTemplateId || !cell.shiftTemplate) {
      errors.push({
        severity: "error",
        code: "shift_template_required",
        message: "Смена указана без шаблона смены.",
        cellId: cell.id,
        employeeId: cell.employeeId,
        employeeName: cell.employee.user.name,
        date: cell.date
      });
      continue;
    }
    if (!cell.shiftTemplate.isActive) {
      errors.push({
        severity: "error",
        code: "shift_template_inactive",
        message: `Шаблон смены "${cell.shiftTemplate.name}" отключен.`,
        cellId: cell.id,
        employeeId: cell.employeeId,
        employeeName: cell.employee.user.name,
        date: cell.date
      });
    }
  }

  const shiftCells = cells.filter((cell) => cell.cellType === "SHIFT");
  await addCrossLocationConflictErrors({
    schedulePlanId,
    locationId: schedulePlan.locationId,
    shiftCells,
    errors
  });
  addWorkloadWarnings(shiftCells, warnings);

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      errorCount: errors.length,
      warningCount: warnings.length,
      emptyCells: warnings.filter((issue) => issue.code === "empty_cell").length,
      conflictedCells: errors.filter((issue) => issue.code === "cross_location_shift_conflict").length
    }
  };
}

export async function submitSchedulePlan({
  schedulePlanId,
  actorUserId,
  confirmWarnings
}: {
  schedulePlanId: string;
  actorUserId: string;
  confirmWarnings?: boolean;
}) {
  const validation = await validateSchedulePlan(schedulePlanId);
  if (validation.errors.length) {
    throw new SchedulePlannerValidationError("Исправьте ошибки графика перед отправкой на согласование", validation);
  }
  if (validation.warnings.length && !confirmWarnings) {
    return { schedulePlan: null, validation, requiresWarningConfirmation: true };
  }

  const schedulePlan = await prisma.$transaction(async (tx) => {
    const before = await tx.schedulePlan.findUnique({ where: { id: schedulePlanId } });
    if (!before) throw new SchedulePlannerServiceError("График не найден");
    if (before.status === "PENDING_APPROVAL") throw new SchedulePlannerServiceError("График уже отправлен на согласование");
    if (before.status === "APPROVED") throw new SchedulePlannerServiceError("Согласованный график нельзя отправить повторно");
    if (before.status === "ARCHIVED") throw new SchedulePlannerServiceError("Архивный график нельзя отправить на согласование");

    const updated = await tx.schedulePlan.update({
      where: { id: before.id },
      data: {
        status: "PENDING_APPROVAL",
        submittedById: actorUserId,
        submittedAt: new Date(),
        returnComment: null,
        returnedById: null,
        returnedAt: null
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        returnedBy: { select: { id: true, name: true } }
      }
    });

    await tx.schedulePlanApprovalLog.create({
      data: {
        schedulePlanId: updated.id,
        action: "SUBMITTED",
        actorUserId,
        comment: validation.warnings.length ? `Отправлено с предупреждениями: ${validation.warnings.length}` : null
      }
    });

    await writeAuditLog({
      entityType: "SCHEDULE_PLAN",
      entityId: updated.id,
      action: "schedule_plan.submitted",
      userId: actorUserId,
      before,
      after: {
        status: updated.status,
        submittedById: updated.submittedById,
        submittedAt: updated.submittedAt,
        validationSummary: validation.summary
      }
    }, tx);

    return updated;
  });

  return { schedulePlan, validation, requiresWarningConfirmation: false };
}

export async function approveSchedulePlan({
  schedulePlanId,
  actorUserId
}: {
  schedulePlanId: string;
  actorUserId: string;
}) {
  const validation = await validateSchedulePlan(schedulePlanId);
  if (validation.errors.length) {
    throw new SchedulePlannerValidationError("Исправьте ошибки графика перед согласованием", validation);
  }

  const approval = await prisma.$transaction(async (tx) => {
    const before = await tx.schedulePlan.findUnique({ where: { id: schedulePlanId } });
    if (!before) throw new SchedulePlannerServiceError("График не найден");
    if (before.status !== "PENDING_APPROVAL") {
      throw new SchedulePlannerServiceError("Согласовать можно только график в статусе на согласовании");
    }

    const sync = await syncApprovedSchedulePlan({
      schedulePlan: before,
      actorUserId,
      tx
    });

    await tx.schedulePlan.updateMany({
      where: {
        locationId: before.locationId,
        year: before.year,
        month: before.month,
        isCurrentApproved: true,
        id: { not: before.id }
      },
      data: { isCurrentApproved: false }
    });

    const updated = await tx.schedulePlan.update({
      where: { id: before.id },
      data: {
        status: "APPROVED",
        approvedById: actorUserId,
        approvedAt: new Date(),
        isCurrentApproved: true,
        returnComment: null,
        returnedById: null,
        returnedAt: null
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        returnedBy: { select: { id: true, name: true } }
      }
    });

    await tx.schedulePlanApprovalLog.create({
      data: {
        schedulePlanId: updated.id,
        action: "APPROVED",
        actorUserId,
        comment: validation.warnings.length ? `Согласовано с предупреждениями: ${validation.warnings.length}` : null
      }
    });

    await writeAuditLog({
      entityType: "SCHEDULE_PLAN",
      entityId: updated.id,
      action: "schedule_plan.approved",
      userId: actorUserId,
      before,
      after: {
        status: updated.status,
        approvedById: updated.approvedById,
        approvedAt: updated.approvedAt,
        isCurrentApproved: updated.isCurrentApproved,
        validationSummary: validation.summary,
        syncResult: sync.result
      }
    }, tx);

    return {
      schedulePlan: updated,
      syncResult: sync.result,
      affectedTimesheetDays: sync.affectedTimesheetDays
    };
  });

  for (const day of approval.affectedTimesheetDays) {
    await recalculateTimesheetDay(day.employeeId, day.date);
    approval.syncResult.recalculatedTimesheetDays += 1;
  }

  await writeAuditLog({
    entityType: "SCHEDULE_PLAN",
    entityId: approval.schedulePlan.id,
    action: "schedule_plan.synced_to_time_clock",
    userId: actorUserId,
    after: approval.syncResult
  });

  return { schedulePlan: approval.schedulePlan, validation };
}

export async function returnSchedulePlanForRevision({
  schedulePlanId,
  actorUserId,
  comment
}: {
  schedulePlanId: string;
  actorUserId: string;
  comment: string;
}) {
  const normalizedComment = comment.trim();
  if (!normalizedComment) throw new SchedulePlannerServiceError("Укажите причину возврата");

  const schedulePlan = await prisma.$transaction(async (tx) => {
    const before = await tx.schedulePlan.findUnique({ where: { id: schedulePlanId } });
    if (!before) throw new SchedulePlannerServiceError("График не найден");
    if (before.status !== "PENDING_APPROVAL") {
      throw new SchedulePlannerServiceError("Вернуть на доработку можно только график в статусе на согласовании");
    }

    const updated = await tx.schedulePlan.update({
      where: { id: before.id },
      data: {
        status: "RETURNED_FOR_REVISION",
        returnedById: actorUserId,
        returnedAt: new Date(),
        returnComment: normalizedComment
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        submittedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        returnedBy: { select: { id: true, name: true } }
      }
    });

    await tx.schedulePlanApprovalLog.create({
      data: {
        schedulePlanId: updated.id,
        action: "RETURNED_FOR_REVISION",
        actorUserId,
        comment: normalizedComment
      }
    });

    await writeAuditLog({
      entityType: "SCHEDULE_PLAN",
      entityId: updated.id,
      action: "schedule_plan.returned_for_revision",
      userId: actorUserId,
      before,
      after: {
        status: updated.status,
        returnedById: updated.returnedById,
        returnedAt: updated.returnedAt,
        returnComment: updated.returnComment
      }
    }, tx);

    return updated;
  });

  return { schedulePlan };
}

export async function createSchedulePlanRevision({
  schedulePlanId,
  actorUserId
}: {
  schedulePlanId: string;
  actorUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const previous = await tx.schedulePlan.findUnique({
      where: { id: schedulePlanId },
      include: { cells: { orderBy: [{ employeeId: "asc" }, { date: "asc" }] } }
    });
    if (!previous) throw new SchedulePlannerServiceError("График не найден");
    if (previous.status !== "APPROVED") {
      throw new SchedulePlannerServiceError("Новую версию можно создать только для согласованного графика");
    }

    const existingRevision = await tx.schedulePlan.findFirst({
      where: {
        basedOnSchedulePlanId: previous.id,
        status: { in: ["DRAFT", "REQUIRES_REAPPROVAL", "RETURNED_FOR_REVISION", "PENDING_APPROVAL"] }
      },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }]
    });
    if (existingRevision) {
      return { schedulePlan: existingRevision, created: false };
    }

    const maxVersion = await tx.schedulePlan.aggregate({
      where: { locationId: previous.locationId, year: previous.year, month: previous.month },
      _max: { version: true }
    });
    const nextVersion = (maxVersion._max.version ?? previous.version) + 1;

    const revision = await tx.schedulePlan.create({
      data: {
        locationId: previous.locationId,
        year: previous.year,
        month: previous.month,
        version: nextVersion,
        title: previous.title ? `${previous.title} v${nextVersion}` : undefined,
        status: "REQUIRES_REAPPROVAL",
        createdById: actorUserId,
        basedOnSchedulePlanId: previous.id,
        isCurrentApproved: false
      }
    });

    if (previous.cells.length) {
      await tx.schedulePlanCell.createMany({
        data: previous.cells.map((cell) => ({
          schedulePlanId: revision.id,
          employeeId: cell.employeeId,
          userId: cell.userId,
          locationId: cell.locationId,
          date: cell.date,
          cellType: cell.cellType,
          shiftTemplateId: cell.shiftTemplateId,
          startsAt: cell.startsAt,
          endsAt: cell.endsAt,
          breakMinutes: cell.breakMinutes,
          comment: cell.comment
        }))
      });
    }

    await tx.schedulePlanApprovalLog.create({
      data: {
        schedulePlanId: revision.id,
        action: "NEW_VERSION_CREATED",
        actorUserId,
        comment: `Создана новая версия на основе v${previous.version}`
      }
    });

    await writeAuditLog({
      entityType: "SCHEDULE_PLAN",
      entityId: revision.id,
      action: "schedule_plan.revision_created",
      userId: actorUserId,
      after: {
        basedOnSchedulePlanId: previous.id,
        previousVersion: previous.version,
        version: revision.version,
        copiedCells: previous.cells.length,
        currentApprovedUnchanged: previous.isCurrentApproved
      }
    }, tx);

    return { schedulePlan: revision, created: true };
  });
}

async function syncApprovedSchedulePlan({
  schedulePlan,
  actorUserId,
  tx
}: {
  schedulePlan: {
    id: string;
    locationId: string;
    year: number;
    month: number;
    version: number;
  };
  actorUserId: string;
  tx: Prisma.TransactionClient;
}): Promise<{ result: ScheduleSyncResult; affectedTimesheetDays: AffectedTimesheetDay[] }> {
  const cells = await tx.schedulePlanCell.findMany({
    where: { schedulePlanId: schedulePlan.id },
    orderBy: [{ employeeId: "asc" }, { date: "asc" }]
  });
  const periodDates = getMonthDays(schedulePlan.year, schedulePlan.month).map((day) => day.date);
  const affected = new Set<string>();
  const result: ScheduleSyncResult = {
    createdOrUpdatedShifts: 0,
    cancelledShifts: 0,
    createdOrUpdatedDayStatuses: 0,
    clearedDayStatuses: 0,
    recalculatedTimesheetDays: 0
  };

  for (const cell of cells) {
    affected.add(employeeDateKey(cell.employeeId, cell.date));

    if (cell.cellType === "SHIFT") {
      if (!cell.startsAt || !cell.endsAt) {
        throw new SchedulePlannerServiceError("В графике есть смена без времени начала или окончания");
      }

      const clearedDayStatuses = await tx.scheduleDayStatus.deleteMany({
        where: { employeeId: cell.employeeId, date: cell.date }
      });
      result.clearedDayStatuses += clearedDayStatuses.count;

      await tx.workShift.upsert({
        where: { sourceSchedulePlanCellId: cell.id },
        update: {
          employeeId: cell.employeeId,
          locationId: cell.locationId,
          date: cell.date,
          startsAt: cell.startsAt,
          endsAt: cell.endsAt,
          breakMinutes: cell.breakMinutes ?? 0,
          status: "PLANNED",
          sourceSchedulePlanId: schedulePlan.id,
          scheduleVersion: schedulePlan.version
        },
        create: {
          employeeId: cell.employeeId,
          locationId: cell.locationId,
          date: cell.date,
          startsAt: cell.startsAt,
          endsAt: cell.endsAt,
          breakMinutes: cell.breakMinutes ?? 0,
          status: "PLANNED",
          createdById: actorUserId,
          sourceSchedulePlanId: schedulePlan.id,
          sourceSchedulePlanCellId: cell.id,
          scheduleVersion: schedulePlan.version
        }
      });
      result.createdOrUpdatedShifts += 1;
      continue;
    }

    const cancelledCellShifts = await tx.workShift.updateMany({
      where: {
        employeeId: cell.employeeId,
        date: cell.date,
        sourceSchedulePlanId: { not: null },
        status: { not: "CANCELLED" }
      },
      data: { status: "CANCELLED" }
    });
    result.cancelledShifts += cancelledCellShifts.count;

    const dayStatus = scheduleCellTypeToDayStatus(cell.cellType);
    if (dayStatus) {
      await tx.scheduleDayStatus.upsert({
        where: { employeeId_date: { employeeId: cell.employeeId, date: cell.date } },
        update: {
          schedulePlanId: schedulePlan.id,
          schedulePlanCellId: cell.id,
          userId: cell.userId,
          locationId: cell.locationId,
          status: dayStatus,
          comment: cell.comment,
          scheduleVersion: schedulePlan.version
        },
        create: {
          schedulePlanId: schedulePlan.id,
          schedulePlanCellId: cell.id,
          employeeId: cell.employeeId,
          userId: cell.userId,
          locationId: cell.locationId,
          date: cell.date,
          status: dayStatus,
          comment: cell.comment,
          scheduleVersion: schedulePlan.version
        }
      });
      result.createdOrUpdatedDayStatuses += 1;
    } else {
      const clearedDayStatuses = await tx.scheduleDayStatus.deleteMany({
        where: { employeeId: cell.employeeId, date: cell.date }
      });
      result.clearedDayStatuses += clearedDayStatuses.count;
    }
  }

  const staleShifts = await tx.workShift.findMany({
    where: {
      locationId: schedulePlan.locationId,
      date: { in: periodDates },
      AND: [
        { sourceSchedulePlanId: { not: null } },
        { sourceSchedulePlanId: { not: schedulePlan.id } }
      ],
      status: { not: "CANCELLED" },
      sourceSchedulePlan: {
        locationId: schedulePlan.locationId,
        year: schedulePlan.year,
        month: schedulePlan.month
      }
    },
    select: { id: true, employeeId: true, date: true }
  });
  if (staleShifts.length) {
    await tx.workShift.updateMany({
      where: { id: { in: staleShifts.map((shift) => shift.id) } },
      data: { status: "CANCELLED" }
    });
    result.cancelledShifts += staleShifts.length;
    for (const shift of staleShifts) affected.add(employeeDateKey(shift.employeeId, shift.date));
  }

  const staleDayStatuses = await tx.scheduleDayStatus.findMany({
    where: {
      locationId: schedulePlan.locationId,
      date: { in: periodDates },
      schedulePlanId: { not: schedulePlan.id },
      schedulePlan: {
        locationId: schedulePlan.locationId,
        year: schedulePlan.year,
        month: schedulePlan.month
      }
    },
    select: { id: true, employeeId: true, date: true }
  });
  if (staleDayStatuses.length) {
    await tx.scheduleDayStatus.deleteMany({
      where: { id: { in: staleDayStatuses.map((status) => status.id) } }
    });
    result.clearedDayStatuses += staleDayStatuses.length;
    for (const status of staleDayStatuses) affected.add(employeeDateKey(status.employeeId, status.date));
  }

  return {
    result,
    affectedTimesheetDays: [...affected].map((key) => {
      const [employeeId, date] = key.split(":");
      return { employeeId, date };
    })
  };
}

async function getScheduleEmployees(locationId: string) {
  return prisma.employeeProfile.findMany({
    where: {
      defaultLocationId: locationId,
      employmentStatus: "ACTIVE",
      user: { isActive: true }
    },
    orderBy: { user: { name: "asc" } },
    include: {
      user: { select: { id: true, name: true, email: true } }
    }
  });
}

function getDatesInRange(dateFrom: string, dateTo: string) {
  const dates: string[] = [];
  const current = new Date(`${dateFrom}T00:00:00.000Z`);
  const end = new Date(`${dateTo}T00:00:00.000Z`);
  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10));
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

function isWeekendDate(date: string) {
  const day = new Date(`${date}T00:00:00.000Z`).getUTCDay();
  return day === 0 || day === 6;
}

function publicCellTypeToDb(cellType: "shift" | "day_off" | "vacation" | "sick_leave" | "business_trip" | "empty") {
  if (cellType === "day_off") return "DAY_OFF";
  if (cellType === "vacation") return "VACATION";
  if (cellType === "sick_leave") return "SICK_LEAVE";
  if (cellType === "business_trip") return "BUSINESS_TRIP";
  if (cellType === "shift") return "SHIFT";
  return "EMPTY";
}

function scheduleCellTypeToDayStatus(cellType: SchedulePlanCellType): ScheduleDayStatusType | null {
  if (cellType === "DAY_OFF") return "DAY_OFF";
  if (cellType === "VACATION") return "VACATION";
  if (cellType === "SICK_LEAVE") return "SICK_LEAVE";
  if (cellType === "BUSINESS_TRIP") return "BUSINESS_TRIP";
  return null;
}

function employeeDateKey(employeeId: string, date: string) {
  return `${employeeId}:${date}`;
}

type ValidationCell = Awaited<ReturnType<typeof prisma.schedulePlanCell.findMany>>[number] & {
  shiftTemplate?: { id: string; isActive: boolean; name: string } | null;
  employee?: { user?: { name: string | null } };
};

async function addCrossLocationConflictErrors({
  schedulePlanId,
  locationId,
  shiftCells,
  errors
}: {
  schedulePlanId: string;
  locationId: string;
  shiftCells: ValidationCell[];
  errors: SchedulePlanValidationIssue[];
}) {
  const shiftCellsWithDates = shiftCells.filter((cell) => cell.date && cell.employeeId);
  if (!shiftCellsWithDates.length) return;

  const employeeIds = [...new Set(shiftCellsWithDates.map((cell) => cell.employeeId))];
  const dates = [...new Set(shiftCellsWithDates.map((cell) => cell.date))];

  const [otherPlanCells, workShifts] = await Promise.all([
    prisma.schedulePlanCell.findMany({
      where: {
        schedulePlanId: { not: schedulePlanId },
        employeeId: { in: employeeIds },
        date: { in: dates },
        cellType: "SHIFT",
        locationId: { not: locationId },
        schedulePlan: { status: { not: "ARCHIVED" } }
      },
      include: {
        location: { select: { name: true } },
        schedulePlan: { select: { status: true, version: true } }
      }
    }),
    prisma.workShift.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { in: dates },
        locationId: { not: locationId },
        status: { not: "CANCELLED" }
      },
      include: {
        location: { select: { name: true } }
      }
    })
  ]);

  const otherPlanByEmployeeDate = new Map<string, typeof otherPlanCells>();
  for (const cell of otherPlanCells) {
    const key = `${cell.employeeId}:${cell.date}`;
    otherPlanByEmployeeDate.set(key, [...(otherPlanByEmployeeDate.get(key) ?? []), cell]);
  }

  const workShiftByEmployeeDate = new Map<string, typeof workShifts>();
  for (const shift of workShifts) {
    const key = `${shift.employeeId}:${shift.date}`;
    workShiftByEmployeeDate.set(key, [...(workShiftByEmployeeDate.get(key) ?? []), shift]);
  }

  for (const cell of shiftCellsWithDates) {
    const key = `${cell.employeeId}:${cell.date}`;
    const conflicts = otherPlanByEmployeeDate.get(key) ?? [];
    const workShiftConflicts = workShiftByEmployeeDate.get(key) ?? [];
    const hasConflict = conflicts.length || workShiftConflicts.length;
    if (!hasConflict) continue;

    const conflictLocation = conflicts[0]?.location.name ?? workShiftConflicts[0]?.location.name ?? "другой точке";
    errors.push({
      severity: "error",
      code: "cross_location_shift_conflict",
      message: `У сотрудника уже есть смена в ${conflictLocation} на эту дату.`,
      cellId: cell.id,
      employeeId: cell.employeeId,
      employeeName: cell.employee?.user?.name,
      date: cell.date
    });
  }
}

function addWorkloadWarnings(shiftCells: ValidationCell[], warnings: SchedulePlanValidationIssue[]) {
  const cellsByEmployee = new Map<string, ValidationCell[]>();
  for (const cell of shiftCells) {
    cellsByEmployee.set(cell.employeeId, [...(cellsByEmployee.get(cell.employeeId) ?? []), cell]);
  }

  for (const cells of cellsByEmployee.values()) {
    const sorted = [...cells].sort((left, right) => left.date.localeCompare(right.date));
    addConsecutiveWorkDaysWarnings(sorted, warnings);
    addWeeklyHoursWarnings(sorted, warnings);
  }
}

function addConsecutiveWorkDaysWarnings(cells: ValidationCell[], warnings: SchedulePlanValidationIssue[]) {
  let streak: ValidationCell[] = [];
  let previousDate: Date | null = null;

  for (const cell of cells) {
    const currentDate = parseDateKey(cell.date);
    const isNextDate = previousDate ? daysBetween(previousDate, currentDate) === 1 : false;
    streak = isNextDate ? [...streak, cell] : [cell];
    previousDate = currentDate;

    if (streak.length === MAX_CONSECUTIVE_WORK_DAYS + 1) {
      warnings.push({
        severity: "warning",
        code: "too_many_consecutive_work_days",
        message: `Больше ${MAX_CONSECUTIVE_WORK_DAYS} рабочих дней подряд.`,
        cellId: cell.id,
        employeeId: cell.employeeId,
        employeeName: cell.employee?.user?.name,
        date: cell.date
      });
    }
  }
}

function addWeeklyHoursWarnings(cells: ValidationCell[], warnings: SchedulePlanValidationIssue[]) {
  const hoursByWeek = new Map<string, { hours: number; cells: ValidationCell[] }>();
  for (const cell of cells) {
    const weekKey = getIsoWeekKey(cell.date);
    const bucket = hoursByWeek.get(weekKey) ?? { hours: 0, cells: [] };
    bucket.hours += getCellWorkHours(cell);
    bucket.cells.push(cell);
    hoursByWeek.set(weekKey, bucket);
  }

  for (const bucket of hoursByWeek.values()) {
    if (bucket.hours <= MAX_WEEKLY_WORK_HOURS) continue;
    const firstCell = bucket.cells[0];
    warnings.push({
      severity: "warning",
      code: "weekly_hours_exceeded",
      message: `Плановая нагрузка за неделю ${bucket.hours.toFixed(1)} ч, выше ${MAX_WEEKLY_WORK_HOURS} ч.`,
      cellId: firstCell.id,
      employeeId: firstCell.employeeId,
      employeeName: firstCell.employee?.user?.name,
      date: firstCell.date
    });
  }
}

function getCellWorkHours(cell: ValidationCell) {
  if (!cell.startsAt || !cell.endsAt) return 0;
  const totalMinutes = Math.max(0, Math.round((cell.endsAt.getTime() - cell.startsAt.getTime()) / 60000));
  return Math.max(0, totalMinutes - (cell.breakMinutes ?? 0)) / 60;
}

function parseDateKey(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function daysBetween(left: Date, right: Date) {
  return Math.round((right.getTime() - left.getTime()) / 86400000);
}

function getIsoWeekKey(date: string) {
  const value = parseDateKey(date);
  const day = value.getUTCDay() || 7;
  value.setUTCDate(value.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((value.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${value.getUTCFullYear()}-${String(week).padStart(2, "0")}`;
}
