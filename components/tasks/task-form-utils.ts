export function dateTimeValue(date?: Date | string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 16);
}

export function defaultDueAt(recordType: string) {
  const date = new Date();
  date.setHours(date.getHours() + (recordType === "TOUCH" ? 0 : 2));
  return date.toISOString().slice(0, 16);
}
