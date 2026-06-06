import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DesignerPipelineCard } from "@/components/crm/pipeline/designer-pipeline-card";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { designerRelationshipStageOptions } from "@/modules/crm/options";
import { getDesignerPipeline } from "@/modules/designers/queries";

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
      renderItem: (designer: (typeof designers)[number]) => <DesignerPipelineCard key={designer.id} designer={designer} />
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Воронка дизайнеров"
        description="Этапы развития отношений с дизайнерами и архитекторами."
        actions={<Button asChild variant="outline"><Link href="/designers">К списку</Link></Button>}
      />

      <PipelineBoard columns={columns} />
    </div>
  );
}
