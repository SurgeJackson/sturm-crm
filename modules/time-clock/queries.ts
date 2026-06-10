import type { EmployeeDeviceStatus, Prisma, TimeAdjustmentStatus, TimesheetDayStatus, WorkShiftStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { paginatedQuery, sortFromParam } from "@/modules/crm/list-query";
import { pageFromParam } from "@/modules/crm/pagination";
import { getMonthDays } from "@/modules/schedule-planner/utils";

const PAGE_SIZE = 20;

export type WorkLocationParams = { q?: string; active?: string; page?: string };
export type WorkShiftParams = { employeeId?: string; locationId?: string; status?: string; from?: string; to?: string; page?: string };
export type TimesheetParams = { employeeId?: string; locationId?: string; status?: string; from?: string; to?: string; page?: string; sort?: string };
export type TimesheetMatrixParams = { locationId?: string; employeeId?: string; year?: string | number; month?: string | number };
export type EmployeeDeviceParams = { employeeId?: string; status?: string; multi?: string; page?: string };
export type AdjustmentParams = { status?: string; employeeId?: string; page?: string };

export async function getEmployeeOptions() {
  return prisma.employeeProfile.findMany({
    where: { user: { isActive: true }, employmentStatus: "ACTIVE" },
    orderBy: { user: { name: "asc" } },
    include: { user: { select: { id: true, name: true, email: true, role: true } }, defaultLocation: true }
  });
}

export async function getWorkLocationOptions(activeOnly = true) {
  return prisma.workLocation.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { name: "asc" }
  });
}

export async function getWorkLocations(params: WorkLocationParams) {
  const page = pageFromParam(params.page);
  const where: Prisma.WorkLocationWhereInput = {
    AND: [
      params.q
        ? {
            OR: [
              { name: { contains: params.q, mode: "insensitive" } },
              { code: { contains: params.q, mode: "insensitive" } },
              { address: { contains: params.q, mode: "insensitive" } }
            ]
          }
        : {},
      params.active === "1" ? { isActive: true } : {},
      params.active === "0" ? { isActive: false } : {}
    ]
  };

  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.workLocation.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        displayDevices: { orderBy: { createdAt: "desc" } },
        _count: { select: { shifts: true, timeEvents: true } }
      }
    }),
    countRows: () => prisma.workLocation.count({ where })
  });
}

export async function getWorkLocationWithShiftTemplates(id: string) {
  return prisma.workLocation.findUnique({
    where: { id },
    include: {
      shiftTemplates: {
        orderBy: [{ sortOrder: "asc" }, { startsAt: "asc" }, { name: "asc" }]
      },
      _count: { select: { shifts: true, timeEvents: true } }
    }
  });
}

export async function getShiftTemplates(locationId: string, activeOnly = false) {
  return prisma.shiftTemplate.findMany({
    where: {
      locationId,
      isActive: activeOnly ? true : undefined
    },
    orderBy: [{ sortOrder: "asc" }, { startsAt: "asc" }, { name: "asc" }]
  });
}

export async function getWorkShifts(params: WorkShiftParams) {
  const page = pageFromParam(params.page);
  const where: Prisma.WorkShiftWhereInput = {
    employeeId: params.employeeId || undefined,
    locationId: params.locationId || undefined,
    status: isWorkShiftStatus(params.status) ? params.status : undefined,
    date: {
      gte: params.from || undefined,
      lte: params.to || undefined
    }
  };

  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.workShift.findMany({
      where,
      orderBy: { startsAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        employee: { include: { user: { select: { id: true, name: true, email: true } } } },
        location: true,
        createdBy: { select: { id: true, name: true } }
      }
    }),
    countRows: () => prisma.workShift.count({ where })
  });
}

