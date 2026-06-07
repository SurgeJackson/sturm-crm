import { describe, expect, it } from "vitest";
import type { CommercialProposal } from "../generated/prisma/client";
import { formatProposalNumber } from "../modules/proposals/services/numbering";
import { proposalVersionDocument } from "../modules/proposals/services/versioning";

function proposal(overrides: Partial<CommercialProposal> = {}): CommercialProposal {
  const now = new Date("2026-01-10T12:00:00.000Z");
  return {
    id: "proposal-1",
    proposalNumber: "КП-2026-0001",
    dealId: "deal-1",
    clientId: "client-1",
    objectId: "object-1",
    designerId: "designer-1",
    responsibleId: "manager-1",
    version: 2,
    parentProposalId: null,
    amount: 120000,
    discountPercent: 5,
    discountAmount: 6000,
    status: "SENT",
    recipientType: "CLIENT",
    recipientName: "Иван Иванов",
    recipientContact: "ivan@example.com",
    approvalRequiredFrom: "owner",
    sentAt: now,
    nextTouchAt: new Date("2026-01-15T09:00:00.000Z"),
    fileUrl: "/uploads/proposal.pdf",
    fileName: "proposal.pdf",
    fileSize: 12345,
    fileMimeType: "application/pdf",
    uploadedById: "manager-1",
    uploadedAt: now,
    declineReason: null,
    declineComment: null,
    comment: "Комментарий",
    createdById: "manager-1",
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    notes: "Заметки",
    ...overrides
  };
}

describe("proposalVersionDocument", () => {
  it("formats proposal numbers with a year prefix and padded sequence", () => {
    expect(formatProposalNumber(2026, 9)).toBe("КП-2026-0009");
    expect(formatProposalNumber(2026, 120)).toBe("КП-2026-0120");
  });

  it("creates a draft version while preserving commercial context", () => {
    const document = proposalVersionDocument(
      proposal({ parentProposalId: "root-proposal", version: 3 }),
      "КП-2026-0008",
      4,
      "root-proposal",
      "creator-2"
    );

    expect(document).toMatchObject({
      proposalNumber: "КП-2026-0008",
      dealId: "deal-1",
      clientId: "client-1",
      objectId: "object-1",
      designerId: "designer-1",
      responsibleId: "manager-1",
      version: 4,
      parentProposalId: "root-proposal",
      amount: 120000,
      discountPercent: 5,
      discountAmount: 6000,
      status: "DRAFT",
      recipientType: "CLIENT",
      recipientName: "Иван Иванов",
      fileUrl: "/uploads/proposal.pdf",
      createdById: "creator-2",
      notes: "Заметки"
    });
    expect(document.sentAt).toBeNull();
    expect(document.declineReason).toBeNull();
    expect(document.declineComment).toBeNull();
  });
});
