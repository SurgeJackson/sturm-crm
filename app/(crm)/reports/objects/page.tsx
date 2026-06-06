import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BreakdownCard } from "@/components/reports/cards";
import { ReportFilterSelect, ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { objectStageLabels, objectStatusLabels, objectTypeLabels } from "@/lib/constants";
import { objectStageOptions, objectStatusOptions, objectTypeOptions } from "@/modules/crm/options";
import { getObjectsReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function ObjectsReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getObjectsReport(params, user), getReportFilterOptions(user)]);
  return (
    <div className="space-y-6">
      <ReportPageHeader title="Отчет по объектам" description="Стадии, типы, участники и объекты без движения." report="objects" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/objects">
        <ReportFilterSelect name="stage" value={params.stage} placeholder="Все стадии" options={objectStageOptions} />
        <ReportFilterSelect name="status" value={params.status} placeholder="Все статусы" options={objectStatusOptions} />
        <ReportFilterSelect name="type" value={params.type} placeholder="Все типы" options={objectTypeOptions} />
      </ReportPeriodFilter>
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownCard title="Объекты по стадиям" data={Object.fromEntries(Object.entries(report.byStage).map(([key, value]) => [objectStageLabels[key as keyof typeof objectStageLabels] ?? key, value]))} />
        <BreakdownCard title="Объекты по типам" data={Object.fromEntries(Object.entries(report.byType).map(([key, value]) => [objectTypeLabels[key as keyof typeof objectTypeLabels] ?? key, value]))} />
      </div>
      <TableCard title="Объекты">
        <TableHeader><TableRow><TableHead>Объект</TableHead><TableHead>Тип</TableHead><TableHead>Стадия</TableHead><TableHead>Статус</TableHead><TableHead>Клиент</TableHead><TableHead>Дизайнер</TableHead><TableHead>Задачи</TableHead><TableHead>Участники</TableHead></TableRow></TableHeader>
        <TableBody>{report.objects.length === 0 ? <EmptyTableRow colSpan={8}>Объекты не найдены.</EmptyTableRow> : report.objects.map((object) => <TableRow key={object.id}><TableCell><Link href={`/objects/${object.id}`} className="font-medium hover:underline">{object.title}</Link></TableCell><TableCell>{objectTypeLabels[object.objectType]}</TableCell><TableCell><Badge variant="outline">{objectStageLabels[object.stage]}</Badge></TableCell><TableCell>{objectStatusLabels[object.status]}</TableCell><TableCell>{object.client.name}</TableCell><TableCell>{object.designer?.name ?? "Нет"}</TableCell><TableCell>{object.tasks.length}</TableCell><TableCell>{object.participants.length}</TableCell></TableRow>)}</TableBody>
      </TableCard>
    </div>
  );
}
