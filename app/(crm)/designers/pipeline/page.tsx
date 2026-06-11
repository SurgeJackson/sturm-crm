import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DesignerPipelineBoard } from "@/components/crm/pipeline/designer-pipeline-board";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getPipelinePreference } from "@/lib/pipeline-preferences";
import { relationshipStages } from "@/modules/designers/form";
import { getDesignerPipeline } from "@/modules/designers/queries";

export default async function DesignerPipelinePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [designers, settings] = await Promise.all([
    getDesignerPipeline(user),
    prisma.user.findUnique({ where: { id: user.id }, select: { profileSettings: true } })
  ]);
  const pipelinePreference = getPipelinePreference(settings?.profileSettings, "designers", relationshipStages);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Воронка дизайнеров"
        description="Этапы развития отношений с дизайнерами и архитекторами."
        actions={<Button asChild variant="outline"><Link href="/designers">К списку</Link></Button>}
      />

      <DesignerPipelineBoard designers={designers} now={new Date().toISOString()} initialPreference={pipelinePreference} />
    </div>
  );
}
