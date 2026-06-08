import type { PrismaClient } from "../generated/prisma/client";
import { seedUsers } from "./seed-fixtures";

export async function seedTimeClock(prisma: PrismaClient, now: Date) {
  const date = formatDate(now);
  const location = await prisma.workLocation.upsert({
    where: { code: "sturm-showroom-1" },
    update: {
      name: "STURM Showroom 1",
      address: "Москва, STURM Showroom",
      latitude: 55.751244,
      longitude: 37.618423,
      allowedRadiusMeters: 100,
      maxAllowedAccuracyMeters: 150,
      timezone: "Europe/Moscow",
      isActive: true
    },
    create: {
      id: "seed_work_location_showroom_1",
      name: "STURM Showroom 1",
      code: "sturm-showroom-1",
      address: "Москва, STURM Showroom",
      latitude: 55.751244,
      longitude: 37.618423,
      allowedRadiusMeters: 100,
      maxAllowedAccuracyMeters: 150,
      timezone: "Europe/Moscow",
      isActive: true
    }
  });

  for (const user of seedUsers) {
    const profile = await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: {
        employmentStatus: "ACTIVE",
        defaultLocationId: location.id,
        trustedDeviceLimit: 2
      },
      create: {
        id: `seed_employee_${user.id}`,
        userId: user.id,
        defaultLocationId: location.id,
        position: rolePosition(user.role),
        employmentStatus: "ACTIVE",
        trustedDeviceLimit: 2
      }
    });

    const startsAt = new Date(`${date}T09:00:00.000`);
    const endsAt = new Date(`${date}T18:00:00.000`);
    const shift = await prisma.workShift.upsert({
      where: { id: `seed_shift_${user.id}_${date}` },
      update: {
        employeeId: profile.id,
        locationId: location.id,
        date,
        startsAt,
        endsAt,
        breakMinutes: 60,
        status: "PLANNED"
      },
      create: {
        id: `seed_shift_${user.id}_${date}`,
        employeeId: profile.id,
        locationId: location.id,
        date,
        startsAt,
        endsAt,
        breakMinutes: 60,
        status: "PLANNED",
        createdById: "seed_owner"
      }
    });

    await prisma.timesheetDay.upsert({
      where: { employeeId_date: { employeeId: profile.id, date } },
      update: {
        userId: user.id,
        shiftId: shift.id,
        locationId: location.id,
        plannedStart: startsAt,
        plannedEnd: endsAt,
        status: "SCHEDULED"
      },
      create: {
        employeeId: profile.id,
        userId: user.id,
        date,
        shiftId: shift.id,
        locationId: location.id,
        plannedStart: startsAt,
        plannedEnd: endsAt,
        status: "SCHEDULED"
      }
    });
  }
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rolePosition(role: string) {
  if (role === "OWNER") return "Руководитель";
  if (role === "SALES_LEAD") return "Старший менеджер";
  if (role === "STORE_MANAGER") return "Менеджер магазина";
  if (role === "PROJECT_MANAGER") return "Проектный менеджер";
  return "Администратор";
}
