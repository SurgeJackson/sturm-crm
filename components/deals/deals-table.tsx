import Link from "next/link";
import { BonusEligibilityBadge, CrmDisciplineBadge } from "@/components/crm/discipline/badges";
import { dealStageVariant } from "@/components/crm/status-variants";
import { Badge } from "@/components/ui/badge";
import { DateCell, EmptyTableRow, EntityLinkCell, MoneyCell, TableCard } from "@/components/ui/data-table";
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
              <EntityLinkCell href={`/deals/${deal.id}`} title={deal.title} description={dealSourceLabels[deal.source]} />
              <TableCell><Link href={`/clients/${deal.client.id}`} className="hover:underline">{deal.client.name}</Link></TableCell>
              <TableCell><Link href={`/objects/${deal.projectObject.id}`} className="hover:underline">{deal.projectObject.title}</Link></TableCell>
              <TableCell>{deal.responsible.name}</TableCell>
              <TableCell><Badge variant={dealStageVariant(deal.stage)}>{dealStageLabels[deal.stage]}</Badge></TableCell>
              <TableCell>
                {deal.probability ? (
                  <Badge variant={deal.probability === "HIGH" || deal.probability === "VERY_HIGH" ? "secondary" : "outline"}>
                    {dealProbabilityLabels[deal.probability]} · {dealProbabilityPercent[deal.probability]}%
                  </Badge>
                ) : (
                  <span className="text-muted-foreground">Не выбрана</span>
                )}
              </TableCell>
              <MoneyCell value={deal.potentialAmount} />
              <DateCell warning={isOverdue(deal.nextActionAt, deal.stage)} muted={deal.nextActionText || "Нет шага"}>
                {formatRussianDate(deal.nextActionAt)}
              </DateCell>
              <TableCell><CrmDisciplineBadge violations={deal.crmViolations} /></TableCell>
              <TableCell><BonusEligibilityBadge violations={deal.crmViolations} /></TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </TableCard>
  );
}
