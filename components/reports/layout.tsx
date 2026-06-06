import Link from "next/link";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import type { ReportSearchParams } from "@/modules/reports/queries";

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
          <Button asChild variant="outline">
            <Link href="/reports">К отчетам</Link>
          </Button>
        </>
      }
    />
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
