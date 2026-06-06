import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportPeriodFilter } from "@/components/reports/filters";
import { ReportPageHeader } from "@/components/reports/layout";
import { MetricsGrid } from "@/components/reports/metrics";
import { BonusEligibilityRowsTable } from "@/components/reports/tables";
import { getBonusEligibilityReport, getReportFilterOptions, type ReportSearchParams } from "@/modules/reports/queries";

type PageProps = { searchParams: Promise<ReportSearchParams> };

const entityTabs = [
  { value: "DEAL", label: "Сделки" },
  { value: "PROPOSAL", label: "КП" },
  { value: "CLIENT", label: "Клиенты" },
  { value: "OBJECT", label: "Объекты" }
] as const;

export default async function BonusEligibilityReportPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [report, filters] = await Promise.all([getBonusEligibilityReport(params, user), getReportFilterOptions(user)]);

  return (
    <div className="space-y-6">
      <ReportPageHeader title="Премиальный статус CRM" description="Какие записи готовы к управленческому учету, а какие требуют исправления." report="bonus-eligibility" params={params} />

      <ReportPeriodFilter params={params} users={filters.users} actionPath="/reports/bonus-eligibility">
        <NativeSelect name="entity" defaultValue={params.entity ?? ""}>
          <option value="">Все сущности</option>
          {entityTabs.map((tab) => <option key={tab.value} value={tab.value}>{tab.label}</option>)}
        </NativeSelect>
        <NativeSelect name="bonusStatus" defaultValue={params.bonusStatus ?? ""}>
          <option value="">Все статусы учета</option>
          <option value="ELIGIBLE">Учитывается</option>
          <option value="NEEDS_FIX">Требует исправления</option>
          <option value="NOT_ELIGIBLE">Не учитывается</option>
        </NativeSelect>
        <NativeSelect name="severity" defaultValue={params.severity ?? ""}>
          <option value="">Любая серьезность</option>
          <option value="critical">Критические</option>
          <option value="medium">Средние</option>
          <option value="low">Легкие</option>
        </NativeSelect>
        <Input name="violationCode" defaultValue={params.violationCode ?? ""} placeholder="Код нарушения" />
      </ReportPeriodFilter>

      <MetricsGrid metrics={report.metrics} />

      <Card>
        <CardHeader><CardTitle>Записи по статусу учета</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="DEAL">
            <div className="p-4 pb-0">
              <TabsList className="flex-wrap">
                {entityTabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
              </TabsList>
            </div>
            {entityTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-0">
                <BonusEligibilityRowsTable rows={report.rows.filter((row) => row.entityType === tab.value)} />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
