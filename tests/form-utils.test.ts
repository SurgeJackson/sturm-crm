import { describe, expect, it } from "vitest";
import {
  compactString,
  optionalDate,
  optionalDateTime,
  optionalInteger,
  optionalNumber,
  splitTextareaLines,
  toAuditValue
} from "../modules/crm/form-utils";

describe("form-utils", () => {
  it("compacts empty strings to undefined", () => {
    expect(compactString("  test  ")).toBe("test");
    expect(compactString("   ")).toBeUndefined();
    expect(compactString(null)).toBeUndefined();
  });

  it("parses optional date values", () => {
    expect(optionalDate()).toBeNull();
    expect(optionalDate("bad-value")).toBeNull();
    expect(optionalDate("2026-06-05")?.toISOString()).toBe("2026-06-05T00:00:00.000Z");
  });

  it("parses optional date-time values", () => {
    expect(optionalDateTime()).toBeNull();
    expect(optionalDateTime("bad-value")).toBeNull();
    expect(optionalDateTime("2026-06-05T10:30:00.000Z")?.toISOString()).toBe("2026-06-05T10:30:00.000Z");
  });

  it("parses optional numeric values", () => {
    expect(optionalNumber()).toBeNull();
    expect(optionalNumber("12,5")).toBe(12.5);
    expect(optionalNumber("bad")).toBeNull();
    expect(optionalInteger("08")).toBe(8);
    expect(optionalInteger("bad")).toBeNull();
  });

  it("splits textarea lines", () => {
    expect(splitTextareaLines(" one \n\n two \r\n three ")).toEqual(["one", "two", "three"]);
    expect(splitTextareaLines()).toEqual([]);
  });

  it("serializes dates for audit json", () => {
    expect(toAuditValue({ at: new Date("2026-06-05T00:00:00.000Z") })).toEqual({
      at: "2026-06-05T00:00:00.000Z"
    });
  });
});
