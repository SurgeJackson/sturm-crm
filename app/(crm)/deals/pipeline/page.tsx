import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DealPipelineBoard } from "@/components/crm/pipeline/deal-pipeline-board";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { getPipelinePreference } from "@/lib/pipeline-preferences";
import { dealStages } from "@/modules/deals/form";
import { getDealPipeline } from "@/modules/deals/queries";

type DealPipelinePageProps = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function DealPipelinePage({ searchParams }: DealPipelinePageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const query = await searchParams;
  const [deals, settings] = await Promise.all([
    getDealPipeline(user),
    prisma.user.findUnique({ where: { id: user.id }, select: { profileSettings: true } })
  ]);
  const pipelinePreference = getPipelinePreference(settings?.profileSettings, "deals", dealStages);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Воронка сделок"
        description="Kanban-контроль стадий, следующих действий и просрочек."
        actions={(
          <>
            <Button asChild variant="outline"><Link href="/deals">Список</Link></Button>
            <Button asChild><Link href="/deals/new">Создать сделку</Link></Button>
          </>
        )}
      />

      <PageNoticeStack
        notices={[
          { show: Boolean(query.saved), message: "Стадия сделки обновлена." },
          { show: query.error === "permission", tone: "destructive", message: "Недостаточно прав для изменения стадии." },
          { show: query.error === "stage", tone: "destructive", message: "Некорректная стадия сделки." }
        ]}
      />

      <DealPipelineBoard deals={deals} now={new Date().toISOString()} initialPreference={pipelinePreference} />
    </div>
  );
}
