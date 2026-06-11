"use client";

import Link from "next/link";
import type { DragEventHandler } from "react";
import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { DealStage } from "@/generated/prisma/client";
import { PipelineItemCard } from "@/components/crm/pipeline/pipeline-item-card";
import { usePipelineGroups } from "@/components/crm/pipeline/use-pipeline-groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { dealProbabilityLabels, dealStageLabels } from "@/lib/constants";
import type { PipelineBoardPreference, PipelineLayoutItemPreference } from "@/lib/pipeline-preferences";
import type { getDealPipeline } from "@/modules/deals/queries";
import { formatRussianDate } from "@/utils/date";
import { formatMoney } from "@/utils/money";
import { cn } from "@/lib/utils";

type DealPipelineItem = Awaited<ReturnType<typeof getDealPipeline>>[number];

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
] as const satisfies readonly DealStage[];

export function DealPipelineBoard({
  deals,
  now,
  initialPreference
}: {
  deals: DealPipelineItem[];
  now: string;
  initialPreference: PipelineBoardPreference;
}) {
  const [items, setItems] = useState(deals);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DealStage | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupByManager, setGroupByManager] = useState(false);
  const [collapsedManagers, setCollapsedManagers] = useState<string[]>([]);
  const groups = usePipelineGroups({ board: "deals", columnIds: stageOrder, initialPreference });

  const managerGroups = useMemo(
    () => groupItemsByManager(items),
    [items]
  );

  function toggleManagerGrouping() {
    const enabled = !groupByManager;
    setGroupByManager(enabled);
    if (enabled) setCollapsedManagers(managerGroups.slice(1).map((manager) => manager.id));
  }

  async function moveDeal(dealId: string, stage: DealStage) {
    const previousItems = items;
    const deal = previousItems.find((item) => item.id === dealId);
    if (!deal || deal.stage === stage) return;

    setMessage(null);
    setItems((current) => current.map((item) => item.id === dealId ? { ...item, stage } : item));

    const response = await fetch(`/api/deals/${dealId}/stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null) as { message?: string } | null;
      setItems(previousItems);
      setMessage(data?.message ?? "Не удалось изменить стадию сделки");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <form
            className="flex min-w-72 items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              groups.addGroup(newGroupName);
              setNewGroupName("");
            }}
          >
            <Input
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              placeholder="Название группы"
              className="h-9"
            />
            <Button type="submit" size="sm">
              <Plus className="h-4 w-4" />
              Группа
            </Button>
          </form>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={groups.resetPreference}
            title="Сбросить пользовательскую раскладку"
          >
            <RotateCcw className="h-4 w-4" />
            Сброс
          </Button>
          <Button
            type="button"
            variant={groupByManager ? "secondary" : "outline"}
            size="sm"
            onClick={toggleManagerGrouping}
          >
            По менеджеру
          </Button>
        </div>
        <div
          className={cn(
            "rounded-md border border-dashed px-3 py-2 text-xs text-muted-foreground",
            groups.draggedColumnId && "border-primary text-foreground"
          )}
          onDragOver={(event) => {
            if (!groups.draggedColumnId) return;
            event.preventDefault();
          }}
          onDrop={(event) => {
            event.preventDefault();
            groups.removeColumnFromGroups(groups.draggedColumnId);
            groups.setDraggedColumnId(null);
          }}
        >
          Без группы
        </div>
      </div>
      {message ? <div className="rounded-md border border-destructive px-3 py-2 text-sm text-destructive">{message}</div> : null}
      {groupByManager ? (
        <div className="space-y-3">
          {managerGroups.map((manager) => {
            const collapsed = collapsedManagers.includes(manager.id);

            return (
              <section key={manager.id} className="rounded-md border bg-card">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 border-b px-3 py-2 text-left"
                  onClick={() => setCollapsedManagers((current) => current.includes(manager.id)
                    ? current.filter((id) => id !== manager.id)
                    : [...current, manager.id])}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    {collapsed ? <ChevronRight className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{manager.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">{manager.department}</span>
                    </span>
                  </span>
                  <Badge variant="outline">{manager.items.length}</Badge>
                </button>
                {collapsed ? null : <div className="p-2">{renderKanban(manager.items)}</div>}
              </section>
            );
          })}
        </div>
      ) : renderKanban(items)}
    </div>
  );

  function renderKanban(boardItems: DealPipelineItem[]) {
    const grouped = groupItemsByStage(boardItems);

    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${getVisibleUnitCount(groups.layout, groups.groups)}, minmax(0, 1fr))` }}>
        {groups.layout.map((layoutItem) => {
          if (layoutItem.type === "column") return renderColumn(layoutItem.id as DealStage, { layoutItem });

          const group = groups.groups.find((candidate) => candidate.id === layoutItem.id);
          if (!group) return null;

          const columnIds = group.columnIds.filter((columnId): columnId is DealStage => stageOrder.includes(columnId as DealStage));
          const groupCount = columnIds.reduce((total, stage) => total + grouped[stage].length, 0);
          const span = group.collapsed ? 1 : Math.max(columnIds.length, 1);

          return (
            <section
              key={group.id}
              className={cn("min-w-0 rounded-md border bg-card", groups.draggedColumnId && "border-dashed")}
              style={{ gridColumn: `span ${span} / span ${span}` }}
              onDragOver={(event) => {
                if (!groups.draggedLayoutItem) return;
                event.preventDefault();
              }}
              onDrop={(event) => {
                if (!groups.draggedLayoutItem) return;
                event.preventDefault();
                moveLayoutRelative(groups.draggedLayoutItem, layoutItem, event);
              }}
            >
              <header
                className="flex cursor-grab items-center justify-between gap-2 border-b px-2 py-1.5 active:cursor-grabbing"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", `group:${group.id}`);
                  groups.setDraggedLayoutItem(layoutItem);
                }}
                onDragEnd={() => groups.setDraggedLayoutItem(null)}
                title="Перетащите группу, чтобы изменить порядок"
              >
                <button
                  type="button"
                  className="flex min-w-0 items-center gap-1 text-left text-xs font-semibold"
                  onClick={() => groups.toggleGroup(group.id)}
                >
                  {group.collapsed ? <ChevronRight className="h-3.5 w-3.5 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                  <span className="truncate" title={group.name}>{group.name}</span>
                  <Badge variant="outline" className="h-5 px-1 text-[10px]">{groupCount}</Badge>
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0"
                  onClick={() => groups.deleteGroup(group.id)}
                  title="Удалить группу"
                  aria-label="Удалить группу"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </header>
              <div
                onDragOver={(event) => {
                  if (!groups.draggedColumnId) return;
                  event.preventDefault();
                }}
                onDrop={(event) => {
                  if (!groups.draggedColumnId) return;
                  event.preventDefault();
                  groups.addColumnToGroup(groups.draggedColumnId, group.id);
                  groups.setDraggedColumnId(null);
                  groups.setDraggedLayoutItem(null);
                }}
              >
                {group.collapsed ? (
                  <div className="space-y-1 p-2 text-[11px] leading-4 text-muted-foreground">
                    {columnIds.length ? columnIds.map((stage) => (
                      <div key={stage} className="flex justify-between gap-2">
                        <span className="truncate" title={dealStageLabels[stage]}>{dealStageLabels[stage]}</span>
                        <span>{grouped[stage].length}</span>
                      </div>
                    )) : <div className="break-words text-[10px] leading-4">Перетащите колонки</div>}
                  </div>
                ) : (
                  <div className="grid gap-2 p-2" style={{ gridTemplateColumns: `repeat(${Math.max(columnIds.length, 1)}, minmax(0, 1fr))` }}>
                    {columnIds.length ? columnIds.map((stage) => renderColumn(stage, { groupId: group.id })) : (
                      <div className="min-w-0 break-words rounded-md border border-dashed p-2 text-[10px] leading-4 text-muted-foreground">Перетащите колонки</div>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    );

    function renderColumn(stage: DealStage, options: { layoutItem?: PipelineLayoutItemPreference; groupId?: string } = {}) {
      return (
        <section
          key={stage}
          className={cn(
            "flex min-h-[28rem] min-w-0 flex-col rounded-md border bg-card",
            overStage === stage && "border-primary"
          )}
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            if (!groups.draggedLayoutItem && !groups.draggedColumnId) setOverStage(stage);
          }}
          onDragLeave={() => setOverStage((current) => current === stage ? null : current)}
          onDrop={(event) => {
            event.preventDefault();
            const droppedValue = event.dataTransfer.getData("text/plain") || draggedId || "";

            if (groups.draggedLayoutItem && options.layoutItem) {
              moveLayoutRelative(groups.draggedLayoutItem, options.layoutItem, event);
              return;
            }

            if (groups.draggedColumnId && options.groupId && droppedValue.startsWith("column:")) {
              groups.moveColumnInGroup(groups.draggedColumnId, options.groupId, stage);
              groups.setDraggedColumnId(null);
              groups.setDraggedLayoutItem(null);
              return;
            }

            setDraggedId(null);
            setOverStage(null);
            if (droppedValue && !droppedValue.startsWith("column:") && !droppedValue.startsWith("group:")) void moveDeal(droppedValue, stage);
          }}
        >
          <header
            className="shrink-0 cursor-grab border-b px-1.5 py-2 active:cursor-grabbing"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", `column:${stage}`);
              groups.setDraggedColumnId(stage);
              groups.setDraggedLayoutItem(options.layoutItem ?? null);
            }}
            onDragEnd={() => {
              groups.setDraggedColumnId(null);
              groups.setDraggedLayoutItem(null);
            }}
            title={options.layoutItem ? "Перетащите колонку, чтобы изменить порядок или добавить в группу" : "Перетащите колонку внутри группы или в другую группу"}
          >
            <div className="flex items-center justify-between gap-1 text-[11px] font-semibold leading-4">
              <span className="min-w-0 truncate" title={dealStageLabels[stage]}>{dealStageLabels[stage]}</span>
              <Badge variant="secondary" className="h-5 shrink-0 px-1.5 text-[10px]">{grouped[stage].length}</Badge>
            </div>
          </header>
          <div className="flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-1.5">
            {grouped[stage].length ? grouped[stage].map((deal) => (
              <DealPipelineCompactCard
                key={deal.id}
                deal={deal}
                now={now}
                dragging={draggedId === deal.id}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", deal.id);
                  setDraggedId(deal.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setOverStage(null);
                }}
              />
            )) : (
              <p className="rounded-md border border-dashed p-2 text-[11px] leading-4 text-muted-foreground">Нет сделок</p>
            )}
          </div>
        </section>
      );
    }
  }

  function moveLayoutRelative(dragged: PipelineLayoutItemPreference, target: PipelineLayoutItemPreference, event: React.DragEvent<HTMLElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const dropAfter = event.clientX > rect.left + rect.width / 2;
    const targetIndex = groups.layout.findIndex((item) => sameLayoutItem(item, target));
    const beforeItem = dropAfter ? groups.layout[targetIndex + 1] ?? null : target;

    groups.moveLayoutItem(dragged, beforeItem);
    groups.setDraggedLayoutItem(null);
    groups.setDraggedColumnId(null);
  }
}

