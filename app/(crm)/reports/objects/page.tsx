import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BreakdownCard, CsvButton, MetricsGrid, ReportPeriodFilter } from "@/components/reports/report-widgets";
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-semibold">Отчет по объектам</h1><p className="mt-1 text-sm text-muted-foreground">Стадии, типы, участники и объекты без движения.</p></div><div className="flex gap-2"><CsvButton report="objects" params={params} /><Button asChild variant="outline"><Link href="/reports">К отчетам</Link></Button></div></div>
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/objects">
        <select name="stage" defaultValue={params.stage ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Все стадии</option>{objectStageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <select name="status" defaultValue={params.status ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Все статусы</option>{objectStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
        <select name="type" defaultValue={params.type ?? ""} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="">Все типы</option>{objectTypeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>
      </ReportPeriodFilter>
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-2">
        <BreakdownCard title="Объекты по стадиям" data={Object.fromEntries(Object.entries(report.byStage).map(([key, value]) => [objectStageLabels[key as keyof typeof objectStageLabels] ?? key, value]))} />
        <BreakdownCard title="Объекты по типам" data={Object.fromEntries(Object.entries(report.byType).map(([key, value]) => [objectTypeLabels[key as keyof typeof objectTypeLabels] ?? key, value]))} />
      </div>
      <Card><CardHeader><CardTitle>Объекты</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Объект</TableHead><TableHead>Тип</TableHead><TableHead>Стадия</TableHead><TableHead>Статус</TableHead><TableHead>Клиент</TableHead><TableHead>Дизайнер</TableHead><TableHead>Задачи</TableHead><TableHead>Участники</TableHead></TableRow></TableHeader><TableBody>{report.objects.length === 0 ? <TableRow><TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">Объекты не найдены.</TableCell></TableRow> : report.objects.map((object) => <TableRow key={object.id}><TableCell><Link href={`/objects/${object.id}`} className="font-medium hover:underline">{object.title}</Link></TableCell><TableCell>{objectTypeLabels[object.objectType]}</TableCell><TableCell><Badge variant="outline">{objectStageLabels[object.stage]}</Badge></TableCell><TableCell>{objectStatusLabels[object.status]}</TableCell><TableCell>{object.client.name}</TableCell><TableCell>{object.designer?.name ?? "Нет"}</TableCell><TableCell>{object.tasks.length}</TableCell><TableCell>{object.participants.length}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </div>
  );
}
