import type { Prisma } from "@/generated/prisma/client";

export const userNameSelect = {
  id: true,
  name: true
} satisfies Prisma.UserSelect;

export const userSummarySelect = {
  id: true,
  name: true,
  email: true
} satisfies Prisma.UserSelect;

export const clientNameSelect = {
  id: true,
  name: true
} satisfies Prisma.ClientSelect;

export const designerNameSelect = {
  id: true,
  name: true,
  studio: true
} satisfies Prisma.DesignerSelect;

export const objectTitleSelect = {
  id: true,
  title: true
} satisfies Prisma.ProjectObjectSelect;

export const dealTitleSelect = {
  id: true,
  title: true
} satisfies Prisma.DealSelect;

export const proposalNumberSelect = {
  id: true,
  proposalNumber: true
} satisfies Prisma.CommercialProposalSelect;
