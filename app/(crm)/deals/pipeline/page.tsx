import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { DealPipelineCard } from "@/components/crm/pipeline/deal-pipeline-card";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { Button } from "@/components/ui/button";
import { dealStageLabels } from "@/lib/constants";
import { getDealPipeline } from "@/modules/deals/queries";

type DealPipelinePageProps = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

const stageOrder = [
  "NEW_REQUEST",
  "QUALIFICATION",
  "SELECTION",
  "PROPOSAL_IN_PROGRESS",
  "PROPOSAL_SENT",
  "WAITING_DECISION",
  "NEGOTIATION",
  "INVOICE_OR_ORDER",
  "PAID",
  "IN_DELIVERY",
  "COMPLETED",
  "LOST"
] as const;

export default async function DealPipelinePage({ searchParams }: DealPipelinePageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const query = await searchParams;
  const deals = await getDealPipeline(user);
  const grouped = Object.fromEntries(stageOrder.map((stage) => [stage, deals.filter((deal) => deal.stage === stage)]));
  const columns = stageOrder.map((stage) => ({
    id: stage,
    title: dealStageLabels[stage],
    items: grouped[stage],
    emptyText: "Нет сделок.",
    renderItem: (deal: (typeof deals)[number]) => <DealPipelineCard key={deal.id} deal={deal} />
  }));

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

      <PipelineBoard columns={columns} />
    </div>
  );
}
