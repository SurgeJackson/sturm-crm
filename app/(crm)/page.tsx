import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { getDashboardMetrics } from "@/modules/dashboard/dashboard-metrics";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const metrics = await getDashboardMetrics(user);
  return <DashboardLayout metrics={metrics} />;
}
