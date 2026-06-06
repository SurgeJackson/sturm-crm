import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricsGrid, ReportPageHeader, ReportPeriodFilter } from "@/components/reports/report-widgets";
import { getOverdueReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";
import { formatRussianDate, formatRussianDateTime } from "@/utils/date";

type PageProps = { searchParams: Promise<ReportSearchParams> };

export default async function OverdueReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const params = await searchParams;
  const [report, filters] = await Promise.all([getOverdueReport(params, user), getReportFilterOptions(user)]);
  return (
    <div className="space-y-6">
      <ReportPageHeader title="Просрочки" description="Задачи, follow-up, сделки, дизайнеры, объекты и клиенты без движения." report="overdue" params={params} />
      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/overdue" />
      <MetricsGrid metrics={report.metrics} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Просроченные задачи</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Задача</TableHead><TableHead>Срок</TableHead><TableHead>Ответственный</TableHead></TableRow></TableHeader><TableBody>{report.tasks.length === 0 ? <TableRow><TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">Просроченных задач нет.</TableCell></TableRow> : report.tasks.map((task) => <TableRow key={task.id}><TableCell><Link className="font-medium hover:underline" href={`/tasks/${task.id}`}>{task.title}</Link></TableCell><TableCell>{formatRussianDateTime(task.dueAt)}</TableCell><TableCell>{task.responsible.name}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        <Card><CardHeader><CardTitle>Просроченный follow-up КП</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>КП</TableHead><TableHead>Follow-up</TableHead><TableHead>Ответственный</TableHead></TableRow></TableHeader><TableBody>{report.proposalFollowUps.length === 0 ? <TableRow><TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">Просроченных follow-up нет.</TableCell></TableRow> : report.proposalFollowUps.map((proposal) => <TableRow key={proposal.id}><TableCell><Link className="font-medium hover:underline" href={`/proposals/${proposal.id}`}>{proposal.proposalNumber}</Link></TableCell><TableCell>{formatRussianDate(proposal.nextTouchAt)}</TableCell><TableCell>{proposal.responsible.name}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        <Card><CardHeader><CardTitle>Сделки с просроченным действием</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Сделка</TableHead><TableHead>Дата</TableHead><TableHead>Ответственный</TableHead></TableRow></TableHeader><TableBody>{report.deals.length === 0 ? <TableRow><TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">Таких сделок нет.</TableCell></TableRow> : report.deals.map((deal) => <TableRow key={deal.id}><TableCell><Link className="font-medium hover:underline" href={`/deals/${deal.id}`}>{deal.title}</Link></TableCell><TableCell>{formatRussianDate(deal.nextActionAt)}</TableCell><TableCell>{deal.responsible.name}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
        <Card><CardHeader><CardTitle>Дизайнеры без касаний</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Дизайнер</TableHead><TableHead>Последнее касание</TableHead><TableHead>Ответственный</TableHead></TableRow></TableHeader><TableBody>{report.designers.length === 0 ? <TableRow><TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">Дизайнеров без касаний нет.</TableCell></TableRow> : report.designers.map((designer) => <TableRow key={designer.id}><TableCell><Link className="font-medium hover:underline" href={`/designers/${designer.id}`}>{designer.name}</Link></TableCell><TableCell>{formatRussianDate(designer.lastTouchAt)}</TableCell><TableCell>{designer.responsible.name}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
      </div>
    </div>
  );
}
