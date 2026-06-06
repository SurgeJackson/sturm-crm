import { describe, expect, it } from "vitest";
import type { CommercialProposal, Deal } from "../generated/prisma/client";
import { fallbackReportCsv } from "../modules/reports/exporters";
import { dealStatusAuditEvents, dealTrackedFields } from "../modules/deals/service";
import { proposalStatusAuditEvents, proposalTrackedFields } from "../modules/proposals/service";

describe("deal workflow helpers", () => {
  it("detects completed and lost status audit events", () => {
    expect(dealStatusAuditEvents({ stage: "QUALIFICATION" }, { stage: "COMPLETED", lossReason: null })).toEqual([
      {
        action: "MARK_COMPLETED",
        before: { stage: "QUALIFICATION" },
        after: { stage: "COMPLETED" }
      }
    ]);

    expect(dealStatusAuditEvents({ stage: "NEGOTIATION" }, { stage: "LOST", lossReason: "PRICE" })).toEqual([
      {
        action: "MARK_LOST",
        before: { stage: "NEGOTIATION" },
        after: { stage: "LOST", lossReason: "PRICE" }
      }
    ]);
  });

  it("builds tracked fields for important deal changes", () => {
    const fields = dealTrackedFields(
      {
        responsibleId: "old",
        stage: "QUALIFICATION",
        potentialAmount: 100,
        probability: "LOW",
        nextActionText: "old step",
        nextActionAt: new Date("2026-01-01T00:00:00.000Z"),
        lossReason: null
      } as Deal,
      {
        responsibleId: "new",
        stage: "NEGOTIATION",
        potentialAmount: 200,
        probability: "HIGH",
        nextActionText: "new step",
        nextActionAt: new Date("2026-01-02T00:00:00.000Z"),
        lossReason: null
      } as Deal
    );

    expect(fields.map((field) => field[0])).toEqual([
      "responsibleId",
      "stage",
      "potentialAmount",
      "probability",
      "nextActionText",
      "nextActionAt",
      "lossReason"
    ]);
  });
});

describe("proposal workflow helpers", () => {
  it("detects accepted proposal audit event", () => {
    expect(proposalStatusAuditEvents({ status: "SENT" }, { status: "ACCEPTED" })).toEqual([
      {
        action: "ACCEPT",
        before: { status: "SENT" },
        after: { status: "ACCEPTED" }
      }
    ]);
    expect(proposalStatusAuditEvents({ status: "ACCEPTED" }, { status: "ACCEPTED" })).toEqual([]);
  });

  it("builds tracked fields for proposal changes", () => {
    const fields = proposalTrackedFields(
      {
        status: "DRAFT",
        amount: 100,
        discountPercent: null,
        discountAmount: null,
        nextTouchAt: null,
        declineReason: null
      } as CommercialProposal,
      {
        status: "SENT",
        amount: 120,
        discountPercent: 5,
        discountAmount: 6,
        nextTouchAt: new Date("2026-01-03T00:00:00.000Z"),
        declineReason: null
      } as CommercialProposal
    );

    expect(fields.map((field) => field[0])).toEqual([
      "status",
      "amount",
      "discountPercent",
      "discountAmount",
      "nextTouchAt",
      "declineReason"
    ]);
  });
});

describe("report export helpers", () => {
  it("builds fallback CSV for unknown reports", () => {
    expect(fallbackReportCsv("unknown")).toBe("\"Отчет\"\n\"unknown\"");
  });
});
