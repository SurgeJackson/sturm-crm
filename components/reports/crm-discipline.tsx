import { crmSeverityVariant } from "@/components/crm/discipline/variants";
import { ReportScoreGrid, ReportValueListCard } from "@/components/reports/cards";
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
    <ReportScoreGrid
      items={scores}
      emptyText="Нарушений нет. Score 100%."
      getKey={(score) => score.name}
      renderTitle={(score) => score.name}
      renderValue={(score) => `${score.score}%`}
      renderBadges={(score) => [
        { label: `${score.total} наруш.`, variant: score.score < 60 ? "warning" : "secondary" },
        { label: `Крит: ${score.critical}`, variant: "warning" },
        { label: `Сред: ${score.medium}` },
        { label: `Легк: ${score.light}` }
      ]}
    />
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
