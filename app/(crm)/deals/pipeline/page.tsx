import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { Button } from "@/components/ui/button";
import { PipelineBoard } from "@/components/crm/pipeline-board";
import { NativeSelect } from "@/components/ui/native-select";
import { dealProbabilityLabels, dealStageLabels } from "@/lib/constants";
import { dealStageOptions } from "@/modules/crm/options";
import { changeDealStageAction } from "@/modules/deals/actions";
import { getDealPipeline } from "@/modules/deals/queries";
import { formatRussianDate } from "@/utils/date";

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

function formatMoney(value?: number | null) {
  return value ? `${value.toLocaleString("ru-RU")} ₽` : "Без суммы";
}

function isOverdue(date?: Date | null, stage?: string) {
  return Boolean(date && date < new Date() && stage !== "LOST" && stage !== "COMPLETED");
}

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
    renderItem: (deal: (typeof deals)[number]) => (
      <div key={deal.id} className="rounded-md border p-3 text-sm">
        <div className="flex items-start justify-between gap-3">
          <Link href={`/deals/${deal.id}`} className="font-medium hover:underline">{deal.title}</Link>
          {isOverdue(deal.nextActionAt, deal.stage) ? <AlertTriangle className="h-4 w-4 shrink-0 text-warning" /> : null}
        </div>
        <div className="mt-2 space-y-1 text-xs text-muted-foreground">
          <div>{deal.client.name}</div>
          <div>{deal.projectObject.title}</div>
          <div>{deal.responsible.name}</div>
          <div>{formatMoney(deal.potentialAmount)}</div>
          <div>{deal.probability ? dealProbabilityLabels[deal.probability] : "Вероятность не выбрана"}</div>
          <div className={isOverdue(deal.nextActionAt, deal.stage) ? "text-warning" : ""}>
            {formatRussianDate(deal.nextActionAt)}
          </div>
        </div>
        <form action={changeDealStageAction.bind(null, deal.id)} className="mt-3 flex gap-2">
          <NativeSelect name="stage" defaultValue={deal.stage} className="h-9 min-w-0 flex-1 px-2 text-xs">
            {dealStageOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </NativeSelect>
          <Button type="submit" size="sm" variant="secondary">ОК</Button>
        </form>
      </div>
    )
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Воронка сделок</h1>
          <p className="mt-1 text-sm text-muted-foreground">Kanban-контроль стадий, следующих действий и просрочек.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link href="/deals">Список</Link></Button>
          <Button asChild><Link href="/deals/new">Создать сделку</Link></Button>
        </div>
      </div>

      {query.saved ? <div className="rounded-md border border-primary p-3 text-sm text-primary">Стадия сделки обновлена.</div> : null}
      {query.error === "permission" ? <div className="rounded-md border border-destructive p-3 text-sm text-destructive">Недостаточно прав для изменения стадии.</div> : null}
      {query.error === "stage" ? <div className="rounded-md border border-destructive p-3 text-sm text-destructive">Некорректная стадия сделки.</div> : null}

      <PipelineBoard columns={columns} />
    </div>
  );
}
