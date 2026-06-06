import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { NativeSelect } from "@/components/ui/native-select";
import { ReportFilterSelect, ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { ActivityReportTable } from "@/components/reports/tables";
import { roleLabels } from "@/lib/constants";
import { taskActionTypeOptions } from "@/modules/crm/options";
import { getEmployeeActivityReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";
import { formatMoney } from "@/utils/money";

type ActivityReportPageProps = {
  searchParams: Promise<ReportSearchParams>;
};

export default async function ActivityReportPage({ searchParams }: ActivityReportPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [report, filters] = await Promise.all([
    getEmployeeActivityReport(params, user),
    getReportFilterOptions(user)
  ]);

  const totals = report.rows.reduce(
    (acc, row) => ({
      clients: acc.clients + row.clients,
      designers: acc.designers + row.designers,
      objects: acc.objects + row.objects,
      deals: acc.deals + row.deals,
      proposals: acc.proposals + row.proposals,
      proposalAmount: acc.proposalAmount + row.proposalAmount,
      tasks: acc.tasks + row.tasks,
      doneTasks: acc.doneTasks + row.doneTasks,
      overdueTasks: acc.overdueTasks + row.overdueTasks,
      touches: acc.touches + row.touches
    }),
    { clients: 0, designers: 0, objects: 0, deals: 0, proposals: 0, proposalAmount: 0, tasks: 0, doneTasks: 0, overdueTasks: 0, touches: 0 }
  );

  return (
    <div className="space-y-6">
      <ReportPageHeader title="Активность сотрудников" description="Клиенты, дизайнеры, объекты, сделки, КП, задачи и касания за период." report="activity" params={params} />

      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/activity">
        <NativeSelect name="role" defaultValue={params.role ?? ""}>
          <option value="">Все роли</option>
          {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </NativeSelect>
        <ReportFilterSelect name="actionType" value={params.actionType} placeholder="Все действия" options={taskActionTypeOptions} />
      </ReportPeriodFilter>

      <MetricsGrid metrics={[
        { title: "Клиенты", value: totals.clients },
        { title: "Дизайнеры", value: totals.designers },
        { title: "Объекты", value: totals.objects },
        { title: "Сделки", value: totals.deals },
        { title: "КП", value: totals.proposals },
        { title: "Сумма КП", value: formatMoney(totals.proposalAmount, "0 ₽") },
        { title: "Задачи", value: totals.tasks },
        { title: "Выполнено", value: totals.doneTasks, tone: "secondary" },
        { title: "Просрочено", value: totals.overdueTasks, tone: "warning" },
        { title: "Касания", value: totals.touches, tone: "secondary" }
      ]} />

      <ActivityReportTable rows={report.rows} />
    </div>
  );
}
