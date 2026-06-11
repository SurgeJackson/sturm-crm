"use client";

import Link from "next/link";
import type { DragEventHandler } from "react";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Plus, RotateCcw, Trash2 } from "lucide-react";
import type { DesignerRelationshipStage } from "@/generated/prisma/client";
import { PipelineItemCard } from "@/components/crm/pipeline/pipeline-item-card";
import { designerPotentialVariant } from "@/components/crm/status-variants";
import { usePipelineGroups } from "@/components/crm/pipeline/use-pipeline-groups";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { designerLoyaltyLabels, designerPotentialLabels, designerRelationshipStageLabels } from "@/lib/constants";
import type { PipelineBoardPreference, PipelineLayoutItemPreference } from "@/lib/pipeline-preferences";
import { designerRelationshipStageOptions } from "@/modules/crm/options";
import type { getDesignerPipeline } from "@/modules/designers/queries";
import { formatRussianDate } from "@/utils/date";
import { cn } from "@/lib/utils";

type DesignerPipelineItem = Awaited<ReturnType<typeof getDesignerPipeline>>[number];

const stageOrder = designerRelationshipStageOptions.map((stage) => stage.value) as DesignerRelationshipStage[];

export function DesignerPipelineBoard({
  designers,
  now,
  initialPreference
}: {
  designers: DesignerPipelineItem[];
  now: string;
  initialPreference: PipelineBoardPreference;
}) {
  const [items, setItems] = useState(designers);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DesignerRelationshipStage | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [groupByManager, setGroupByManager] = useState(false);
  const [collapsedManagers, setCollapsedManagers] = useState<string[]>([]);
  const groups = usePipelineGroups({ board: "designers", columnIds: stageOrder, initialPreference });

  const managerGroups = useMemo(
    () => groupItemsByManager(items),
    [items]
  );

  function toggleManagerGrouping() {
    const enabled = !groupByManager;
    setGroupByManager(enabled);
    if (enabled) setCollapsedManagers(managerGroups.slice(1).map((manager) => manager.id));
  }

  async function moveDesigner(designerId: string, relationshipStage: DesignerRelationshipStage) {
    const previousItems = items;
    const designer = previousItems.find((item) => item.id === designerId);
    if (!designer || designer.relationshipStage === relationshipStage) return;

    setMessage(null);
    setItems((current) => current.map((item) => item.id === designerId ? { ...item, relationshipStage } : item));

    const response = await fetch(`/api/designers/${designerId}/relationship-stage`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ relationshipStage })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null) as { message?: string } | null;
      setItems(previousItems);
      setMessage(data?.message ?? "Не удалось изменить стадию дизайнера");
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

  function renderKanban(boardItems: DesignerPipelineItem[]) {
    const grouped = groupItemsByStage(boardItems);

    return (
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${getVisibleUnitCount(groups.layout, groups.groups)}, minmax(0, 1fr))` }}>
        {groups.layout.map((layoutItem) => {
          if (layoutItem.type === "column") return renderColumn(layoutItem.id as DesignerRelationshipStage, { layoutItem });

          const group = groups.groups.find((candidate) => candidate.id === layoutItem.id);
          if (!group) return null;

          const columnIds = group.columnIds.filter((columnId): columnId is DesignerRelationshipStage => stageOrder.includes(columnId as DesignerRelationshipStage));
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
                        <span className="truncate" title={designerRelationshipStageLabels[stage]}>{designerRelationshipStageLabels[stage]}</span>
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

    function renderColumn(stage: DesignerRelationshipStage, options: { layoutItem?: PipelineLayoutItemPreference; groupId?: string } = {}) {
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
            if (droppedValue && !droppedValue.startsWith("column:") && !droppedValue.startsWith("group:")) void moveDesigner(droppedValue, stage);
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
              <span className="min-w-0 truncate" title={designerRelationshipStageLabels[stage]}>{designerRelationshipStageLabels[stage]}</span>
              <Badge variant="outline" className="h-5 shrink-0 px-1.5 text-[10px]">{grouped[stage].length}</Badge>
            </div>
          </header>
          <div className="flex-1 space-y-1.5 overflow-y-auto overscroll-contain p-1.5">
            {grouped[stage].length ? grouped[stage].map((designer) => (
              <DesignerPipelineCompactCard
                key={designer.id}
                designer={designer}
                now={now}
                dragging={draggedId === designer.id}
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", designer.id);
                  setDraggedId(designer.id);
                }}
                onDragEnd={() => {
                  setDraggedId(null);
                  setOverStage(null);
                }}
              />
            )) : (
              <p className="rounded-md border border-dashed p-2 text-[11px] leading-4 text-muted-foreground">Нет дизайнеров</p>
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

function DesignerPipelineCompactCard({
  designer,
  now,
  dragging,
  onDragStart,
  onDragEnd
}: {
  designer: DesignerPipelineItem;
  now: string;
  dragging: boolean;
  onDragStart: DragEventHandler<HTMLDivElement>;
  onDragEnd: DragEventHandler<HTMLDivElement>;
}) {
  const overdue = Boolean(designer.nextStepAt && new Date(designer.nextStepAt) < new Date(now));

  return (
    <div draggable onDragStart={onDragStart} onDragEnd={onDragEnd} className={cn("cursor-grab active:cursor-grabbing", dragging && "opacity-50")}>
      <PipelineItemCard className="space-y-1 p-1.5 text-[11px] leading-4">
        <Link href={`/designers/${designer.id}`} className="block truncate font-medium hover:underline" title={designer.name}>{designer.name}</Link>
        <div className="truncate text-muted-foreground" title={designer.studio ?? designer.responsible.name}>
          {designer.studio ?? designer.responsible.name}
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant={designerPotentialVariant(designer.potential)} className="h-5 px-1 text-[10px]">{designerPotentialLabels[designer.potential]}</Badge>
          <Badge variant="outline" className="h-5 px-1 text-[10px]">{designerLoyaltyLabels[designer.loyalty]}</Badge>
        </div>
        <div className={overdue ? "font-medium text-destructive" : "text-muted-foreground"}>
          {formatRussianDate(designer.nextStepAt)}
        </div>
        <div className="truncate text-muted-foreground" title={designer.nextStepText ?? "Нет шага"}>
          {designer.nextStepText ?? "Нет шага"}
        </div>
      </PipelineItemCard>
    </div>
  );
}

function sameLayoutItem(left: PipelineLayoutItemPreference, right: PipelineLayoutItemPreference) {
  return left.type === right.type && left.id === right.id;
}

function groupItemsByStage(items: DesignerPipelineItem[]) {
  return Object.fromEntries(stageOrder.map((stage) => [stage, items.filter((designer) => designer.relationshipStage === stage)])) as Record<DesignerRelationshipStage, DesignerPipelineItem[]>;
}

function groupItemsByManager(items: DesignerPipelineItem[]) {
  const grouped = new Map<string, {
    id: string;
    name: string;
    department: string;
    items: DesignerPipelineItem[];
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
