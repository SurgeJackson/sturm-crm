import type { Prisma } from "@/generated/prisma/client";
import { accessWhereBundle, ownerRecordWhere } from "@/modules/crm/access-where";
import { daysAgo, daysFromNow, dayRange } from "@/modules/crm/date-ranges";
import type { PermissionUser } from "@/permissions";

export function getDashboardContext(user: PermissionUser, now = new Date()) {
  const sevenDaysAgo = daysAgo(7, now);
  const sixtyDaysAgo = daysAgo(60, now);
  const today = dayRange(now);
  const weekEnd = daysFromNow(7, now);
  weekEnd.setHours(23, 59, 59, 999);

  return {
    user,
    now,
    sevenDaysAgo,
    sixtyDaysAgo,
    today,
    weekEnd,
    access: accessWhereBundle(user),
    myAccess: ownerRecordWhere(user),
    thinkingThreshold: daysAgo(7, now),
    activeDealFilter: { archivedAt: null, stage: { notIn: ["LOST", "COMPLETED"] } } satisfies Prisma.DealWhereInput,
    activeProposalFilter: { archivedAt: null, status: { notIn: ["ACCEPTED", "DECLINED", "ARCHIVED"] } } satisfies Prisma.CommercialProposalWhereInput
  };
}

export type DashboardContext = ReturnType<typeof getDashboardContext>;
