import { crmSeverityVariant } from "@/components/crm/discipline/variants";
import { ReportValueListCard } from "@/components/reports/cards";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BadgeCell, EmptyTableRow, EntityLinkCell, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { getCrmDisciplineReport } from "@/modules/reports/queries";

type CrmDisciplineReport = Awaited<ReturnType<typeof getCrmDisciplineReport>>;
type CrmScore = CrmDisciplineReport["scores"][number];
type CrmEmployeeSummaryRow = CrmDisciplineReport["byEmployee"][number];
type CrmEntitySummaryRow = CrmDisciplineReport["byEntity"][number];
type CrmFrequentSummaryRow = CrmDisciplineReport["frequent"][number];
type CrmProblem = CrmDisciplineReport["problems"][number];

const severityLabels: Record<string, string> = {
  critical: "Критично",
  medium: "Средне",
  light: "Легко",
  low: "Легко"
};

export function CrmScoreGrid({ scores }: { scores: CrmScore[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {scores.length === 0 ? (
        <Card><CardContent className="pt-5 text-sm text-muted-foreground">Нарушений нет. Score 100%.</CardContent></Card>
      ) : scores.map((score) => (
        <Card key={score.name}>
          <CardHeader><CardTitle>{score.name}</CardTitle></CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{score.score}%</div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <Badge variant={score.score < 60 ? "warning" : "secondary"}>{score.total} наруш.</Badge>
              <Badge variant="warning">Крит: {score.critical}</Badge>
              <Badge variant="outline">Сред: {score.medium}</Badge>
              <Badge variant="outline">Легк: {score.light}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CrmDisciplineBreakdowns({
  byEmployee,
  byEntity,
  frequent
}: {
  byEmployee: CrmEmployeeSummaryRow[];
  byEntity: CrmEntitySummaryRow[];
  frequent: CrmFrequentSummaryRow[];
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <ReportValueListCard
        title="Нарушения по сотрудникам"
        items={byEmployee}
        emptyText="Нет данных."
        getKey={(row) => row.name ?? "unknown"}
        renderLabel={(row) => row.name ?? "Нет имени"}
        renderValue={(row) => `${row.total ?? 0} · крит. ${row.critical ?? 0} · премия ${row.bonus ?? 0}`}
        valueVariant="outline"
      />
      <ReportValueListCard
        title="Нарушения по сущностям"
        items={byEntity}
        emptyText="Нет данных."
        getKey={(row) => row.name ?? "unknown"}
        renderLabel={(row) => row.name ?? "Нет названия"}
        renderValue={(row) => row.count ?? 0}
      />
      <ReportValueListCard
        title="Самые частые нарушения"
        items={frequent}
        emptyText="Нет данных."
        getKey={(row) => row.code}
        renderLabel={(row) => row.code}
        renderValue={(row) => row.count ?? 0}
      />
    </div>
  );
}

export function CrmProblemsTable({ problems }: { problems: CrmProblem[] }) {
  return (
    <TableCard title="Проблемные записи">
      <TableHeader>
        <TableRow>
          <TableHead>Раздел</TableHead>
          <TableHead>Проблема</TableHead>
          <TableHead>Серьезность</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Код</TableHead>
          <TableHead>Премирование</TableHead>
          <TableHead>Запись</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {problems.length === 0 ? (
          <EmptyTableRow colSpan={7}>Нарушений нет.</EmptyTableRow>
        ) : problems.map((problem) => (
          <TableRow key={`${problem.area}-${problem.href}-${problem.issue}`}>
            <TableCell>{problem.area}</TableCell>
            <TableCell>{problem.issue}</TableCell>
            <BadgeCell variant={crmSeverityVariant(problem.severity)}>{severityLabels[problem.severity]}</BadgeCell>
            <TableCell>{problem.responsibleName}</TableCell>
            <TableCell>{problem.violationCode}</TableCell>
            <TableCell>{problem.canAffectBonus ? "Влияет" : "Не влияет"}</TableCell>
            <EntityLinkCell href={problem.href} title={`${problem.entity}: ${problem.title}`} />
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