export async function getTimesheetDays(params: TimesheetParams) {
  const page = pageFromParam(params.page);
  const where: Prisma.TimesheetDayWhereInput = {
    employeeId: params.employeeId || undefined,
    locationId: params.locationId || undefined,
    status: isTimesheetStatus(params.status) ? params.status : undefined,
    date: {
      gte: params.from || undefined,
      lte: params.to || undefined
    }
  };
  const orderBy = sortFromParam<Prisma.TimesheetDayOrderByWithRelationInput>(params.sort, {
    date: { date: "desc" },
    worked: { workedMinutes: "desc" },
    late: { lateMinutes: "desc" }
  }, { date: "desc" });

  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.timesheetDay.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        employee: { include: { user: { select: { id: true, name: true, email: true } } } },
        location: true,
        shift: true
      }
    }),
    countRows: () => prisma.timesheetDay.count({ where })
  });
}

export async function getTimesheetDayDetail(id: string) {
  const day = await prisma.timesheetDay.findUnique({
    where: { id },
    include: {
      employee: { include: { user: { select: { id: true, name: true, email: true } } } },
      location: true,
      shift: true
    }
  });
  if (!day) return null;
  const events = await prisma.timeEvent.findMany({
    where: {
      employeeId: day.employeeId,
      occurredAt: {
        gte: new Date(`${day.date}T00:00:00.000`),
        lte: new Date(`${day.date}T23:59:59.999`)
      }
    },
    orderBy: { occurredAt: "asc" },
    include: {
      location: true,
      trustedDevice: true,
      reviewedBy: { select: { id: true, name: true } }
    }
  });
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: "TIMESHEET_DAY", entityId: day.id },
        { entityType: "TIME_EVENT", entityId: { in: events.map((event) => event.id) } }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true } } },
    take: 50
  });
  return { day, events, auditLogs };
}

