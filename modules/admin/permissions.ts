import type { UserRole } from "@/generated/prisma/client";

export type PermissionKey =
  | "users.view"
  | "users.create"
  | "users.update"
  | "users.deactivate"
  | "users.changeRole"
  | "crm.clients.viewAll"
  | "crm.designers.viewAll"
  | "crm.objects.viewAll"
  | "crm.deals.viewAll"
  | "crm.proposals.viewAll"
  | "crm.tasks.viewAll"
  | "reports.viewAll"
  | "reports.export"
  | "security.viewLog"
  | "settings.manage"
  | "bonuses.view"
  | "bonuses.manage"
  | "timeClock.viewOwn"
  | "timeClock.mark"
  | "timeClock.manageLocations"
  | "timeClock.manageShifts"
  | "timeClock.reviewEvents"
  | "timeClock.manageDevices"
  | "timeClock.viewTimesheet"
  | "timeClock.manageAdjustments"
  | "schedule_planner.view"
  | "schedule_planner.edit"
  | "schedule_planner.approve"
  | "schedule_planner.manage_shift_templates"
  | "import.manage"
  | "export.allData";

export const permissionLabels: Record<PermissionKey, string> = {
  "users.view": "Пользователи: просмотр",
  "users.create": "Пользователи: создание",
  "users.update": "Пользователи: изменение",
  "users.deactivate": "Пользователи: активация и деактивация",
  "users.changeRole": "Пользователи: смена роли",
  "crm.clients.viewAll": "CRM: все клиенты",
  "crm.designers.viewAll": "CRM: все дизайнеры",
  "crm.objects.viewAll": "CRM: все объекты",
  "crm.deals.viewAll": "CRM: все сделки",
  "crm.proposals.viewAll": "CRM: все КП",
  "crm.tasks.viewAll": "CRM: все задачи",
  "reports.viewAll": "Отчеты: просмотр всех",
  "reports.export": "Отчеты: экспорт",
  "security.viewLog": "Безопасность: журнал",
  "settings.manage": "Настройки: управление",
  "bonuses.view": "Бонусы: просмотр",
  "bonuses.manage": "Бонусы: управление",
  "timeClock.viewOwn": "Учет времени: свой день",
  "timeClock.mark": "Учет времени: отметка прихода/ухода",
  "timeClock.manageLocations": "Учет времени: рабочие точки",
  "timeClock.manageShifts": "Учет времени: график смен",
  "timeClock.reviewEvents": "Учет времени: спорные отметки",
  "timeClock.manageDevices": "Учет времени: устройства",
  "timeClock.viewTimesheet": "Учет времени: табель",
  "timeClock.manageAdjustments": "Учет времени: корректировки",
  "schedule_planner.view": "Планировщик: просмотр графиков",
  "schedule_planner.edit": "Планировщик: создание и редактирование графиков",
  "schedule_planner.approve": "Планировщик: согласование графиков",
  "schedule_planner.manage_shift_templates": "Планировщик: шаблоны смен",
  "import.manage": "Импорт: управление",
  "export.allData": "Экспорт: все данные"
};

export const permissionKeys = Object.keys(permissionLabels) as PermissionKey[];
export const permissionRoles: UserRole[] = ["OWNER", "SALES_LEAD", "STORE_MANAGER", "PROJECT_MANAGER", "ADMINISTRATOR"];

const ownerPermissions = Object.fromEntries(permissionKeys.map((key) => [key, true])) as Record<PermissionKey, boolean>;

export const defaultRolePermissions: Record<UserRole, Record<PermissionKey, boolean>> = {
  OWNER: ownerPermissions,
  SALES_LEAD: {
    ...Object.fromEntries(permissionKeys.map((key) => [key, false])) as Record<PermissionKey, boolean>,
    "users.view": true,
    "crm.clients.viewAll": true,
    "crm.designers.viewAll": true,
    "crm.objects.viewAll": true,
    "crm.deals.viewAll": true,
    "crm.proposals.viewAll": true,
    "crm.tasks.viewAll": true,
    "reports.viewAll": true,
    "bonuses.view": true,
    "timeClock.viewOwn": true,
    "timeClock.mark": true,
    "timeClock.manageLocations": true,
    "timeClock.manageShifts": true,
    "timeClock.reviewEvents": true,
    "timeClock.manageDevices": true,
    "timeClock.viewTimesheet": true,
    "timeClock.manageAdjustments": true,
    "schedule_planner.view": true,
    "schedule_planner.edit": true,
    "schedule_planner.approve": true,
    "schedule_planner.manage_shift_templates": true
  },
  STORE_MANAGER: {
    ...Object.fromEntries(permissionKeys.map((key) => [key, false])) as Record<PermissionKey, boolean>,
    "timeClock.viewOwn": true,
    "timeClock.mark": true,
    "timeClock.manageShifts": true,
    "timeClock.reviewEvents": true,
    "timeClock.manageDevices": true,
    "timeClock.viewTimesheet": true,
    "timeClock.manageAdjustments": true,
    "schedule_planner.view": true,
    "schedule_planner.edit": true,
    "schedule_planner.approve": false,
    "schedule_planner.manage_shift_templates": false
  },
  PROJECT_MANAGER: {
    ...Object.fromEntries(permissionKeys.map((key) => [key, false])) as Record<PermissionKey, boolean>,
    "bonuses.view": true,
    "timeClock.viewOwn": true,
    "timeClock.mark": true,
    "timeClock.manageShifts": true,
    "timeClock.reviewEvents": true,
    "timeClock.manageDevices": true,
    "timeClock.viewTimesheet": true,
    "timeClock.manageAdjustments": true,
    "schedule_planner.view": true,
    "schedule_planner.edit": true,
    "schedule_planner.approve": false,
    "schedule_planner.manage_shift_templates": false
  },
  ADMINISTRATOR: {
    ...Object.fromEntries(permissionKeys.map((key) => [key, false])) as Record<PermissionKey, boolean>,
    "users.view": true,
    "timeClock.viewOwn": true,
    "timeClock.mark": true,
    "timeClock.manageLocations": true,
    "timeClock.manageShifts": true,
    "timeClock.reviewEvents": true,
    "timeClock.manageDevices": true,
    "timeClock.manageAdjustments": true,
    "schedule_planner.view": true,
    "schedule_planner.edit": true,
    "schedule_planner.approve": false,
    "schedule_planner.manage_shift_templates": true
  }
};

export function defaultPermissionAllowed(role: UserRole, key: PermissionKey) {
  return defaultRolePermissions[role][key] ?? false;
}
