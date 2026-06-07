import { bonusVariant } from "@/components/crm/discipline/variants";
import { BadgeCell, BooleanCell, DateCell, EntityLinkCell, EmptyTableRow, TableCard } from "@/components/ui/data-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { bonusEligibilityLabels } from "@/modules/crm-discipline/bonus";
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
            <TableCell label="Раздел">{problem.area}</TableCell>
            <TableCell label="Проблема">{problem.issue}</TableCell>
            <EntityLinkCell cellLabel="Запись" href={problem.href} title={problem.title} />
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
            <TableCell label="Сущность">{row.entity}</TableCell>
            <EntityLinkCell cellLabel="Название" href={row.href} title={row.title} />
            <TableCell label="Ответственный">{row.responsibleName}</TableCell>
            <BadgeCell cellLabel="Статус учета" variant={bonusVariant(row.status)}>{bonusEligibilityLabels[row.status]}</BadgeCell>
            <TableCell label="Нарушения">{row.violations.length ? row.violations.join("; ") : "Нет активных нарушений"}</TableCell>
            <BooleanCell cellLabel="Влияет на премию" value={row.affectsBonus} />
            <DateCell cellLabel="Дата обнаружения">{formatRussianDate(row.detectedAt)}</DateCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
