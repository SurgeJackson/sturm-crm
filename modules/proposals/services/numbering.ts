import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type ProposalNumberClient = Pick<Prisma.TransactionClient, "$queryRaw">;

type ProposalCounterRow = {
  nextNumber: number | bigint;
};

export function formatProposalNumber(year: number, sequence: number) {
  return `КП-${year}-${String(sequence).padStart(4, "0")}`;
}

export async function reserveProposalNumber(client: ProposalNumberClient = prisma, now = new Date()) {
  const year = now.getFullYear();
  const yearPattern = `^КП-${year}-[0-9]+$`;
  const sequencePattern = "^КП-[0-9]{4}-([0-9]+)$";
  const rows = await client.$queryRaw<ProposalCounterRow[]>`
    WITH latest AS (
      SELECT COALESCE(MAX(CAST(substring("proposalNumber" from ${sequencePattern}) AS INTEGER)), 0) AS "lastNumber"
      FROM "CommercialProposal"
      WHERE "proposalNumber" ~ ${yearPattern}
    ),
    allocated AS (
      INSERT INTO "ProposalCounter" ("year", "nextNumber", "createdAt", "updatedAt")
      SELECT ${year}, "lastNumber" + 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      FROM latest
      ON CONFLICT ("year") DO UPDATE
        SET "nextNumber" = GREATEST("ProposalCounter"."nextNumber" + 1, EXCLUDED."nextNumber"),
            "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "nextNumber"
    )
    SELECT "nextNumber" FROM allocated
  `;
  const nextNumber = rows[0]?.nextNumber;
  if (!nextNumber) throw new Error("Не удалось выделить номер КП");

  return formatProposalNumber(year, Number(nextNumber) - 1);
}

export const generateProposalNumber = reserveProposalNumber;
