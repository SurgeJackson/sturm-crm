import {
  BadgeCell,
  EntityLinkCell,
  EmptyTableRow,
  MoneyCell,
  TableCard
} from "@/components/ui/data-table";
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
              href={`/deals/${deal.id}`}
              title={deal.title}
              description={`${deal.client.name} / ${deal.projectObject.title}`}
            />
            <BadgeCell>{dealStageLabels[deal.stage]}</BadgeCell>
            <TableCell>{dealSourceLabels[deal.source]}</TableCell>
            <TableCell>{deal.probability ? dealProbabilityLabels[deal.probability] : "Нет"}</TableCell>
            <MoneyCell value={deal.potentialAmount} emptyText="Нет" />
            <TableCell>{deal.responsible.name}</TableCell>
            <TableCell>{formatRussianDate(deal.nextActionAt)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
