import { prisma } from "@/lib/prisma";

export async function generateProposalNumber(now = new Date()) {
  const year = now.getFullYear();
  const prefix = `КП-${year}-`;
  const latest = await prisma.commercialProposal.findFirst({
    where: { proposalNumber: { startsWith: prefix } },
    orderBy: { proposalNumber: "desc" },
    select: { proposalNumber: true }
  });
  const nextNumber = latest ? Number(latest.proposalNumber.replace(prefix, "")) + 1 : 1;
  return `${prefix}${String(nextNumber).padStart(4, "0")}`;
}
