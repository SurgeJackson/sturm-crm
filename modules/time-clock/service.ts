import type {
  EmployeeDeviceStatus,
  Prisma,
  PrismaClient,
  TimeEventStatus,
  TimeEventType,
  TimesheetDayStatus
} from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createRawToken, hashToken } from "@/lib/token";
import { writeAuditLog } from "@/lib/audit-log";
import type { RequestContext } from "@/lib/request-context";
import type { PermissionUser } from "@/permissions";
import {
  addDays,
  addMinutes,
  DISPLAY_SESSION_TTL_DAYS,
  fingerprintHash,
  getDateKey,
  getDistanceMeters,
  LATE_GRACE_MINUTES,
  EARLY_LEAVE_GRACE_MINUTES,
  minutesBetween,
  nextSuggestedAction,
  QR_TOKEN_TTL_SECONDS,
  SETUP_TOKEN_TTL_MINUTES
} from "@/modules/time-clock/utils";

type DbClient = PrismaClient | Prisma.TransactionClient;

export class TimeClockServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TimeClockServiceError";
  }
}

export async function ensureEmployeeProfile(userId: string, client: DbClient = prisma) {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true, isActive: true, name: true }
  });
  if (!user || !user.isActive) throw new TimeClockServiceError("Пользователь не является активным сотрудником");

  return client.employeeProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      position: "Сотрудник",
      employmentStatus: "ACTIVE",
      trustedDeviceLimit: 2
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      defaultLocation: true
    }
  });
}

export async function registerOrTouchEmployeeDevice({
  userId,
  deviceId,
  deviceName,
  userAgent,
  client = prisma
}: {
  userId: string;
  deviceId: string;
  deviceName?: string;
  userAgent?: string | null;
  client?: DbClient;
}) {
  const employee = await ensureEmployeeProfile(userId, client);
  const now = new Date();
  const existing = await client.employeeTrustedDevice.findUnique({
    where: { employeeId_deviceId: { employeeId: employee.id, deviceId } }
  });

  if (existing) {
    return client.employeeTrustedDevice.update({
      where: { id: existing.id },
      data: {
        deviceName: deviceName || existing.deviceName,
        userAgent: userAgent || existing.userAgent,
        fingerprintHash: fingerprintHash(deviceId, userAgent),
        lastSeenAt: now
      }
    });
  }

  return client.employeeTrustedDevice.create({
    data: {
      employeeId: employee.id,
      deviceId,
      deviceName,
      userAgent: userAgent || "unknown",
      fingerprintHash: fingerprintHash(deviceId, userAgent),
      status: "PENDING",
      firstSeenAt: now,
      lastSeenAt: now
    }
  });
}

export async function getMyDay({
  user,
  deviceId,
  requestContext
}: {
  user: PermissionUser;
  deviceId?: string;
  requestContext?: RequestContext;
}) {
  const employee = await ensureEmployeeProfile(user.id!);
  const device = deviceId
    ? await registerOrTouchEmployeeDevice({
        userId: user.id!,
        deviceId,
        userAgent: requestContext?.userAgent
      })
    : null;
  const now = new Date();
  const date = getDateKey(now, employee.defaultLocation?.timezone);
  const shift = await prisma.workShift.findFirst({
    where: {
      employeeId: employee.id,
      date,
      status: { not: "CANCELLED" }
    },
    orderBy: { startsAt: "asc" },
    include: { location: true }
  });
  const timesheetDay = await prisma.timesheetDay.findUnique({
    where: { employeeId_date: { employeeId: employee.id, date } },
    include: { location: true, shift: true }
  });
  const events = await prisma.timeEvent.findMany({
    where: {
      employeeId: employee.id,
      occurredAt: {
        gte: new Date(`${date}T00:00:00.000`),
        lte: new Date(`${date}T23:59:59.999`)
      },
      status: { in: ["ACCEPTED", "MANUAL", "PENDING_REVIEW"] },
      type: { in: ["CHECK_IN", "CHECK_OUT"] }
    },
    orderBy: { occurredAt: "asc" }
  });

  return {
    date,
    employee,
    shift,
    timesheetDay,
    lastEvent: events.at(-1) ?? null,
    nextSuggestedAction: nextSuggestedAction(events),
    employeeDeviceStatus: device?.status ?? "unknown",
    device
  };
}