export async function getTimesheetMatrix(params: TimesheetMatrixParams) {
  const now = new Date();
  const year = normalizeYear(params.year, now.getFullYear());
  const month = normalizeMonth(params.month, now.getMonth() + 1);
  const days = getMonthDays(year, month);
  const locationId = params.locationId || undefined;
  const employeeId = params.employeeId || undefined;
  const from = days[0]?.date;
  const to = days.at(-1)?.date;

  const [location, employees] = await Promise.all([
    locationId ? prisma.workLocation.findUnique({ where: { id: locationId } }) : null,
    prisma.employeeProfile.findMany({
      where: {
        id: employeeId,
        defaultLocationId: locationId,
        employmentStatus: "ACTIVE",
        user: { isActive: true }
      },
      orderBy: { user: { name: "asc" } },
      include: { user: { select: { id: true, name: true, email: true } }, defaultLocation: true }
    })
  ]);

  const employeeIds = employees.map((employee) => employee.id);
  if (!from || !to || !employeeIds.length) {
    return { location: serializeLocation(location), year, month, days, employees: [], rows: [] };
  }

  const [timesheetDays, events, adjustments] = await Promise.all([
    prisma.timesheetDay.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: from, lte: to },
        locationId
      },
      include: {
        shift: true,
        scheduleDayStatus: true,
        location: true
      },
      orderBy: [{ employee: { user: { name: "asc" } } }, { date: "asc" }]
    }),
    prisma.timeEvent.findMany({
      where: {
        employeeId: { in: employeeIds },
        locationId,
        occurredAt: {
          gte: new Date(`${from}T00:00:00.000`),
          lte: new Date(`${to}T23:59:59.999`)
        }
      },
      orderBy: [{ employeeId: "asc" }, { occurredAt: "asc" }],
      include: {
        location: true,
        reviewedBy: { select: { id: true, name: true } }
      }
    }),
    prisma.timeAdjustmentRequest.findMany({
      where: {
        employeeId: { in: employeeIds },
        date: { gte: from, lte: to }
      },
      orderBy: [{ employeeId: "asc" }, { date: "asc" }, { createdAt: "desc" }],
      include: {
        reviewedBy: { select: { id: true, name: true } }
      }
    })
  ]);

  const timesheetIds = timesheetDays.map((day) => day.id);
  const eventIds = events.map((event) => event.id);
  const auditWhere: Prisma.AuditLogWhereInput[] = [
    ...(timesheetIds.length ? [{ entityType: "TIMESHEET_DAY" as const, entityId: { in: timesheetIds } }] : []),
    ...(eventIds.length ? [{ entityType: "TIME_EVENT" as const, entityId: { in: eventIds } }] : [])
  ];
  const auditLogs = auditWhere.length
    ? await prisma.auditLog.findMany({
        where: {
          OR: auditWhere
        },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, name: true } } },
        take: 500
      })
    : [];

  const timesheetByEmployeeDate = new Map(timesheetDays.map((day) => [employeeDateKey(day.employeeId, day.date), day]));
  const eventsByEmployeeDate = groupByEmployeeDate(events, (event) => event.employeeId, (event) => event.occurredAt.toISOString().slice(0, 10));
  const adjustmentsByEmployeeDate = groupByEmployeeDate(adjustments, (adjustment) => adjustment.employeeId, (adjustment) => adjustment.date);
  const auditByEntity = new Map<string, typeof auditLogs>();
  for (const log of auditLogs) {
    const key = `${log.entityType}:${log.entityId}`;
    auditByEntity.set(key, [...(auditByEntity.get(key) ?? []), log]);
  }

  const rows = employees.map((employee) => {
    const cells = days.map((day) => {
      const key = employeeDateKey(employee.id, day.date);
      const timesheetDay = timesheetByEmployeeDate.get(key) ?? null;
      const dayEvents = eventsByEmployeeDate.get(key) ?? [];
      const dayAdjustments = adjustmentsByEmployeeDate.get(key) ?? [];
      const dayAuditLogs = [
        ...(timesheetDay ? auditByEntity.get(`TIMESHEET_DAY:${timesheetDay.id}`) ?? [] : []),
        ...dayEvents.flatMap((event) => auditByEntity.get(`TIME_EVENT:${event.id}`) ?? [])
      ];
      return {
        date: day.date,
        isWeekend: day.isWeekend,
        timesheetDay: timesheetDay ? serializeTimesheetDay(timesheetDay) : null,
        events: dayEvents.map(serializeTimeEvent),
        adjustments: dayAdjustments.map(serializeAdjustment),
        auditLogs: dayAuditLogs.map(serializeAuditLog),
        riskFlags: [...new Set(dayEvents.flatMap((event) => event.riskFlags))]
      };
    });

    return {
      employee: {
        id: employee.id,
        userId: employee.userId,
        name: employee.user.name,
        email: employee.user.email,
        position: employee.position,
        defaultLocation: employee.defaultLocation ? { id: employee.defaultLocation.id, name: employee.defaultLocation.name } : null
      },
      cells,
      totals: calculateTimesheetTotals(cells)
    };
  });

  return {
    location: serializeLocation(location),
    year,
    month,
    days,
    employees: employees.map((employee) => ({
      id: employee.id,
      userId: employee.userId,
      name: employee.user.name,
      email: employee.user.email
    })),
    rows
  };
}

export async function getPendingTimeEvents() {
  return prisma.timeEvent.findMany({
    where: { status: "PENDING_REVIEW" },
    orderBy: { occurredAt: "desc" },
    include: {
      employee: { include: { user: { select: { id: true, name: true, email: true } } } },
      location: true,
      shift: true,
      trustedDevice: true
    },
    take: 100
  });
}

export async function getEmployeeDevices(params: EmployeeDeviceParams) {
  const page = pageFromParam(params.page);
  const where: Prisma.EmployeeTrustedDeviceWhereInput = {
    employeeId: params.employeeId || undefined,
    status: isEmployeeDeviceStatus(params.status) ? params.status : undefined
  };
  const rows = await paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.employeeTrustedDevice.findMany({
      where,
      orderBy: { lastSeenAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        employee: { include: { user: { select: { id: true, name: true, email: true } } } },
        approvedBy: { select: { id: true, name: true } },
        blockedBy: { select: { id: true, name: true } }
      }
    }),
    countRows: () => prisma.employeeTrustedDevice.count({ where })
  });
  const deviceIds = rows.items.map((row) => row.deviceId);
  const employeeIds = rows.items.map((row) => row.employeeId);
  const grouped = await prisma.employeeTrustedDevice.groupBy({
    by: ["deviceId"],
    where: { deviceId: { in: deviceIds } },
    _count: { employeeId: true }
  });
  const trustedGrouped = await prisma.employeeTrustedDevice.groupBy({
    by: ["employeeId"],
    where: {
      employeeId: { in: employeeIds },
      status: "TRUSTED"
    },
    _count: { id: true }
  });
  const multiMap = new Map(grouped.map((item) => [item.deviceId, item._count.employeeId > 1]));
  const trustedMap = new Map(trustedGrouped.map((item) => [item.employeeId, item._count.id]));
  const mapped = rows.items
    .map((row) => ({
      ...row,
      usedByMultipleEmployees: multiMap.get(row.deviceId) ?? false,
      trustedDevicesCount: trustedMap.get(row.employeeId) ?? 0
    }))
    .filter((row) => params.multi === "1" ? row.usedByMultipleEmployees : true);
  return { ...rows, items: mapped };
}

