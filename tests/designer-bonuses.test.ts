import { describe, expect, it } from "vitest";
import {
  adjustmentBalanceAmount,
  agreementAppliesToDeal,
  bonusAmountFromPayment,
  canAutoAccrueFromAgreement
} from "../modules/designer-bonuses/service";
import { parseBonusAgreementForm } from "../modules/designer-bonuses/form";

describe("designer bonus service helpers", () => {
  it("calculates percent bonuses from confirmed payment amounts", () => {
    expect(bonusAmountFromPayment(123456.78, 5)).toEqual({
      baseAmount: 123456.78,
      bonusAmount: 6172.84
    });
  });

  it("turns refunds into negative bonus accruals", () => {
    expect(bonusAmountFromPayment(100000, 7.5, true)).toEqual({
      baseAmount: -100000,
      bonusAmount: -7500
    });
  });

  it("applies agreements to all deals or selected deals only", () => {
    expect(agreementAppliesToDeal({ appliesTo: "ALL_DEALS", specificDealIds: [] }, "deal-a")).toBe(true);
    expect(agreementAppliesToDeal({ appliesTo: "SPECIFIC_DEALS", specificDealIds: ["deal-a"] }, "deal-a")).toBe(true);
    expect(agreementAppliesToDeal({ appliesTo: "SPECIFIC_DEALS", specificDealIds: ["deal-a"] }, "deal-b")).toBe(false);
    expect(agreementAppliesToDeal({ appliesTo: "MANUAL_SELECTION", specificDealIds: ["deal-a"] }, "deal-a")).toBe(false);
  });

  it("allows automatic accrual only for percent agreements based on payment amounts", () => {
    expect(canAutoAccrueFromAgreement({ agreementType: "STANDARD_PERCENT", calculationBase: "PAYMENT_AMOUNT", bonusPercent: 5 })).toBe(true);
    expect(canAutoAccrueFromAgreement({ agreementType: "INDIVIDUAL_PERCENT", calculationBase: "PAYMENT_AMOUNT", bonusPercent: 2.5 })).toBe(true);
    expect(canAutoAccrueFromAgreement({ agreementType: "FIXED_AMOUNT", calculationBase: "PAYMENT_AMOUNT", bonusPercent: 5 })).toBe(false);
    expect(canAutoAccrueFromAgreement({ agreementType: "STANDARD_PERCENT", calculationBase: "DEAL_AMOUNT", bonusPercent: 5 })).toBe(false);
    expect(canAutoAccrueFromAgreement({ agreementType: "STANDARD_PERCENT", calculationBase: "PAYMENT_AMOUNT", bonusPercent: 0 })).toBe(false);
  });

  it("normalizes adjustment signs for balance calculation", () => {
    expect(adjustmentBalanceAmount(1000, "ADDITIONAL_ACCRUAL")).toBe(1000);
    expect(adjustmentBalanceAmount(1000, "CORRECTION_PLUS")).toBe(1000);
    expect(adjustmentBalanceAmount(1000, "WRITE_OFF")).toBe(-1000);
    expect(adjustmentBalanceAmount(1000, "CORRECTION_MINUS")).toBe(-1000);
  });

  it("accepts only supported MVP agreement calculation modes", () => {
    const formData = new FormData();
    formData.set("designerId", "designer-a");
    formData.set("agreementType", "FIXED_AMOUNT");
    formData.set("bonusPercent", "5");
    formData.set("calculationBase", "DEAL_AMOUNT");
    formData.set("appliesTo", "SPECIFIC_OBJECTS");
    formData.set("validFrom", "2026-01-01");
    formData.set("status", "ACTIVE");

    const parsed = parseBonusAgreementForm(formData);

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.agreementType).toBeDefined();
      expect(parsed.error.flatten().fieldErrors.calculationBase).toBeDefined();
      expect(parsed.error.flatten().fieldErrors.appliesTo).toBeDefined();
    }
  });

  it("parses selected deal ids from checkbox values", () => {
    const formData = new FormData();
    formData.set("designerId", "designer-a");
    formData.set("agreementType", "STANDARD_PERCENT");
    formData.set("bonusPercent", "5");
    formData.set("calculationBase", "PAYMENT_AMOUNT");
    formData.set("appliesTo", "SPECIFIC_DEALS");
    formData.append("specificDealIds", "deal-a");
    formData.append("specificDealIds", "deal-b");
    formData.set("validFrom", "2026-01-01");
    formData.set("status", "ACTIVE");

    const parsed = parseBonusAgreementForm(formData);

    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.specificDealIds).toEqual(["deal-a", "deal-b"]);
  });
});
