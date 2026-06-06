import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { MetricsGrid } from "@/components/reports/metrics";
import { MyDisciplineProblemsTable } from "@/components/reports/report-tables";
import { PageHeader } from "@/components/layout/page-header";
import { getMyReport } from "@/modules/reports/queries";

export default async function MyReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const report = await getMyReport(user);
  return (
    <div className="space-y-6">
      <PageHeader title="Мои показатели" description="Личные KPI, просрочки и CRM Discipline Score." actions={<Link className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-4 py-2 text-sm font-medium hover:bg-muted" href="/reports">К отчетам</Link>} />
      <MetricsGrid metrics={report.metrics} />
      <MyDisciplineProblemsTable problems={report.discipline.problems} />
    </div>
  );
}