export async function getAdjustmentRequests(params: AdjustmentParams) {
  const page = pageFromParam(params.page);
  const where: Prisma.TimeAdjustmentRequestWhereInput = {
    status: isAdjustmentStatus(params.status) ? params.status : undefined,
    employeeId: params.employeeId || undefined
  };
  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.timeAdjustmentRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        employee: { include: { user: { select: { id: true, name: true, email: true } } } },
        shift: { include: { location: true } },
        reviewedBy: { select: { id: true, name: true } }
      }
    }),
    countRows: () => prisma.timeAdjustmentRequest.count({ where })
  });
}

export async function getDisplayDeviceDetail(id: string) {
  const device = await prisma.locationDisplayDevice.findUnique({
    where: { id },
    include: {
      location: true,
      approvedBy: { select: { id: true, name: true, email: true } },
      revokedBy: { select: { id: true, name: true, email: true } },
      displaySessions: {
        orderBy: { createdAt: "desc" },
        take: 20
      },
      qrTokens: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: {
          usedByEmployee: {
            include: { user: { select: { id: true, name: true, email: true } } }
          }
        }
      }
    }
  });
  if (!device) return null;

  const sessionIds = device.displaySessions.map((session) => session.id);
  const qrTokenIds = device.qrTokens.map((token) => token.id);
  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: "LOCATION_DISPLAY_DEVICE", entityId: device.id },
        { entityType: "LOCATION_DISPLAY_SESSION", entityId: { in: sessionIds } },
        { entityType: "QR_TOKEN", entityId: { in: qrTokenIds } }
      ]
    },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true } } },
    take: 100
  });

  return { device, auditLogs };
}

export async function getTimeReports(params: TimesheetParams) {
  const where: Prisma.TimesheetDayWhereInput = {
    employeeId: params.employeeId || undefined,
    locationId: params.locationId || undefined,
    date: { gte: params.from || undefined, lte: params.to || undefined }
  };
  const days = await prisma.timesheetDay.findMany({
    where,
    include: {
      employee: { include: { user: { select: { id: true, name: true } } } },
      location: true
    },
    orderBy: { date: "desc" },
    take: 500
  });

  const byEmployee = new Map<string, { employee: string; planned: number; worked: number; late: number; lateCount: number; early: number; pending: number }>();
  const byLocation = new Map<string, { location: string; shifts: number; violations: number; pending: number }>();
  for (const day of days) {
    const employeeRow = byEmployee.get(day.employeeId) ?? {
      employee: day.employee.user.name,
      planned: 0,
      worked: 0,
      late: 0,
      lateCount: 0,
      early: 0,
      pending: 0
    };
    employeeRow.planned += day.plannedStart && day.plannedEnd ? Math.round((day.plannedEnd.getTime() - day.plannedStart.getTime()) / 60_000) : 0;
    employeeRow.worked += day.workedMinutes;
    employeeRow.late += day.lateMinutes;
    employeeRow.lateCount += day.lateMinutes > 0 ? 1 : 0;
    employeeRow.early += day.earlyLeaveMinutes;
    employeeRow.pending += day.hasPendingEvents ? 1 : 0;
    byEmployee.set(day.employeeId, employeeRow);

    if (day.locationId && day.location) {
      const locationRow = byLocation.get(day.locationId) ?? { location: day.location.name, shifts: 0, violations: 0, pending: 0 };
      locationRow.shifts += 1;
      locationRow.violations += day.lateMinutes > 0 || day.earlyLeaveMinutes > 0 ? 1 : 0;
      locationRow.pending += day.hasPendingEvents ? 1 : 0;
      byLocation.set(day.locationId, locationRow);
    }
  }

  return {
    lateReport: [...byEmployee.values()].map((row) => ({ employee: row.employee, lateCount: row.lateCount, lateMinutes: row.late })),
    employeeReport: [...byEmployee.values()],
    locationReport: [...byLocation.values()]
  };
}