export async function createWorkLocation(data: {
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number;
  maxAllowedAccuracyMeters: number;
  timezone: string;
  isActive: boolean;
}, actorUserId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const location = await tx.workLocation.create({ data });
      await writeAuditLog({
        entityType: "WORK_LOCATION",
        entityId: location.id,
        action: "work_location.created",
        userId: actorUserId,
        after: location
      }, tx);
      return location;
    });
  } catch (error) {
    if (isUniqueConstraint(error)) throw new TimeClockServiceError("Рабочая точка с таким кодом уже существует");
    throw error;
  }
}

export async function updateWorkLocation(id: string, data: Parameters<typeof createWorkLocation>[0], actorUserId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const before = await tx.workLocation.findUnique({ where: { id } });
      if (!before) throw new TimeClockServiceError("Рабочая точка не найдена");
      const location = await tx.workLocation.update({ where: { id }, data });
      await writeAuditLog({
        entityType: "WORK_LOCATION",
        entityId: location.id,
        action: "work_location.updated",
        userId: actorUserId,
        before,
        after: location
      }, tx);
      return location;
    });
  } catch (error) {
    if (isUniqueConstraint(error)) throw new TimeClockServiceError("Рабочая точка с таким кодом уже существует");
    throw error;
  }
}

export async function setWorkLocationActive(id: string, isActive: boolean, actorUserId: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.workLocation.findUnique({ where: { id } });
    if (!before) throw new TimeClockServiceError("Рабочая точка не найдена");
    const location = await tx.workLocation.update({ where: { id }, data: { isActive } });
    await writeAuditLog({
      entityType: "WORK_LOCATION",
      entityId: id,
      action: isActive ? "work_location.activated" : "work_location.deactivated",
      userId: actorUserId,
      before,
      after: location
    }, tx);
    return location;
  });
}

export async function createOrUpdateWorkShift(data: {
  id?: string;
  employeeId: string;
  locationId: string;
  date: string;
  startsAt: Date;
  endsAt: Date;
  breakMinutes: number;
}, actorUserId: string) {
  if (data.endsAt <= data.startsAt) {
    throw new TimeClockServiceError("Окончание смены должно быть позже начала");
  }

  return prisma.$transaction(async (tx) => {
    const employee = await tx.employeeProfile.findFirst({
      where: { id: data.employeeId, employmentStatus: "ACTIVE", user: { isActive: true } }
    });
    if (!employee) throw new TimeClockServiceError("Сотрудник не найден или неактивен");

    const location = await tx.workLocation.findFirst({ where: { id: data.locationId, isActive: true } });
    if (!location) throw new TimeClockServiceError("Рабочая точка не найдена или выключена");

    const overlapping = await tx.workShift.findFirst({
      where: {
        employeeId: data.employeeId,
        status: { not: "CANCELLED" },
        id: data.id ? { not: data.id } : undefined,
        startsAt: { lt: data.endsAt },
        endsAt: { gt: data.startsAt }
      }
    });
    if (overlapping) throw new TimeClockServiceError("У сотрудника уже есть смена, пересекающаяся по времени");

    const before = data.id ? await tx.workShift.findUnique({ where: { id: data.id } }) : null;
    const shift = data.id
      ? await tx.workShift.update({
          where: { id: data.id },
          data: {
            employeeId: data.employeeId,
            locationId: data.locationId,
            date: data.date,
            startsAt: data.startsAt,
            endsAt: data.endsAt,
            breakMinutes: data.breakMinutes
          }
        })
      : await tx.workShift.create({
          data: {
            employeeId: data.employeeId,
            locationId: data.locationId,
            date: data.date,
            startsAt: data.startsAt,
            endsAt: data.endsAt,
            breakMinutes: data.breakMinutes,
            createdById: actorUserId
          }
        });

    await tx.timesheetDay.upsert({
      where: { employeeId_date: { employeeId: data.employeeId, date: data.date } },
      update: {
        userId: employee.userId,
        shiftId: shift.id,
        locationId: data.locationId,
        plannedStart: data.startsAt,
        plannedEnd: data.endsAt,
        status: "SCHEDULED"
      },
      create: {
        employeeId: data.employeeId,
        userId: employee.userId,
        date: data.date,
        shiftId: shift.id,
        locationId: data.locationId,
        plannedStart: data.startsAt,
        plannedEnd: data.endsAt,
        status: "SCHEDULED"
      }
    });

    await writeAuditLog({
      entityType: "WORK_SHIFT",
      entityId: shift.id,
      action: data.id ? "work_shift.updated" : "work_shift.created",
      userId: actorUserId,
      before,
      after: shift
    }, tx);

    return shift;
  });
}

