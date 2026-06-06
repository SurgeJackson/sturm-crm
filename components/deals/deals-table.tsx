import { dealStageVariant } from "@/components/crm/status-variants";
import { BonusEligibilityCell, CrmDisciplineCell } from "@/components/crm/table-cells";
import {
  BadgeCell,
  DateCell,
  EmptyTableRow,
  EntityLinkCell,
  MoneyCell,
  TableCard,
  TextLinkCell
} from "@/components/ui/data-table";
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  dealProbabilityLabels,
  dealProbabilityPercent,
  dealStageLabels,
  dealSourceLabels
} from "@/lib/constants";
import type { getDeals } from "@/modules/deals/queries";
import { formatRussianDate } from "@/utils/date";

type DealItem = Awaited<ReturnType<typeof getDeals>>["items"][number];

function isOverdue(date?: Date | null, stage?: string) {
  return Boolean(date && date < new Date() && stage !== "LOST" && stage !== "COMPLETED");
}

export function DealsTable({ deals }: { deals: DealItem[] }) {
  return (
    <TableCard>
      <TableHeader>
        <TableRow>
          <TableHead>Сделка</TableHead>
          <TableHead>Клиент</TableHead>
          <TableHead>Объект</TableHead>
          <TableHead>Ответственный</TableHead>
          <TableHead>Стадия</TableHead>
          <TableHead>Вероятность</TableHead>
          <TableHead>Сумма</TableHead>
          <TableHead>Следующее действие</TableHead>
          <TableHead>CRM-дисциплина</TableHead>
          <TableHead>Учет в премии</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deals.length === 0 ? (
          <EmptyTableRow colSpan={10}>Сделки не найдены.</EmptyTableRow>
        ) : (
          deals.map((deal) => (
            <TableRow key={deal.id}>
              <EntityLinkCell href={`/deals/${deal.id}`} title={deal.title} description={dealSourceLabels[deal.source]} cellLabel="Сделка" />
              <TextLinkCell cellLabel="Клиент" href={`/clients/${deal.client.id}`}>{deal.client.name}</TextLinkCell>
              <TextLinkCell cellLabel="Объект" href={`/objects/${deal.projectObject.id}`}>{deal.projectObject.title}</TextLinkCell>
              <TableCell label="Ответственный">{deal.responsible.name}</TableCell>
              <BadgeCell cellLabel="Стадия" variant={dealStageVariant(deal.stage)}>{dealStageLabels[deal.stage]}</BadgeCell>
              {deal.probability ? (
                <BadgeCell cellLabel="Вероятность" variant={deal.probability === "HIGH" || deal.probability === "VERY_HIGH" ? "secondary" : "outline"}>
                  {dealProbabilityLabels[deal.probability]} · {dealProbabilityPercent[deal.probability]}%
                </BadgeCell>
              ) : (
                <TableCell label="Вероятность" className="text-muted-foreground">Не выбрана</TableCell>
              )}
              <MoneyCell cellLabel="Сумма" value={deal.potentialAmount} />
              <DateCell cellLabel="Следующее действие" warning={isOverdue(deal.nextActionAt, deal.stage)} muted={deal.nextActionText || "Нет шага"}>
                {formatRussianDate(deal.nextActionAt)}
              </DateCell>
              <CrmDisciplineCell violations={deal.crmViolations} />
              <BonusEligibilityCell violations={deal.crmViolations} />
            </TableRow>
          ))
        )}
      </TableBody>
    </TableCard>
  );
}
