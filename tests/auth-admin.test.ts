import { describe, expect, it } from "vitest";
import { hashToken } from "../lib/token";
import { defaultPermissionAllowed, permissionKeys, permissionRoles } from "../modules/admin/permissions";
import { passwordSchema } from "../modules/auth/password";
import { normalizeEmail } from "../modules/auth/service";
import { userStatus } from "../modules/users/admin-queries";

describe("Stage 9B auth helpers", () => {
  it("normalizes emails before auth flows", () => {
    expect(normalizeEmail(" Owner@Sturm.Local ")).toBe("owner@sturm.local");
  });

  it("requires strong enough passwords", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("onlyletters").success).toBe(false);
    expect(passwordSchema.safeParse("Sturm12345").success).toBe(true);
  });

  it("hashes tokens deterministically without keeping raw values", () => {
    const token = "stage-9b-token";
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(token);
  });
});

describe("Stage 9B admin permissions", () => {
  it("keeps owner allowed for every declared permission", () => {
    expect(permissionKeys.every((key) => defaultPermissionAllowed("OWNER", key))).toBe(true);
  });

  it("keeps all app roles covered by the permissions matrix", () => {
    expect(permissionRoles).toEqual(["OWNER", "SALES_LEAD", "STORE_MANAGER", "PROJECT_MANAGER", "ADMINISTRATOR"]);
  });
});

describe("Stage 9B user status", () => {
  it("prioritizes deactivation, lock and onboarding states", () => {
    const now = new Date();

    expect(userStatus({ isActive: false, emailVerifiedAt: null, deactivatedAt: now })).toBe("DEACTIVATED");
    expect(userStatus({ isActive: true, emailVerifiedAt: now, lockedUntil: new Date(now.getTime() + 60_000) })).toBe("LOCKED");
    expect(userStatus({ isActive: true, emailVerifiedAt: null })).toBe("EMAIL_PENDING");
    expect(userStatus({ isActive: false, emailVerifiedAt: now })).toBe("PENDING_ACTIVATION");
    expect(userStatus({ isActive: true, emailVerifiedAt: now })).toBe("ACTIVE");
  });
});
