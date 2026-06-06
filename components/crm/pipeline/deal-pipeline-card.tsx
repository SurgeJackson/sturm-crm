import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { PipelineItemCard } from "@/components/crm/pipeline/pipeline-item-card";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { dealProbabilityLabels } from "@/lib/constants";
import { dealStageOptions } from "@/modules/crm/options";
import { changeDealStageAction } from "@/modules/deals/actions";
import type { getDealPipeline } from "@/modules/deals/queries";
import { formatRussianDate } from "@/utils/date";
import { formatMoney } from "@/utils/money";

type DealPipelineItem = Awaited<ReturnType<typeof getDealPipeline>>[number];

function isOverdue(date?: Date | null, stage?: string) {
  return Boolean(date && date < new Date() && stage !== "LOST" && stage !== "COMPLETED");
}

export function DealPipelineCard({ deal }: { deal: DealPipelineItem }) {
  const overdue = isOverdue(deal.nextActionAt, deal.stage);

  return (
    <PipelineItemCard>
      <div className="flex items-start justify-between gap-3">
        <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">{deal.title}</Link>
        {overdue ? <AlertTriangle className="h-4 w-4 shrink-0 text-warning" /> : null}
      </div>
      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        <div>{deal.client.name}</div>
        <div>{deal.projectObject.title}</div>
        <div>{deal.responsible.name}</div>
        <div>{formatMoney(deal.potentialAmount)}</div>
        <div>{deal.probability ? dealProbabilityLabels[deal.probability] : "Вероятность не выбрана"}</div>
        <div className={overdue ? "text-warning" : ""}>{formatRussianDate(deal.nextActionAt)}</div>
      </div>
      <form action={changeDealStageAction.bind(null, deal.id)} className="mt-3 flex gap-2">
        <NativeSelect name="stage" defaultValue={deal.stage} className="h-9 min-w-0 flex-1 px-2 text-xs">
          {dealStageOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </NativeSelect>
        <Button type="submit" size="sm" variant="secondary">ОК</Button>
      </form>
    </PipelineItemCard>
  );
}
