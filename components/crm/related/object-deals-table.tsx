import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BadgeCell, DateCell, EmptyTableRow, EntityLinkCell, MoneyCell, TableCard } from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { dealStageVariant } from "@/components/crm/status-variants";
import { dealProbabilityLabels, dealStageLabels } from "@/lib/constants";
import type { getProjectObjectForUser } from "@/modules/objects/queries";
import { formatRussianDate } from "@/utils/date";

type ObjectDetail = Awaited<ReturnType<typeof getProjectObjectForUser>>;

export function ObjectDealsTable({ objectId, deals }: { objectId: string; deals: ObjectDetail["deals"] }) {
  return (
    <TableCard
      title="Сделки"
      actions={
        <Button asChild size="sm">
          <Link href={`/deals/new?objectId=${objectId}`}>Создать сделку по объекту</Link>
        </Button>
      }
    >
      <TableHeader>
        <TableRow>
          <TableHead>Сделка</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Вероятность</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Следующее действие</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.length === 0 ? (
          <EmptyTableRow colSpan={6}>По объекту пока нет сделок</EmptyTableRow>
        ) : deals.map((deal) => (
          <TableRow key={deal.id}>
            <EntityLinkCell href={`/deals/${deal.id}`} title={deal.title} />
            <BadgeCell variant={dealStageVariant(deal.stage)}>{dealStageLabels[deal.stage]}</BadgeCell>
            <MoneyCell value={deal.potentialAmount} />
            <TableCell>{deal.probability ? dealProbabilityLabels[deal.probability] : "Не выбрана"}</TableCell>
            <TableCell>{deal.responsible.name}</TableCell>
            <DateCell>{formatRussianDate(deal.nextActionAt)}</DateCell>
          </TableRow>
        ))}
      </TableBody>
    </TableCard>
  );
}
