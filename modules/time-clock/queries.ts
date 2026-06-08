import type { EmployeeDeviceStatus, Prisma, TimeAdjustmentStatus, TimesheetDayStatus, WorkShiftStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { paginatedQuery, sortFromParam } from "@/modules/crm/list-query";
import { pageFromParam } from "@/modules/crm/pagination";

const PAGE_SIZE = 20;

export type WorkLocationParams = { q?: string; active?: string; page?: string };
export type WorkShiftParams = { employeeId?: string; locationId?: string; status?: string; from?: string; to?: string; page?: string };
export type TimesheetParams = { employeeId?: string; locationId?: string; status?: string; from?: string; to?: string; page?: string; sort?: string };
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

function isWorkShiftStatus(value?: string): value is WorkShiftStatus {
  return Boolean(value && ["PLANNED", "COMPLETED", "MISSED", "CANCELLED", "PENDING_REVIEW"].includes(value));
}

function isTimesheetStatus(value?: string): value is TimesheetDayStatus {
  return Boolean(value && ["SCHEDULED", "OK", "LATE", "EARLY_LEAVE", "LATE_AND_EARLY_LEAVE", "MISSING_CHECK_IN", "MISSING_CHECK_OUT", "ABSENT", "PENDING_REVIEW", "MANUAL_ADJUSTED"].includes(value));
}

function isEmployeeDeviceStatus(value?: string): value is EmployeeDeviceStatus {
  return Boolean(value && ["TRUSTED", "PENDING", "BLOCKED"].includes(value));
}

function isAdjustmentStatus(value?: string): value is TimeAdjustmentStatus {
  return Boolean(value && ["PENDING", "APPROVED", "REJECTED"].includes(value));
}
