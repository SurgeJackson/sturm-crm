import crypto from "crypto";
import type { TimeEventType } from "@/generated/prisma/client";

export const DISPLAY_SESSION_COOKIE = "sturm_display_session";
export const QR_TOKEN_TTL_SECONDS = 45;
export const DISPLAY_SESSION_TTL_DAYS = 30;
export const SETUP_TOKEN_TTL_MINUTES = 10;
export const LATE_GRACE_MINUTES = 5;
export const EARLY_LEAVE_GRACE_MINUTES = 5;

export function createDeviceId() {
  return crypto.randomBytes(24).toString("base64url");
}

export function fingerprintHash(deviceId: string, userAgent?: string | null) {
  return crypto.createHash("sha256").update(`${deviceId}:${userAgent ?? ""}`).digest("hex");
}

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * 60_000);
}

export function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60_000);
}

export function getDateKey(date: Date, timezone = "Europe/Moscow") {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

export function combineDateAndTime(date: string, time: string) {
  return new Date(`${date}T${time}:00.000`);
}

export function minutesBetween(start?: Date | null, end?: Date | null) {
  if (!start || !end || end <= start) return 0;
  return Math.round((end.getTime() - start.getTime()) / 60_000);
}

export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function nextSuggestedAction(events: { type: TimeEventType }[]) {
  const accepted = events.filter((event) => event.type === "CHECK_IN" || event.type === "CHECK_OUT");
  const last = accepted.at(-1);
  if (!last) return "check_in" as const;
  if (last.type === "CHECK_IN") return "check_out" as const;
  return "none" as const;
}

export function normalizeTimeEventType(value: string) {
  if (value === "check_in" || value === "CHECK_IN") return "CHECK_IN" as const;
  if (value === "check_out" || value === "CHECK_OUT") return "CHECK_OUT" as const;
  if (value === "break_start" || value === "BREAK_START") return "BREAK_START" as const;
  if (value === "break_end" || value === "BREAK_END") return "BREAK_END" as const;
  return null;
}

export function publicTimeEventType(type: TimeEventType) {
  if (type === "CHECK_IN") return "check_in";
  if (type === "CHECK_OUT") return "check_out";
  if (type === "BREAK_START") return "break_start";
  return "break_end";
}
