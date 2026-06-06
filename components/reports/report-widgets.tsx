import Link from "next/link";
import type { ReactNode } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { Metric, ReportSearchParams } from "@/modules/reports/queries";

type Option = { id: string; name: string; email?: string; role?: string };

export function MetricsGrid({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title}>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-medium">{metric.title}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{metric.value}</div>
            <Badge className="mt-3" variant={metric.tone ?? "outline"}>CRM</Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ReportPageHeader({
  title,
  description,
  report,
  params
}: {
  title: string;
  description: string;
  report?: string;
  params: ReportSearchParams;
}) {
  return (
    <PageHeader
      title={title}
      description={description}
      actions={
        <>
          {report ? <CsvButton report={report} params={params} /> : null}
          <Button asChild variant="outline"><Link href="/reports">К отчетам</Link></Button>
        </>
      }
    />
  );
}

export function ReportPeriodFilter({
  params,
  users,
  children,
  actionPath
}: {
  params: ReportSearchParams;
  users: Option[];
  children?: ReactNode;
  actionPath: string;
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <form className="grid gap-3 md:grid-cols-5">
          <Input name="from" type="date" defaultValue={params.from ?? ""} />
          <Input name="to" type="date" defaultValue={params.to ?? ""} />
          <NativeSelect name="responsibleId" defaultValue={params.responsibleId ?? ""}>
            <option value="">Все ответственные</option>
            {users.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
          </NativeSelect>
          {children}
          <div className="flex flex-wrap gap-2 md:col-span-5">
            <Button type="submit" variant="secondary">Показать</Button>
            <Button asChild variant="outline"><Link href={actionPath}>Сбросить</Link></Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ReportFilterSelect({
  name,
  value,
  placeholder,
  options
}: {
  name: string;
  value?: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <NativeSelect name={name} defaultValue={value ?? ""}>
      <option value="">{placeholder}</option>
      {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
    </NativeSelect>
  );
}

export function ReportListCard({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">{children}</CardContent>
    </Card>
  );
}

export function CsvButton({ report, params }: { report: string; params: ReportSearchParams }) {
  const search = new URLSearchParams({ report });
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }

  return (
    <Button asChild variant="outline">
      <Link href={`/api/reports/export?${search.toString()}`}>
        <Download className="h-4 w-4" />
        CSV
      </Link>
    </Button>
  );
}

export function BreakdownCard({ title, data }: { title: string; data: Record<string, number> }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {Object.entries(data).length === 0 ? (
          <p className="text-sm text-muted-foreground">Данных пока нет.</p>
        ) : (
          Object.entries(data).map(([label, count]) => (
            <div key={label} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{label}</span>
              <Badge variant="secondary">{count}</Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
