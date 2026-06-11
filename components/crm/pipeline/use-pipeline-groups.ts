"use client";

import { useMemo, useState } from "react";
import type { PipelineBoardId, PipelineBoardPreference, PipelineLayoutItemPreference } from "@/lib/pipeline-preferences";
import { sanitizePipelinePreference } from "@/lib/pipeline-preferences";

export function usePipelineGroups({
  board,
  columnIds,
  initialPreference
}: {
  board: PipelineBoardId;
  columnIds: readonly string[];
  initialPreference: PipelineBoardPreference;
}) {
  const [preference, setPreference] = useState(() => sanitizePipelinePreference(initialPreference, columnIds));
  const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
  const [draggedLayoutItem, setDraggedLayoutItem] = useState<PipelineLayoutItemPreference | null>(null);
  const columnSet = useMemo(() => new Set(columnIds), [columnIds]);

  function updatePreference(updater: (current: PipelineBoardPreference) => PipelineBoardPreference) {
    setPreference((current) => {
      const next = sanitizePipelinePreference(updater(current), columnIds);
      void savePipelinePreference(board, next);
      return next;
    });
  }

  function addGroup(name: string) {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const id = `group-${Date.now().toString(36)}`;

    updatePreference((current) => ({
      groups: [
        ...current.groups,
        {
          id,
          name: trimmedName,
          columnIds: [],
          collapsed: false
        }
      ],
      layout: [...current.layout, { type: "group", id }]
    }));
  }

  function toggleGroup(groupId: string) {
    updatePreference((current) => ({
      ...current,
      groups: current.groups.map((group) => group.id === groupId ? { ...group, collapsed: !group.collapsed } : group)
    }));
  }

  function deleteGroup(groupId: string) {
    updatePreference((current) => ({
      groups: current.groups.filter((group) => group.id !== groupId),
      layout: current.layout.flatMap((item) => {
        if (item.type !== "group" || item.id !== groupId) return [item];

        const group = current.groups.find((candidate) => candidate.id === groupId);
        return group?.columnIds.map((columnId) => ({ type: "column" as const, id: columnId })) ?? [];
      })
    }));
  }

  function addColumnToGroup(columnId: string | null, groupId: string, beforeColumnId?: string) {
    if (!columnId || !columnSet.has(columnId)) return;

    updatePreference((current) => ({
      groups: current.groups.map((group) => ({
        ...group,
        columnIds: group.id === groupId
          ? insertColumn(group.columnIds.filter((id) => id !== columnId), columnId, beforeColumnId)
          : group.columnIds.filter((id) => id !== columnId)
      })),
      layout: current.layout.filter((item) => item.type !== "column" || item.id !== columnId)
    }));
  }

  function removeColumnFromGroups(columnId: string | null) {
    if (!columnId || !columnSet.has(columnId)) return;

    updatePreference((current) => ({
      groups: current.groups.map((group) => ({
        ...group,
        columnIds: group.columnIds.filter((id) => id !== columnId)
      })),
      layout: current.layout.some((item) => item.type === "column" && item.id === columnId)
        ? current.layout
        : [...current.layout, { type: "column", id: columnId }]
    }));
  }

  function moveLayoutItem(item: PipelineLayoutItemPreference | null, beforeItem: PipelineLayoutItemPreference | null) {
    if (!item) return;

    updatePreference((current) => {
      const withoutDragged = current.layout.filter((candidate) => !sameLayoutItem(candidate, item));
      const nextLayout = beforeItem
        ? insertLayoutItem(withoutDragged, item, beforeItem)
        : [...withoutDragged, item];

      return {
        ...current,
        layout: nextLayout
      };
    });
  }

  function moveColumnInGroup(columnId: string | null, groupId: string, beforeColumnId: string | null) {
    if (!columnId || !columnSet.has(columnId)) return;

    updatePreference((current) => ({
      ...current,
      groups: current.groups.map((group) => {
        if (group.id !== groupId || !group.columnIds.includes(columnId)) return group;

        return {
          ...group,
          columnIds: insertColumn(group.columnIds.filter((id) => id !== columnId), columnId, beforeColumnId ?? undefined)
        };
      })
    }));
  }

  function resetPreference() {
    const next = sanitizePipelinePreference({ groups: [], layout: [] }, columnIds);
    setPreference(next);
    void fetch(`/api/pipeline-preferences/${board}`, { method: "DELETE" });
  }

  return {
    groups: preference.groups,
    layout: preference.layout,
    draggedColumnId,
    draggedLayoutItem,
    setDraggedColumnId,
    setDraggedLayoutItem,
    addGroup,
    toggleGroup,
    deleteGroup,
    addColumnToGroup,
    removeColumnFromGroups,
    moveLayoutItem,
    moveColumnInGroup,
    resetPreference
  };
}

function sameLayoutItem(left: PipelineLayoutItemPreference, right: PipelineLayoutItemPreference) {
  return left.type === right.type && left.id === right.id;
}

function insertLayoutItem(
  items: PipelineLayoutItemPreference[],
  item: PipelineLayoutItemPreference,
  beforeItem: PipelineLayoutItemPreference
) {
  const beforeIndex = items.findIndex((candidate) => sameLayoutItem(candidate, beforeItem));
  if (beforeIndex === -1) return [...items, item];

  return [
    ...items.slice(0, beforeIndex),
    item,
    ...items.slice(beforeIndex)
  ];
}

function insertColumn(columnIds: string[], columnId: string, beforeColumnId?: string) {
  const beforeIndex = beforeColumnId ? columnIds.indexOf(beforeColumnId) : -1;
  if (beforeIndex === -1) return [...columnIds, columnId];

  return [
    ...columnIds.slice(0, beforeIndex),
    columnId,
    ...columnIds.slice(beforeIndex)
  ];
}

async function savePipelinePreference(board: PipelineBoardId, preference: PipelineBoardPreference) {
  await fetch(`/api/pipeline-preferences/${board}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ preference })
  });
}
