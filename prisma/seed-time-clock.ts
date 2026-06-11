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

  const shiftTemplates = [
    { name: "10-19", code: "10-19", startsAt: "10:00", endsAt: "19:00", breakMinutes: 60, color: "#2563eb", sortOrder: 10 },
    { name: "12-21", code: "12-21", startsAt: "12:00", endsAt: "21:00", breakMinutes: 60, color: "#16a34a", sortOrder: 20 },
    { name: "10-21", code: "10-21", startsAt: "10:00", endsAt: "21:00", breakMinutes: 60, color: "#7c3aed", sortOrder: 30 },
    { name: "Выезд", code: "field", startsAt: "10:00", endsAt: "19:00", breakMinutes: 60, color: "#ea580c", sortOrder: 40 }
  ];
  for (const template of shiftTemplates) {
    await prisma.shiftTemplate.upsert({
      where: { locationId_code: { locationId: location.id, code: template.code } },
      update: { ...template, isActive: true },
      create: {
        locationId: location.id,
        ...template,
        isActive: true
      }
    });
  }

  for (const user of seedUsers) {
    const profile = await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: {
        departmentId: roleDepartment(user.role),
        employmentStatus: "ACTIVE",
        defaultLocationId: location.id,
        trustedDeviceLimit: 2
      },
      create: {
        id: `seed_employee_${user.id}`,
        userId: user.id,
        departmentId: roleDepartment(user.role),
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

function roleDepartment(role: string) {
  if (role === "OWNER") return "Управление";
  if (role === "SALES_LEAD") return "Продажи";
  if (role === "STORE_MANAGER") return "Шоурум";
  if (role === "PROJECT_MANAGER") return "Проектный отдел";
  return "Администрация";
}