export async function cancelWorkShift(id: string, actorUserId: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.workShift.findUnique({ where: { id } });
    if (!before) throw new TimeClockServiceError("Смена не найдена");
    const shift = await tx.workShift.update({ where: { id }, data: { status: "CANCELLED" } });
    await recalculateTimesheetDay(before.employeeId, before.date, tx);
    await writeAuditLog({
      entityType: "WORK_SHIFT",
      entityId: id,
      action: "work_shift.cancelled",
      userId: actorUserId,
      before,
      after: shift
    }, tx);
    return shift;
  });
}

export async function createDisplaySetupToken(locationId: string, actorUserId: string, expiresInMinutes = SETUP_TOKEN_TTL_MINUTES) {
  const rawToken = createRawToken();
  const expiresAt = addMinutes(new Date(), expiresInMinutes);
  return prisma.$transaction(async (tx) => {
    const location = await tx.workLocation.findFirst({ where: { id: locationId, isActive: true } });
    if (!location) throw new TimeClockServiceError("Рабочая точка не найдена или выключена");
    const token = await tx.locationDisplaySetupToken.create({
      data: {
        locationId,
        tokenHash: hashToken(rawToken),
        expiresAt,
        createdById: actorUserId
      }
    });
    await writeAuditLog({
      entityType: "LOCATION_DISPLAY_SETUP_TOKEN",
      entityId: token.id,
      action: "location_display_setup_token.created",
      userId: actorUserId,
      after: { locationId, expiresAt }
    }, tx);
    return { rawToken, expiresAt, location };
  });
}

export async function setupLocationDisplay({
  setupToken,
  deviceId,
  deviceName,
  fingerprintHash: suppliedFingerprint,
  userAgent,
  ipAddress
}: {
  setupToken: string;
  deviceId: string;
  deviceName: string;
  fingerprintHash: string;
  userAgent?: string | null;
  ipAddress?: string | null;
}) {
  const sessionToken = createRawToken();
  const now = new Date();
  return prisma.$transaction(async (tx) => {
    const setup = await tx.locationDisplaySetupToken.findUnique({
      where: { tokenHash: hashToken(setupToken) },
      include: { location: true }
    });
    if (!setup || setup.usedAt || setup.expiresAt <= now || !setup.location.isActive) {
      throw new TimeClockServiceError("Ссылка подключения QR-экрана устарела или уже использована");
    }

    const device = await tx.locationDisplayDevice.upsert({
      where: { locationId_deviceId: { locationId: setup.locationId, deviceId } },
      update: {
        name: deviceName,
        fingerprintHash: suppliedFingerprint,
        userAgent: userAgent || "unknown",
        status: "ACTIVE",
        lastSeenAt: now,
        lastIpAddress: ipAddress
      },
      create: {
        locationId: setup.locationId,
        name: deviceName,
        deviceId,
        fingerprintHash: suppliedFingerprint,
        userAgent: userAgent || "unknown",
        status: "ACTIVE",
        lastSeenAt: now,
        lastIpAddress: ipAddress,
        approvedById: setup.createdById,
        approvedAt: now
      }
    });

    const session = await tx.locationDisplaySession.create({
      data: {
        locationId: setup.locationId,
        displayDeviceId: device.id,
        sessionHash: hashToken(sessionToken),
        status: "ACTIVE",
        expiresAt: addDays(now, DISPLAY_SESSION_TTL_DAYS),
        lastSeenAt: now,
        lastIpAddress: ipAddress
      }
    });

    await tx.locationDisplaySetupToken.update({
      where: { id: setup.id },
      data: { usedAt: now, usedByDeviceId: deviceId }
    });

    await writeAuditLog({
      entityType: "LOCATION_DISPLAY_DEVICE",
      entityId: device.id,
      action: "location_display_device.registered",
      userId: setup.createdById,
      after: { locationId: setup.locationId, deviceName, ipAddress }
    }, tx);

    return { sessionToken, session, device, location: setup.location };
  });
}

