import {
  BadgeCell,
  DateCell,
  EntityLinkCell,
  EmptyTableRow,
  MoneyCell,
  TableCard
} from "@/components/ui/data-table";
import { dealStageVariant } from "@/components/crm/status-variants";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dealProbabilityLabels, dealSourceLabels, dealStageLabels } from "@/lib/constants";
import type { getDealsReport } from "@/modules/reports/queries";
import { formatRussianDate } from "@/utils/date";

type DealsReport = Awaited<ReturnType<typeof getDealsReport>>;

export function DealsReportTable({ deals }: { deals: DealsReport["deals"] }) {
  return (
    <TableCard title="Сделки">
      <TableHeader>
        <TableRow>
          <TableHead>Сделка</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Источник</TableHead>
          <TableHead>Вероятность</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Следующий шаг</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.length === 0 ? (
          <EmptyTableRow colSpan={7}>Сделки не найдены.</EmptyTableRow>
        ) : deals.map((deal) => (
          <TableRow key={deal.id}>
            <EntityLinkCell
              cellLabel="Сделка"
              href={`/deals/${deal.id}`}
              title={deal.title}
              description={`${deal.client.name} / ${deal.projectObject.title}`}
            />
            <BadgeCell cellLabel="Стадия" variant={dealStageVariant(deal.stage)}>{dealStageLabels[deal.stage]}</BadgeCell>
            <TableCell label="Источник">{dealSourceLabels[deal.source]}</TableCell>
            <TableCell label="Вероятность">{deal.probability ? dealProbabilityLabels[deal.probability] : "Нет"}</TableCell>
            <MoneyCell cellLabel="Сумма" value={deal.potentialAmount} emptyText="Нет" />
            <TableCell label="Ответственный">{deal.responsible.name}</TableCell>
            <DateCell cellLabel="Следующий шаг">{formatRussianDate(deal.nextActionAt)}</DateCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
