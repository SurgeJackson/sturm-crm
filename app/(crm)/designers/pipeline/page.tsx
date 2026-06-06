import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { NativeSelect } from "@/components/ui/native-select";
import { designerLoyaltyLabels, designerPotentialLabels, designerRelationshipStageLabels } from "@/lib/constants";
import { designerRelationshipStageOptions } from "@/modules/crm/options";
import { changeDesignerStageAction } from "@/modules/designers/actions";
import { getDesignerPipeline } from "@/modules/designers/queries";
import { formatRussianDate } from "@/utils/date";

function isOverdue(date?: Date | null) {
  return Boolean(date && new Date(date).getTime() < Date.now());
}

export default async function DesignerPipelinePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const designers = await getDesignerPipeline(user);
  const columns = designerRelationshipStageOptions.map((stage) => {
    const stageDesigners = designers.filter((designer) => designer.relationshipStage === stage.value);

    return {
      id: stage.value,
      title: stage.label,
      items: stageDesigners,
      emptyText: "Нет дизайнеров на этапе.",
      badgeVariant: "outline" as const,
      renderItem: (designer: (typeof designers)[number]) => {
        const action = changeDesignerStageAction.bind(null, designer.id);

        return (
          <div key={designer.id} className="space-y-3 rounded-md border bg-background p-3">
            <div>
              <Link href={`/designers/${designer.id}`} className="font-medium hover:underline">{designer.name}</Link>
              <div className="text-xs text-muted-foreground">{designer.studio ?? designer.responsible.name}</div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant={designer.potential === "A" ? "warning" : "outline"}>{designerPotentialLabels[designer.potential]}</Badge>
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
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Воронка дизайнеров</h1>
          <p className="mt-1 text-sm text-muted-foreground">Этапы развития отношений с дизайнерами и архитекторами.</p>
        </div>
        <Button asChild variant="outline"><Link href="/designers">К списку</Link></Button>
      </div>

      <PipelineBoard columns={columns} />
    </div>
  );
}