export async function getCurrentQr({
  sessionToken,
  deviceId,
  ipAddress,
  origin
}: {
  sessionToken?: string;
  deviceId: string;
  ipAddress?: string | null;
  origin?: string;
}) {
  if (!sessionToken) throw new TimeClockServiceError("QR-экран не подключен. Используйте одноразовую ссылку подключения.");
  const now = new Date();
  const rawQrToken = createRawToken();

  return prisma.$transaction(async (tx) => {
    const session = await tx.locationDisplaySession.findUnique({
      where: { sessionHash: hashToken(sessionToken) },
      include: {
        location: true,
        displayDevice: true
      }
    });

    if (!session || session.status !== "ACTIVE") {
      throw new TimeClockServiceError("Display-сессия отозвана или недоступна");
    }
    if (session.expiresAt <= now) {
      await tx.locationDisplaySession.update({ where: { id: session.id }, data: { status: "EXPIRED" } });
      throw new TimeClockServiceError("Display-сессия истекла. Подключите QR-экран заново.");
    }
    if (!session.location.isActive) throw new TimeClockServiceError("Рабочая точка выключена");
    if (session.displayDevice.status !== "ACTIVE") {
      throw new TimeClockServiceError("QR-экран заблокирован или отозван");
    }
    if (session.displayDevice.deviceId !== deviceId) {
      await writeAuditLog({
        entityType: "LOCATION_DISPLAY_SESSION",
        entityId: session.id,
        action: "location_display_session.device_mismatch",
        userId: session.displayDevice.approvedById,
        after: { expectedDeviceId: session.displayDevice.deviceId, actualDeviceId: deviceId }
      }, tx);
      throw new TimeClockServiceError("Ссылка QR-экрана открыта на другом устройстве");
    }

    const riskFlags: string[] = [];
    if (session.lastIpAddress && ipAddress && session.lastIpAddress !== ipAddress) {
      riskFlags.push("new_ip_for_display_device", "display_session_suspicious");
    }

    const activeSessions = await tx.locationDisplaySession.count({
      where: {
        displayDeviceId: session.displayDeviceId,
        status: "ACTIVE",
        expiresAt: { gt: now },
        id: { not: session.id }
      }
    });
    if (activeSessions > 0) riskFlags.push("multiple_display_sessions", "display_session_suspicious");

    const recentToken = await tx.qrToken.findFirst({
      where: {
        displaySessionId: session.id,
        createdAt: { gt: addMinutes(now, -1) }
      },
      orderBy: { createdAt: "desc" }
    });
    if (recentToken && now.getTime() - recentToken.createdAt.getTime() < 15_000) {
      throw new TimeClockServiceError("QR обновляется слишком часто. Подождите несколько секунд.");
    }

    const qrToken = await tx.qrToken.create({
      data: {
        locationId: session.locationId,
        displayDeviceId: session.displayDeviceId,
        displaySessionId: session.id,
        tokenHash: hashToken(rawQrToken),
        issuedAt: now,
        expiresAt: addMinutes(now, QR_TOKEN_TTL_SECONDS / 60),
        status: "ACTIVE"
      }
    });

    await tx.locationDisplaySession.update({
      where: { id: session.id },
      data: { lastSeenAt: now, lastIpAddress: ipAddress }
    });
    await tx.locationDisplayDevice.update({
      where: { id: session.displayDeviceId },
      data: { lastSeenAt: now, lastIpAddress: ipAddress }
    });

    if (riskFlags.length) {
      await writeAuditLog({
        entityType: "LOCATION_DISPLAY_SESSION",
        entityId: session.id,
        action: "location_display_session.suspicious",
        userId: session.displayDevice.approvedById,
        after: { riskFlags, ipAddress }
      }, tx);
    }

    await writeAuditLog({
      entityType: "QR_TOKEN",
      entityId: qrToken.id,
      action: "qr_token.created",
      userId: session.displayDevice.approvedById,
      after: {
        locationId: session.locationId,
        displayDeviceId: session.displayDeviceId,
        displaySessionId: session.id,
        expiresAt: qrToken.expiresAt,
        ipAddress,
        riskFlags
      }
    }, tx);

    return {
      checkUrl: `${origin ?? ""}/time-clock/scan?token=${rawQrToken}`,
      expiresAt: qrToken.expiresAt,
      locationName: session.location.name,
      displayDeviceName: session.displayDevice.name,
      riskFlags
    };
  });
}