function normalizeYear(value: TimesheetMatrixParams["year"], fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed >= 2020 && parsed <= 2100 ? parsed : fallback;
}

function normalizeMonth(value: TimesheetMatrixParams["month"], fallback: number) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : fallback;
}

function employeeDateKey(employeeId: string, date: string) {
  return `${employeeId}:${date}`;
}

function groupByEmployeeDate<T>(
  items: T[],
  employeeId: (item: T) => string,
  date: (item: T) => string
) {
  const grouped = new Map<string, T[]>();
  for (const item of items) {
    const key = employeeDateKey(employeeId(item), date(item));
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }
  return grouped;
}

function serializeLocation(location: { id: string; name: string } | null) {
  return location ? { id: location.id, name: location.name } : null;
}

function serializeTimesheetDay(day: Awaited<ReturnType<typeof prisma.timesheetDay.findMany>>[number] & {
  shift?: { id: string; startsAt: Date; endsAt: Date; breakMinutes: number } | null;
  scheduleDayStatus?: { id: string; status: string; comment: string | null } | null;
  location?: { id: string; name: string } | null;
}) {
  return {
    id: day.id,
    employeeId: day.employeeId,
    date: day.date,
    status: day.status,
    location: day.location ? { id: day.location.id, name: day.location.name } : null,
    shift: day.shift ? {
      id: day.shift.id,
      startsAt: day.shift.startsAt.toISOString(),
      endsAt: day.shift.endsAt.toISOString(),
      breakMinutes: day.shift.breakMinutes
    } : null,
    scheduleDayStatus: day.scheduleDayStatus ? {
      id: day.scheduleDayStatus.id,
      status: day.scheduleDayStatus.status,
      comment: day.scheduleDayStatus.comment
    } : null,
    plannedStart: day.plannedStart?.toISOString() ?? null,
    plannedEnd: day.plannedEnd?.toISOString() ?? null,
    actualCheckIn: day.actualCheckIn?.toISOString() ?? null,
    actualCheckOut: day.actualCheckOut?.toISOString() ?? null,
    workedMinutes: day.workedMinutes,
    lateMinutes: day.lateMinutes,
    earlyLeaveMinutes: day.earlyLeaveMinutes,
    overtimeMinutes: day.overtimeMinutes,
    hasPendingEvents: day.hasPendingEvents
  };
}

function serializeTimeEvent(event: Awaited<ReturnType<typeof prisma.timeEvent.findMany>>[number] & {
  location?: { id: string; name: string } | null;
  reviewedBy?: { id: string; name: string } | null;
}) {
  return {
    id: event.id,
    type: event.type,
    status: event.status,
    occurredAt: event.occurredAt.toISOString(),
    clientTime: event.clientTime?.toISOString() ?? null,
    source: event.source,
    location: event.location ? { id: event.location.id, name: event.location.name } : null,
    distanceFromLocationMeters: event.distanceFromLocationMeters,
    accuracy: event.accuracy,
    ipAddress: event.ipAddress,
    riskFlags: event.riskFlags,
    reviewComment: event.reviewComment,
    reviewedBy: event.reviewedBy ? { id: event.reviewedBy.id, name: event.reviewedBy.name } : null,
    reviewedAt: event.reviewedAt?.toISOString() ?? null
  };
}

