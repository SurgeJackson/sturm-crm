export const DAY_MS = 24 * 60 * 60 * 1000;

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function daysAgo(days: number, now = new Date()) {
  return addDays(now, -days);
}

export function daysFromNow(days: number, now = new Date()) {
  return addDays(now, days);
}

export function startOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function endOfDay(date = new Date()) {
  const next = new Date(date);
  next.setHours(23, 59, 59, 999);
  return next;
}

export function parseDateOnly(value: string | undefined, fallback: Date, end = false) {
  if (!value) return fallback;
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}`);
  return Number.isNaN(date.getTime()) ? fallback : date;
}

export function dayRange(date = new Date()) {
  return { start: startOfDay(date), end: endOfDay(date) };
}

export function dateOnlyRange(value?: string, fallback = new Date()) {
  const base = value ? new Date(`${value}T00:00:00.000`) : fallback;
  if (Number.isNaN(base.getTime())) return null;
  return dayRange(base);
}

export function weekRange(value?: string, fallback = new Date()) {
  const range = dateOnlyRange(value, fallback);
  const monday = startOfDay(range?.start ?? fallback);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);
  return { start: monday, end: endOfDay(addDays(monday, 6)) };
}

export function reportPeriodFromParams(
  params: { from?: string; to?: string },
  fallbackDays = 7,
  now = new Date()
) {
  const to = parseDateOnly(params.to, now, true);
  const from = parseDateOnly(params.from, daysAgo(fallbackDays, to));
  return { from, to };
}