export async function markTimeEvent({
  user,
  token,
  type,
  latitude,
  longitude,
  accuracy,
  clientTime,
  deviceId,
  deviceName,
  requestContext
}: {
  user: PermissionUser;
  token: string;
  type: TimeEventType;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  clientTime?: string;
  deviceId: string;
  deviceName?: string;
  requestContext?: RequestContext;
}) {
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const employee = await ensureEmployeeProfile(user.id!, tx);
    const device = await registerOrTouchEmployeeDevice({
      userId: user.id!,
      deviceId,
      deviceName,
      userAgent: requestContext?.userAgent,
      client: tx
    });

    const qrToken = await tx.qrToken.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        location: true,
        displayDevice: true,
        displaySession: true
      }
    });

    if (!qrToken) {
      return {
        status: "REJECTED" as TimeEventStatus,
        message: "QR-код недействителен. Отсканируйте новый код на экране точки.",
        riskFlags: ["qr_token_invalid"],
        event: null,
        timesheetDay: null
      };
    }

    const riskFlags = new Set<string>();
    if (qrToken.status !== "ACTIVE" || qrToken.expiresAt <= now) riskFlags.add("qr_token_expired");
    if (!qrToken.location.isActive) riskFlags.add("qr_token_invalid");
    if (qrToken.displayDevice.status !== "ACTIVE") riskFlags.add("display_device_untrusted");
    if (qrToken.displaySession.status !== "ACTIVE" || qrToken.displaySession.expiresAt <= now) riskFlags.add("display_session_suspicious");

    if (device.status === "PENDING") riskFlags.add("untrusted_employee_device");
    if (device.status === "BLOCKED") riskFlags.add("untrusted_employee_device");

    const deviceUsers = await tx.employeeTrustedDevice.findMany({
      where: { deviceId },
      select: { employeeId: true },
      distinct: ["employeeId"]
    });
    if (deviceUsers.length > 1) riskFlags.add("device_used_by_multiple_employees");

    const date = getDateKey(now, qrToken.location.timezone);
    const shift = await tx.workShift.findFirst({
      where: {
        employeeId: employee.id,
        date,
        status: { not: "CANCELLED" }
      },
      orderBy: { startsAt: "asc" }
    });
    if (!shift) riskFlags.add("no_shift_found");
    if (shift && shift.locationId !== qrToken.locationId) riskFlags.add("shift_location_mismatch");

    const hasGeo = latitude !== undefined && longitude !== undefined && accuracy !== undefined;
    const distance = hasGeo
      ? getDistanceMeters(latitude, longitude, qrToken.location.latitude, qrToken.location.longitude)
      : null;
    if (!hasGeo) riskFlags.add("geo_unavailable");
    if (distance !== null && distance > qrToken.location.allowedRadiusMeters) riskFlags.add("outside_geofence");
    if (accuracy !== undefined && accuracy > qrToken.location.maxAllowedAccuracyMeters) riskFlags.add("low_geo_accuracy");

    const dayEvents = await tx.timeEvent.findMany({
      where: {
        employeeId: employee.id,
        occurredAt: {
          gte: new Date(`${date}T00:00:00.000`),
          lte: new Date(`${date}T23:59:59.999`)
        },
        status: { in: ["ACCEPTED", "MANUAL", "PENDING_REVIEW"] },
        type: { in: ["CHECK_IN", "CHECK_OUT"] }
      },
      orderBy: { occurredAt: "asc" }
    });
    const suggested = nextSuggestedAction(dayEvents);
    if (suggested === "none") riskFlags.add("duplicate_event");
    if (type === "CHECK_IN" && suggested !== "check_in") riskFlags.add("duplicate_event");
    if (type === "CHECK_OUT" && suggested !== "check_out") riskFlags.add("invalid_event_sequence");

    const criticalFlags = ["qr_token_expired", "qr_token_invalid"];
    let status: TimeEventStatus = "ACCEPTED";
    if ([...riskFlags].some((flag) => criticalFlags.includes(flag)) || device.status === "BLOCKED" || riskFlags.has("duplicate_event") || riskFlags.has("invalid_event_sequence")) {
      status = "REJECTED";
    } else if (riskFlags.size > 0) {
      status = "PENDING_REVIEW";
    }

    const event = await tx.timeEvent.create({
      data: {
        employeeId: employee.id,
        userId: user.id!,
        locationId: qrToken.locationId,
        shiftId: shift?.id,
        qrTokenId: qrToken.id,
        type,
        occurredAt: now,
        clientTime: clientTime ? new Date(clientTime) : undefined,
        source: "QR_GEO_WEB",
        latitude,
        longitude,
        accuracy,
        distanceFromLocationMeters: distance,
        deviceId,
        trustedDeviceId: device.id,
        ipAddress: requestContext?.ipAddress,
        userAgent: requestContext?.userAgent,
        status,
        riskFlags: [...riskFlags]
      }
    });

    await tx.qrToken.update({
      where: { id: qrToken.id },
      data: {
        status: qrToken.expiresAt <= now ? "EXPIRED" : "USED",
        usedAt: now,
        usedByEmployeeId: employee.id
      }
    });

    const timesheetDay = await recalculateTimesheetDay(employee.id, date, tx);
    await writeAuditLog({
      entityType: "TIME_EVENT",
      entityId: event.id,
      action: "time_event.created",
      userId: user.id!,
      after: { status, type, riskFlags: [...riskFlags], distance }
    }, tx);

    return {
      status,
      message: statusMessage(status, [...riskFlags]),
      riskFlags: [...riskFlags],
      event,
      timesheetDay
    };
  });
}