function serializeAdjustment(adjustment: Awaited<ReturnType<typeof prisma.timeAdjustmentRequest.findMany>>[number] & {
  reviewedBy?: { id: string; name: string } | null;
}) {
  return {
    id: adjustment.id,
    requestedAction: adjustment.requestedAction,
    eventType: adjustment.eventType,
    requestedOccurredAt: adjustment.requestedOccurredAt?.toISOString() ?? null,
    comment: adjustment.comment,
    status: adjustment.status,
    reviewedBy: adjustment.reviewedBy ? { id: adjustment.reviewedBy.id, name: adjustment.reviewedBy.name } : null,
    reviewedAt: adjustment.reviewedAt?.toISOString() ?? null,
    reviewComment: adjustment.reviewComment,
    createdAt: adjustment.createdAt.toISOString()
  };
}

function serializeAuditLog(log: Awaited<ReturnType<typeof prisma.auditLog.findMany>>[number] & {
  user?: { id: string; name: string } | null;
}) {
  return {
    id: log.id,
    entityType: log.entityType,
    entityId: log.entityId,
    action: log.action,
    user: log.user ? { id: log.user.id, name: log.user.name } : null,
    createdAt: log.createdAt.toISOString()
  };
}

function calculateTimesheetTotals(cells: Array<{
  timesheetDay: ReturnType<typeof serializeTimesheetDay> | null;
}>) {
  return cells.reduce((totals, cell) => {
    const day = cell.timesheetDay;
    if (!day) return totals;
    const plannedMinutes = day.plannedStart && day.plannedEnd
      ? Math.max(0, Math.round((new Date(day.plannedEnd).getTime() - new Date(day.plannedStart).getTime()) / 60_000) - (day.shift?.breakMinutes ?? 0))
      : 0;
    totals.plannedMinutes += plannedMinutes;
    totals.workedMinutes += day.workedMinutes;
    totals.lateMinutes += day.lateMinutes;
    totals.earlyLeaveMinutes += day.earlyLeaveMinutes;
    totals.lateCount += day.lateMinutes > 0 ? 1 : 0;
    totals.earlyLeaveCount += day.earlyLeaveMinutes > 0 ? 1 : 0;
    totals.pendingReviewCount += day.hasPendingEvents || day.status === "PENDING_REVIEW" ? 1 : 0;
    totals.vacationCount += day.status === "VACATION" ? 1 : 0;
    totals.sickLeaveCount += day.status === "SICK_LEAVE" ? 1 : 0;
    totals.businessTripCount += day.status === "BUSINESS_TRIP" ? 1 : 0;
    totals.dayOffCount += day.status === "DAY_OFF" ? 1 : 0;
    return totals;
  }, {
    plannedMinutes: 0,
    workedMinutes: 0,
    lateCount: 0,
    lateMinutes: 0,
    earlyLeaveCount: 0,
    earlyLeaveMinutes: 0,
    pendingReviewCount: 0,
    vacationCount: 0,
    sickLeaveCount: 0,
    businessTripCount: 0,
    dayOffCount: 0
  });
}

function isWorkShiftStatus(value?: string): value is WorkShiftStatus {
  return Boolean(value && ["PLANNED", "COMPLETED", "MISSED", "CANCELLED", "PENDING_REVIEW"].includes(value));
}

function isTimesheetStatus(value?: string): value is TimesheetDayStatus {
  return Boolean(value && ["SCHEDULED", "DAY_OFF", "VACATION", "SICK_LEAVE", "BUSINESS_TRIP", "OK", "LATE", "EARLY_LEAVE", "LATE_AND_EARLY_LEAVE", "MISSING_CHECK_IN", "MISSING_CHECK_OUT", "ABSENT", "PENDING_REVIEW", "MANUAL_ADJUSTED"].includes(value));
}

function isEmployeeDeviceStatus(value?: string): value is EmployeeDeviceStatus {
  return Boolean(value && ["TRUSTED", "PENDING", "BLOCKED"].includes(value));
}

function isAdjustmentStatus(value?: string): value is TimeAdjustmentStatus {
  return Boolean(value && ["PENDING", "APPROVED", "REJECTED"].includes(value));
}
