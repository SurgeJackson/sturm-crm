import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { paginatedQuery, sortFromParam } from "@/modules/crm/list-query";
import { pageFromParam } from "@/modules/crm/pagination";

export type SecurityLogSearchParams = {
  from?: string;
  to?: string;
  userId?: string;
  action?: string;
  severity?: string;
  page?: string;
  sort?: string;
};

const PAGE_SIZE = 30;

export const securityActionLabels: Record<string, string> = {
  LOGIN: "Вход",
  LOGOUT: "Выход",
  FAILED_LOGIN: "Неудачный вход",
  PASSWORD_CHANGED: "Пароль изменен",
  ROLE_CHANGED: "Роль изменена",
  USER_DEACTIVATED: "Пользователь деактивирован",
  USER_ACTIVATED: "Пользователь активирован",
  EXPORT_STARTED: "Экспорт начат",
  EXPORT_COMPLETED: "Экспорт завершен",
  EXPORT_DENIED: "Экспорт запрещен",
  FILE_DOWNLOADED: "Файл скачан",
  FILE_DOWNLOAD_DENIED: "Скачивание запрещено",
  MASS_VIEW_DETECTED: "Массовая активность",
  MASS_EXPORT_ATTEMPT: "Попытка массового экспорта",
  ARCHIVE_ENTITY: "Архивирование",
  RESTORE_ENTITY: "Восстановление",
  HARD_DELETE_ATTEMPT: "Попытка hard delete",
  PERMISSION_DENIED: "Отказ доступа",
  SECURITY_CHECK_RUN: "Проверка безопасности",
  SENSITIVE_FIELD_VIEWED: "Просмотр чувствительных полей",
  CONFIDENTIALITY_ACCEPTED: "Подтверждение конфиденциальности",
  ENTITY_VIEWED: "Просмотр карточки",
  USER_HANDOVER_COMPLETED: "Передача дел",
  EMAIL_SENT: "Email отправлен",
  EMAIL_FAILED: "Email не отправлен",
  EMAIL_VERIFICATION_SENT: "Подтверждение email отправлено",
  EMAIL_VERIFIED: "Email подтвержден",
  PASSWORD_RESET_REQUESTED: "Сброс пароля запрошен",
  PASSWORD_RESET_COMPLETED: "Сброс пароля выполнен",
  USER_INVITED: "Пользователь приглашен",
  VIEW_DESIGNER_BONUS_DETAIL: "Просмотр бонусов дизайнера"
};

export const securitySeverityLabels = {
  INFO: "Инфо",
  WARNING: "Предупреждение",
  CRITICAL: "Критично"
} as const;

function dateFromParam(value?: string, endOfDay = false) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) date.setHours(23, 59, 59, 999);
  return date;
}

export async function getSecurityDashboard(params: SecurityLogSearchParams) {
  const page = pageFromParam(params.page);
  const filters: Prisma.SecurityLogWhereInput[] = [];
  const from = dateFromParam(params.from);
  const to = dateFromParam(params.to, true);

  if (from || to) filters.push({ createdAt: { gte: from ?? undefined, lte: to ?? undefined } });
  if (params.userId) filters.push({ userId: params.userId });
  if (params.action) filters.push({ action: params.action });
  if (params.severity === "INFO" || params.severity === "WARNING" || params.severity === "CRITICAL") filters.push({ severity: params.severity });

  const where: Prisma.SecurityLogWhereInput = filters.length ? { AND: filters } : {};
  const orderBy = sortFromParam<Prisma.SecurityLogOrderByWithRelationInput>(params.sort, {
    createdAt: { createdAt: "desc" },
    severity: { severity: "desc" }
  }, { createdAt: "desc" });

  const [summary, actions, users, pageData] = await Promise.all([
    prisma.securityLog.groupBy({
      by: ["action"],
      where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      _count: { _all: true },
      orderBy: { _count: { action: "desc" } },
      take: 8
    }),
    prisma.securityLog.findMany({
      distinct: ["action"],
      orderBy: { action: "asc" },
      select: { action: true }
    }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, email: true } }),
    paginatedQuery({
      page,
      pageSize: PAGE_SIZE,
      findRows: () => prisma.securityLog.findMany({
        where,
        orderBy,
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { user: { select: { id: true, name: true, email: true } } }
      }),
      countRows: () => prisma.securityLog.count({ where })
    })
  ]);

  return { summary, actions: actions.map((item) => item.action), users, logs: pageData };
}