export async function recalculateTimesheetDay(employeeId: string, date: string, client: DbClient = prisma) {
  const employee = await client.employeeProfile.findUnique({ where: { id: employeeId } });
  if (!employee) throw new TimeClockServiceError("Профиль сотрудника не найден");
  const shift = await client.workShift.findFirst({
    where: { employeeId, date, status: { not: "CANCELLED" } },
    orderBy: { startsAt: "asc" }
  });
  const events = await client.timeEvent.findMany({
    where: {
      employeeId,
      occurredAt: {
        gte: new Date(`${date}T00:00:00.000`),
        lte: new Date(`${date}T23:59:59.999`)
      }
    },
    orderBy: { occurredAt: "asc" }
  });

  const accepted = events.filter((event) => event.status === "ACCEPTED" || event.status === "MANUAL");
  const hasPendingEvents = events.some((event) => event.status === "PENDING_REVIEW");
  const hasManual = accepted.some((event) => event.status === "MANUAL" || event.riskFlags.includes("manual_adjustment"));
  const actualCheckIn = accepted.find((event) => event.type === "CHECK_IN")?.occurredAt ?? null;
  const actualCheckOut = accepted.filter((event) => event.type === "CHECK_OUT").at(-1)?.occurredAt ?? null;
  const workedMinutes = Math.max(0, minutesBetween(actualCheckIn, actualCheckOut) - (shift?.breakMinutes ?? 0));
  const lateMinutes = shift && actualCheckIn && actualCheckIn > addMinutes(shift.startsAt, LATE_GRACE_MINUTES)
    ? minutesBetween(shift.startsAt, actualCheckIn)
    : 0;
  const earlyLeaveMinutes = shift && actualCheckOut && actualCheckOut < addMinutes(shift.endsAt, -EARLY_LEAVE_GRACE_MINUTES)
    ? minutesBetween(actualCheckOut, shift.endsAt)
    : 0;
  const overtimeMinutes = shift && actualCheckOut && actualCheckOut > shift.endsAt
    ? minutesBetween(shift.endsAt, actualCheckOut)
    : 0;
  const status = resolveTimesheetStatus({
    shift,
    actualCheckIn,
    actualCheckOut,
    hasPendingEvents,
    hasManual,
    lateMinutes,
    earlyLeaveMinutes
  });

  return client.timesheetDay.upsert({
    where: { employeeId_date: { employeeId, date } },
    update: {
      userId: employee.userId,
      shiftId: shift?.id,
      locationId: shift?.locationId,
      plannedStart: shift?.startsAt,
      plannedEnd: shift?.endsAt,
      actualCheckIn,
      actualCheckOut,
      workedMinutes,
      lateMinutes,
      earlyLeaveMinutes,
      overtimeMinutes,
      status,
      hasPendingEvents
    },
    create: {
      employeeId,
      userId: employee.userId,
      date,
      shiftId: shift?.id,
      locationId: shift?.locationId,
      plannedStart: shift?.startsAt,
      plannedEnd: shift?.endsAt,
      actualCheckIn,
      actualCheckOut,
      workedMinutes,
      lateMinutes,
      earlyLeaveMinutes,
      overtimeMinutes,
      status,
      hasPendingEvents
    }
  });
}

function resolveTimesheetStatus({
  shift,
  actualCheckIn,
  actualCheckOut,
  hasPendingEvents,
  hasManual,
  lateMinutes,
  earlyLeaveMinutes
}: {
  shift: { endsAt: Date } | null;
  actualCheckIn?: Date | null;
  actualCheckOut?: Date | null;
  hasPendingEvents: boolean;
  hasManual: boolean;
  lateMinutes: number;
  earlyLeaveMinutes: number;
}): TimesheetDayStatus {
  if (hasPendingEvents) return "PENDING_REVIEW";
  if (hasManual) return "MANUAL_ADJUSTED";
  if (!shift) return actualCheckIn || actualCheckOut ? "PENDING_REVIEW" : "ABSENT";
  if (!actualCheckIn && !actualCheckOut) return new Date() > shift.endsAt ? "ABSENT" : "SCHEDULED";
  if (!actualCheckIn) return "MISSING_CHECK_IN";
  if (!actualCheckOut) return "MISSING_CHECK_OUT";
  if (lateMinutes > 0 && earlyLeaveMinutes > 0) return "LATE_AND_EARLY_LEAVE";
  if (lateMinutes > 0) return "LATE";
  if (earlyLeaveMinutes > 0) return "EARLY_LEAVE";
  return "OK";
}

