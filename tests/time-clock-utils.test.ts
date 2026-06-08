import { describe, expect, it } from "vitest";
import { markTimeSchema } from "@/modules/time-clock/schemas";
import { getDateKey, getDistanceMeters, nextSuggestedAction, publicTimeEventType } from "@/modules/time-clock/utils";

describe("time clock utilities", () => {
  it("calculates distance in meters with haversine formula", () => {
    const distance = getDistanceMeters(55.751244, 37.618423, 55.751244, 37.619423);
    expect(distance).toBeGreaterThan(50);
    expect(distance).toBeLessThan(80);
  });

  it("returns the next allowed check action", () => {
    expect(nextSuggestedAction([])).toBe("check_in");
    expect(nextSuggestedAction([{ type: "CHECK_IN" }])).toBe("check_out");
    expect(nextSuggestedAction([{ type: "CHECK_IN" }, { type: "CHECK_OUT" }])).toBe("none");
  });

  it("formats date keys in requested timezone", () => {
    expect(getDateKey(new Date("2026-06-08T21:30:00.000Z"), "Europe/Moscow")).toBe("2026-06-09");
  });

  it("maps internal event types to public API values", () => {
    expect(publicTimeEventType("CHECK_IN")).toBe("check_in");
    expect(publicTimeEventType("CHECK_OUT")).toBe("check_out");
  });

  it("allows QR marks without browser geolocation", () => {
    const parsed = markTimeSchema.safeParse({
      token: "xCl03lUsbTqJn5A3ePEjpLV15iMbFmCMh3aCtPngAuA",
      type: "check_in",
      clientTime: "2026-06-08T10:00:00.000Z",
      deviceId: "device-id-for-mobile-test"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects partial geolocation payloads", () => {
    const parsed = markTimeSchema.safeParse({
      token: "xCl03lUsbTqJn5A3ePEjpLV15iMbFmCMh3aCtPngAuA",
      type: "check_in",
      latitude: 55.751244,
      deviceId: "device-id-for-mobile-test"
    });

    expect(parsed.success).toBe(false);
  });
});
