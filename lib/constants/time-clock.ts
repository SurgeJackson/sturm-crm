import type {
  EmployeeDeviceStatus,
  EmployeeEmploymentStatus,
  LocationDisplayDeviceStatus,
  LocationDisplaySessionStatus,
  QrTokenStatus,
  TimeAdjustmentAction,
  TimeAdjustmentStatus,
  TimeEventStatus,
  TimeEventType,
  TimesheetDayStatus,
  WorkShiftStatus
} from "@/generated/prisma/client";

export const employeeEmploymentStatusLabels: Record<EmployeeEmploymentStatus, string> = {
  ACTIVE: "Активен",
  INACTIVE: "Неактивен",
  DISMISSED: "Уволен"
};

export const workShiftStatusLabels: Record<WorkShiftStatus, string> = {
  PLANNED: "Запланирована",
  COMPLETED: "Завершена",
  MISSED: "Пропущена",
  CANCELLED: "Отменена",
  PENDING_REVIEW: "На проверке"
};

export const employeeDeviceStatusLabels: Record<EmployeeDeviceStatus, string> = {
  TRUSTED: "Подтверждено",
  PENDING: "Ожидает подтверждения",
  BLOCKED: "Заблокировано"
};

export const locationDisplayDeviceStatusLabels: Record<LocationDisplayDeviceStatus, string> = {
  ACTIVE: "Активно",
  PENDING: "Ожидает",
  BLOCKED: "Заблокировано",
  REVOKED: "Отозвано"
};

export const locationDisplaySessionStatusLabels: Record<LocationDisplaySessionStatus, string> = {
  ACTIVE: "Активна",
  REVOKED: "Отозвана",
  EXPIRED: "Истекла"
};

export const qrTokenStatusLabels: Record<QrTokenStatus, string> = {
  ACTIVE: "Активен",
  USED: "Использован",
  EXPIRED: "Истек",
  REVOKED: "Отозван"
};

export const timeEventTypeLabels: Record<TimeEventType, string> = {
  CHECK_IN: "Приход",
  CHECK_OUT: "Уход",
  BREAK_START: "Начало перерыва",
  BREAK_END: "Окончание перерыва"
};

export const timeEventStatusLabels: Record<TimeEventStatus, string> = {
  ACCEPTED: "Принята",
  PENDING_REVIEW: "На проверке",
  REJECTED: "Отклонена",
  MANUAL: "Вручную"
};

export const timesheetDayStatusLabels: Record<TimesheetDayStatus, string> = {
  SCHEDULED: "Запланировано",
  OK: "Без нарушений",
  LATE: "Опоздание",
  EARLY_LEAVE: "Ранний уход",
  LATE_AND_EARLY_LEAVE: "Опоздание и ранний уход",
  MISSING_CHECK_IN: "Нет прихода",
  MISSING_CHECK_OUT: "Нет ухода",
  ABSENT: "Отсутствие",
  PENDING_REVIEW: "На проверке",
  MANUAL_ADJUSTED: "Корректировка"
};

export const timeAdjustmentActionLabels: Record<TimeAdjustmentAction, string> = {
  ADD_EVENT: "Добавить отметку",
  EDIT_EVENT: "Изменить отметку",
  DELETE_EVENT: "Удалить отметку"
};

export const timeAdjustmentStatusLabels: Record<TimeAdjustmentStatus, string> = {
  PENDING: "Ожидает",
  APPROVED: "Подтверждена",
  REJECTED: "Отклонена"
};

export const timeRiskFlagLabels: Record<string, string> = {
  untrusted_employee_device: "Устройство сотрудника не подтверждено",
  device_used_by_multiple_employees: "Устройство использовалось несколькими сотрудниками",
  qr_token_expired: "QR-код устарел",
  qr_token_invalid: "QR-код недействителен",
  outside_geofence: "Сотрудник вне разрешенной геозоны",
  low_geo_accuracy: "Низкая точность геолокации",
  no_shift_found: "На дату нет смены",
  shift_location_mismatch: "Смена назначена на другую точку",
  duplicate_event: "Повторная отметка",
  invalid_event_sequence: "Неверная последовательность отметок",
  display_device_untrusted: "QR-экран не подтвержден",
  display_session_suspicious: "Подозрительная display-сессия",
  new_ip_for_display_device: "Новый IP для QR-экрана",
  multiple_display_sessions: "Несколько активных display-сессий",
  manual_adjustment: "Ручная корректировка"
};
