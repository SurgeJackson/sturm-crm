import { bonusVariant } from "@/components/crm/discipline/variants";
import { BadgeCell, EntityLinkCell, EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bonusEligibilityLabels } from "@/modules/crm-discipline/service";
import type { getBonusEligibilityReport, getMyReport } from "@/modules/reports/queries";
import { formatRussianDate } from "@/utils/date";

type BonusEligibilityReport = Awaited<ReturnType<typeof getBonusEligibilityReport>>;
type MyReport = Awaited<ReturnType<typeof getMyReport>>;

export function MyDisciplineProblemsTable({ problems }: { problems: MyReport["discipline"]["problems"] }) {
  return (
    <TableCard title="Мои нарушения CRM-дисциплины">
      <TableHeader>
        <TableRow>
          <TableHead>Раздел</TableHead>
          <TableHead>Проблема</TableHead>
          <TableHead>Запись</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {problems.length === 0 ? (
          <EmptyTableRow colSpan={3}>Нарушений нет.</EmptyTableRow>
        ) : problems.map((problem) => (
          <TableRow key={`${problem.href}-${problem.issue}`}>
            <TableCell>{problem.area}</TableCell>
            <TableCell>{problem.issue}</TableCell>
            <EntityLinkCell href={problem.href} title={problem.title} />
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}

export function BonusEligibilityRowsTable({ rows }: { rows: BonusEligibilityReport["rows"] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Сущность</TableHead>
          <TableHead>Название</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Статус учета</TableHead>
          <TableHead>Нарушения</TableHead>
          <TableHead>Влияет на премию</TableHead>
          <TableHead>Дата обнаружения</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <EmptyTableRow colSpan={7}>Записей нет.</EmptyTableRow>
        ) : rows.map((row) => (
          <TableRow key={`${row.entityType}-${row.href}`}>
            <TableCell>{row.entity}</TableCell>
            <EntityLinkCell href={row.href} title={row.title} />
            <TableCell>{row.responsibleName}</TableCell>
            <BadgeCell variant={bonusVariant(row.status)}>{bonusEligibilityLabels[row.status]}</BadgeCell>
            <TableCell>{row.violations.length ? row.violations.join("; ") : "Нет активных нарушений"}</TableCell>
            <TableCell>{row.affectsBonus ? "Да" : "Нет"}</TableCell>
            <TableCell>{formatRussianDate(row.detectedAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