function DealPipelineCompactCard({
  deal,
  now,
  dragging,
  onDragStart,
  onDragEnd
}: {
  deal: DealPipelineItem;
  now: string;
  dragging: boolean;
  onDragStart: DragEventHandler<HTMLDivElement>;
  onDragEnd: DragEventHandler<HTMLDivElement>;
}) {
  const overdue = Boolean(deal.nextActionAt && new Date(deal.nextActionAt) < new Date(now) && deal.stage !== "LOST" && deal.stage !== "COMPLETED");

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} className={cn("cursor-grab active:cursor-grabbing", dragging && "opacity-50")}>
      <PipelineItemCard className="space-y-1 p-1.5 text-[11px] leading-4">
        <div className="flex items-start justify-between gap-1">
          <Link href={`/deals/${deal.id}`} className="min-w-0 truncate font-medium hover:underline" title={deal.title}>{deal.title}</Link>
          {overdue ? <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" /> : null}
        </div>
        <div className="truncate text-muted-foreground" title={deal.client.name}>{deal.client.name}</div>
        {deal.designer ? (
          <div className="truncate text-muted-foreground" title={deal.designer.name}>{deal.designer.name}</div>
        ) : null}
        <div className="truncate text-muted-foreground" title={deal.responsible.name}>{deal.responsible.name}</div>
        <div className="flex items-center justify-between gap-1 text-muted-foreground">
          <span className="truncate">{formatMoney(deal.potentialAmount)}</span>
          <span className="truncate">{deal.probability ? dealProbabilityLabels[deal.probability] : "Без %"}</span>
        </div>
        <div className={overdue ? "font-medium text-warning" : "text-muted-foreground"}>{formatRussianDate(deal.nextActionAt)}</div>
        <div className="truncate text-muted-foreground" title={deal.nextActionText ?? "Нет шага"}>
          {deal.nextActionText ?? "Нет шага"}
        </div>
      </PipelineItemCard>
    </div>
  );
}

