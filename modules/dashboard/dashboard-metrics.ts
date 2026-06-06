import { getActivityMetrics } from "@/modules/dashboard/activity-metrics";
import { getDashboardContext } from "@/modules/dashboard/context";
import { getDealMetrics } from "@/modules/dashboard/deal-metrics";
import { getObjectMetrics } from "@/modules/dashboard/object-metrics";
import { getProposalMetrics } from "@/modules/dashboard/proposal-metrics";
import { getRelationshipMetrics } from "@/modules/dashboard/relationship-metrics";
import type { PermissionUser } from "@/permissions";

export async function getDashboardMetrics(user: PermissionUser) {
  const ctx = getDashboardContext(user);
  const [activity, objects, proposals, deals, relationships] = await Promise.all([
    getActivityMetrics(ctx),
    getObjectMetrics(ctx),
    getProposalMetrics(ctx),
    getDealMetrics(ctx),
    getRelationshipMetrics(ctx)
  ]);

  return {
    ...relationships,
    ...activity,
    ...objects,
    ...proposals,
    ...deals
  };
}
