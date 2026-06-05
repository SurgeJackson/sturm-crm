import { describe, expect, it } from "vitest";
import { compactString, optionalDate, toAuditValue } from "../modules/crm/form-utils";

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

  it("serializes dates for audit json", () => {
    expect(toAuditValue({ at: new Date("2026-06-05T00:00:00.000Z") })).toEqual({
      at: "2026-06-05T00:00:00.000Z"
    });
  });
});