function sameLayoutItem(left: PipelineLayoutItemPreference, right: PipelineLayoutItemPreference) {
  return left.type === right.type && left.id === right.id;
}

function groupItemsByStage(items: DealPipelineItem[]) {
  return Object.fromEntries(stageOrder.map((stage) => [stage, items.filter((deal) => deal.stage === stage)])) as Record<DealStage, DealPipelineItem[]>;
}

function groupItemsByManager(items: DealPipelineItem[]) {
  const grouped = new Map<string, {
    id: string;
    name: string;
    department: string;
    items: DealPipelineItem[];
  }>();

  for (const item of items) {
    const responsible = item.responsible;
    const group = grouped.get(responsible.id) ?? {
      id: responsible.id,
      name: responsible.name,
      department: responsible.employeeProfile?.departmentId ?? "Без подразделения",
      items: []
    };

    group.items.push(item);
    grouped.set(responsible.id, group);
  }

  return Array.from(grouped.values()).sort((left, right) => left.name.localeCompare(right.name, "ru"));
}

function getVisibleUnitCount(layout: readonly PipelineLayoutItemPreference[], groups: Array<{ id: string; columnIds: string[]; collapsed: boolean }>) {
  return Math.max(1, layout.reduce((total, item) => {
    if (item.type === "column") return total + 1;

    const group = groups.find((candidate) => candidate.id === item.id);
    return total + (group?.collapsed ? 1 : Math.max(group?.columnIds.length ?? 0, 1));
  }, 0));
}
