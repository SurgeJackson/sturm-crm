import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MetricsGrid } from "@/components/reports/report-widgets";
import { getMyReport } from "@/modules/reports/queries";

export default async function MyReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const report = await getMyReport(user);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-semibold">Мои показатели</h1><p className="mt-1 text-sm text-muted-foreground">Личные KPI, просрочки и CRM Discipline Score.</p></div>
        <Button asChild variant="outline"><Link href="/reports">К отчетам</Link></Button>
      </div>
      <MetricsGrid metrics={report.metrics} />
      <Card><CardHeader><CardTitle>Мои нарушения CRM-дисциплины</CardTitle></CardHeader><CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Раздел</TableHead><TableHead>Проблема</TableHead><TableHead>Запись</TableHead></TableRow></TableHeader><TableBody>{report.discipline.problems.length === 0 ? <TableRow><TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">Нарушений нет.</TableCell></TableRow> : report.discipline.problems.map((problem) => <TableRow key={`${problem.href}-${problem.issue}`}><TableCell>{problem.area}</TableCell><TableCell>{problem.issue}</TableCell><TableCell><Link className="font-medium hover:underline" href={problem.href}>{problem.title}</Link></TableCell></TableRow>)}</TableBody></Table></CardContent></Card>
    </div>
  );
}
