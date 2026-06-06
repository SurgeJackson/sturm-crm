import Link from "next/link";
import { designerPotentialVariant } from "@/components/crm/status-variants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { designerLoyaltyLabels, designerPotentialLabels, designerRelationshipStageLabels } from "@/lib/constants";
import { designerRelationshipStageOptions } from "@/modules/crm/options";
import { changeDesignerStageAction } from "@/modules/designers/actions";
import type { getDesignerPipeline } from "@/modules/designers/queries";
import { formatRussianDate } from "@/utils/date";

type DesignerPipelineItem = Awaited<ReturnType<typeof getDesignerPipeline>>[number];

function isOverdue(date?: Date | null) {
  return Boolean(date && new Date(date).getTime() < Date.now());
}

export function DesignerPipelineCard({ designer }: { designer: DesignerPipelineItem }) {
  const action = changeDesignerStageAction.bind(null, designer.id);

  return (
    <div className="space-y-3 rounded-md border bg-background p-3">
      <div>
        <Link href={`/designers/${designer.id}`} className="font-medium hover:underline">{designer.name}</Link>
        <div className="text-xs text-muted-foreground">{designer.studio ?? designer.responsible.name}</div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant={designerPotentialVariant(designer.potential)}>{designerPotentialLabels[designer.potential]}</Badge>
        <Badge variant="outline">{designerLoyaltyLabels[designer.loyalty]}</Badge>
      </div>
      <div className={isOverdue(designer.nextStepAt) ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
        {formatRussianDate(designer.nextStepAt)} · {designer.nextStepText ?? "Нет шага"}
      </div>
      <form action={action} className="flex gap-2">
        <NativeSelect name="relationshipStage" defaultValue={designer.relationshipStage} className="h-9 min-w-0 flex-1 px-2 text-xs">
          {designerRelationshipStageOptions.map((option) => (
            <option key={option.value} value={option.value}>{designerRelationshipStageLabels[option.value]}</option>
          ))}
        </NativeSelect>
        <Button size="sm" type="submit">OK</Button>
      </form>
    </div>
  );
}