export async function approveTimeEvent(id: string, actorUserId: string, comment?: string, overrideOccurredAt?: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.timeEvent.findUnique({ where: { id } });
    if (!before) throw new TimeClockServiceError("Отметка не найдена");
    const manual = Boolean(overrideOccurredAt);
    const event = await tx.timeEvent.update({
      where: { id },
      data: {
        status: manual ? "MANUAL" : "ACCEPTED",
        occurredAt: overrideOccurredAt ? new Date(overrideOccurredAt) : undefined,
        riskFlags: manual ? [...new Set([...before.riskFlags, "manual_adjustment"])] : before.riskFlags,
        reviewComment: comment,
        reviewedById: actorUserId,
        reviewedAt: new Date()
      }
    });
    const date = getDateKey(event.occurredAt);
    await recalculateTimesheetDay(event.employeeId, date, tx);
    await writeAuditLog({
      entityType: "TIME_EVENT",
      entityId: id,
      action: manual ? "time_event.approved_with_override" : "time_event.approved",
      userId: actorUserId,
      before,
      after: event
    }, tx);
    return event;
  });
}

export async function rejectTimeEvent(id: string, actorUserId: string, comment: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.timeEvent.findUnique({ where: { id } });
    if (!before) throw new TimeClockServiceError("Отметка не найдена");
    const event = await tx.timeEvent.update({
      where: { id },
      data: {
        status: "REJECTED",
        reviewComment: comment,
        reviewedById: actorUserId,
        reviewedAt: new Date()
      }
    });
    await recalculateTimesheetDay(event.employeeId, getDateKey(event.occurredAt), tx);
    await writeAuditLog({
      entityType: "TIME_EVENT",
      entityId: id,
      action: "time_event.rejected",
      userId: actorUserId,
      before,
      after: event
    }, tx);
    return event;
  });
}

export async function changeEmployeeDeviceStatus(id: string, status: EmployeeDeviceStatus, actorUserId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.employeeTrustedDevice.findUnique({
      where: { id },
      include: { employee: true }
    });
    if (!before) throw new TimeClockServiceError("Устройство не найдено");
    if (status === "TRUSTED" && before.status !== "TRUSTED") {
      const trustedCount = await tx.employeeTrustedDevice.count({
        where: {
          employeeId: before.employeeId,
          status: "TRUSTED",
          id: { not: id }
        }
      });
      if (trustedCount >= before.employee.trustedDeviceLimit) {
        throw new TimeClockServiceError(`Лимит доверенных устройств сотрудника уже исчерпан: ${before.employee.trustedDeviceLimit}`);
      }
    }
    const data: Prisma.EmployeeTrustedDeviceUpdateInput = {
      status,
      blockReason: status === "BLOCKED" ? reason : null
    };
    if (status === "TRUSTED") {
      data.approvedBy = { connect: { id: actorUserId } };
      data.approvedAt = new Date();
      data.blockedBy = { disconnect: true };
      data.blockedAt = null;
    }
    if (status === "BLOCKED") {
      data.blockedBy = { connect: { id: actorUserId } };
      data.blockedAt = new Date();
    }
    const device = await tx.employeeTrustedDevice.update({ where: { id }, data });
    await writeAuditLog({
      entityType: "EMPLOYEE_TRUSTED_DEVICE",
      entityId: id,
      action: `employee_trusted_device.${status.toLowerCase()}`,
      userId: actorUserId,
      before,
      after: device
    }, tx);
    return device;
  });
}

export async function revokeDisplayDevice(id: string, actorUserId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.locationDisplayDevice.findUnique({ where: { id } });
    if (!before) throw new TimeClockServiceError("QR-экран не найден");
    const device = await tx.locationDisplayDevice.update({
      where: { id },
      data: {
        status: "REVOKED",
        revokedById: actorUserId,
        revokedAt: new Date(),
        revokeReason: reason
      }
    });
    await tx.locationDisplaySession.updateMany({
      where: { displayDeviceId: id, status: "ACTIVE" },
      data: { status: "REVOKED" }
    });
    await writeAuditLog({
      entityType: "LOCATION_DISPLAY_DEVICE",
      entityId: id,
      action: "location_display_device.revoked",
      userId: actorUserId,
      before,
      after: device
    }, tx);
    return device;
  });
}

export async function blockDisplayDevice(id: string, actorUserId: string, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.locationDisplayDevice.findUnique({ where: { id } });
    if (!before) throw new TimeClockServiceError("QR-экран не найден");
    const device = await tx.locationDisplayDevice.update({
      where: { id },
      data: {
        status: "BLOCKED",
        revokeReason: reason
      }
    });
    await tx.locationDisplaySession.updateMany({
      where: { displayDeviceId: id, status: "ACTIVE" },
      data: { status: "REVOKED" }
    });
    await writeAuditLog({
      entityType: "LOCATION_DISPLAY_DEVICE",
      entityId: id,
      action: "location_display_device.blocked",
      userId: actorUserId,
      before,
      after: device
    }, tx);
    return device;
  });
}

export async function createAdjustmentRequest({
  user,
  date,
  eventType,
  requestedOccurredAt,
  comment
}: {
  user: PermissionUser;
  date: string;
  eventType: TimeEventType;
  requestedOccurredAt: Date;
  comment: string;
}) {
  return prisma.$transaction(async (tx) => {
    const employee = await ensureEmployeeProfile(user.id!, tx);
    const shift = await tx.workShift.findFirst({
      where: { employeeId: employee.id, date, status: { not: "CANCELLED" } },
      orderBy: { startsAt: "asc" }
    });
    const request = await tx.timeAdjustmentRequest.create({
      data: {
        employeeId: employee.id,
        userId: user.id!,
        shiftId: shift?.id,
        date,
        requestedAction: "ADD_EVENT",
        eventType,
        requestedOccurredAt,
        comment
      }
    });
    await writeAuditLog({
      entityType: "TIME_ADJUSTMENT_REQUEST",
      entityId: request.id,
      action: "time_adjustment_request.created",
      userId: user.id!,
      after: request
    }, tx);
    return request;
  });
}

export async function approveAdjustmentRequest(id: string, actorUserId: string, comment?: string) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.timeAdjustmentRequest.findUnique({
      where: { id },
      include: { employee: true, shift: true }
    });
    if (!request) throw new TimeClockServiceError("Заявка не найдена");
    if (!request.eventType || !request.requestedOccurredAt) throw new TimeClockServiceError("Заявка не содержит время отметки");
    if (request.status !== "PENDING") throw new TimeClockServiceError("Заявка уже обработана");
    const locationId = request.shift?.locationId ?? request.employee.defaultLocationId;
    if (!locationId) throw new TimeClockServiceError("Для ручной корректировки нужно назначить сотруднику точку или смену");

    const event = await tx.timeEvent.create({
      data: {
        employeeId: request.employeeId,
        userId: request.userId,
        locationId,
        shiftId: request.shiftId,
        type: request.eventType,
        occurredAt: request.requestedOccurredAt,
        source: "MANUAL",
        status: "MANUAL",
        riskFlags: ["manual_adjustment"],
        reviewComment: comment,
        reviewedById: actorUserId,
        reviewedAt: new Date()
      }
    });
    const updated = await tx.timeAdjustmentRequest.update({
      where: { id },
      data: { status: "APPROVED", reviewedById: actorUserId, reviewedAt: new Date(), reviewComment: comment }
    });
    await recalculateTimesheetDay(request.employeeId, request.date, tx);
    await writeAuditLog({
      entityType: "TIME_ADJUSTMENT_REQUEST",
      entityId: id,
      action: "time_adjustment_request.approved",
      userId: actorUserId,
      after: { request: updated, event }
    }, tx);
    return updated;
  });
}

export async function rejectAdjustmentRequest(id: string, actorUserId: string, comment: string) {
  return prisma.$transaction(async (tx) => {
    const before = await tx.timeAdjustmentRequest.findUnique({ where: { id } });
    if (!before) throw new TimeClockServiceError("Заявка не найдена");
    const request = await tx.timeAdjustmentRequest.update({
      where: { id },
      data: { status: "REJECTED", reviewedById: actorUserId, reviewedAt: new Date(), reviewComment: comment }
    });
    await writeAuditLog({
      entityType: "TIME_ADJUSTMENT_REQUEST",
      entityId: id,
      action: "time_adjustment_request.rejected",
      userId: actorUserId,
      before,
      after: request
    }, tx);
    return request;
  });
}

function statusMessage(status: TimeEventStatus, riskFlags: string[]) {
  if (status === "ACCEPTED") return "Отметка принята.";
  if (status === "REJECTED") {
    if (riskFlags.includes("qr_token_expired")) return "QR-код устарел. Отсканируйте новый код на экране точки.";
    if (riskFlags.includes("invalid_event_sequence")) return "Сначала нужно отметить приход.";
    if (riskFlags.includes("duplicate_event")) return "Такая отметка уже есть за текущий день.";
    return "Отметка отклонена. Обратитесь к руководителю.";
  }
  return "Отметка отправлена на проверку руководителю.";
}

function isUniqueConstraint(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}
