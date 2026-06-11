import type { Prisma } from "@/generated/prisma/client";

export type PipelineBoardId = "deals" | "designers";

export type PipelineColumnGroupPreference = {
  id: string;
  name: string;
  columnIds: string[];
  collapsed: boolean;
};

export type PipelineLayoutItemPreference =
  | { type: "column"; id: string }
  | { type: "group"; id: string };

export type PipelineBoardPreference = {
  groups: PipelineColumnGroupPreference[];
  layout: PipelineLayoutItemPreference[];
};

type UserProfileSettings = {
  pipeline?: Partial<Record<PipelineBoardId, PipelineBoardPreference>>;
};

export function parseUserProfileSettings(value: Prisma.JsonValue | null | undefined): UserProfileSettings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return value as UserProfileSettings;
}

export function getPipelinePreference(
  settings: Prisma.JsonValue | null | undefined,
  board: PipelineBoardId,
  validColumnIds: readonly string[]
) {
  const profileSettings = parseUserProfileSettings(settings);
  return sanitizePipelinePreference(profileSettings.pipeline?.[board], validColumnIds);
}

export function mergePipelinePreference(
  settings: Prisma.JsonValue | null | undefined,
  board: PipelineBoardId,
  preference: PipelineBoardPreference,
  validColumnIds: readonly string[]
): Prisma.InputJsonValue {
  const profileSettings = parseUserProfileSettings(settings);
  const pipeline = profileSettings.pipeline ?? {};

  return {
    ...profileSettings,
    pipeline: {
      ...pipeline,
      [board]: sanitizePipelinePreference(preference, validColumnIds)
    }
  } satisfies Prisma.InputJsonObject;
}

export function sanitizePipelinePreference(
  preference: PipelineBoardPreference | null | undefined,
  validColumnIds: readonly string[]
): PipelineBoardPreference {
  const validColumns = new Set(validColumnIds);
  const usedColumns = new Set<string>();
  const usedGroups = new Set<string>();
  const usedLayoutColumns = new Set<string>();
  const groups = Array.isArray(preference?.groups) ? preference.groups : [];
  const sanitizedGroups = groups
    .map((group, index) => {
      const columnIds = Array.isArray(group.columnIds)
        ? group.columnIds.filter((columnId) => {
          if (!validColumns.has(columnId) || usedColumns.has(columnId)) return false;
          usedColumns.add(columnId);
          return true;
        })
        : [];

      return {
        id: typeof group.id === "string" && group.id ? group.id : `group-${index + 1}`,
        name: typeof group.name === "string" && group.name.trim() ? group.name.trim() : `Группа ${index + 1}`,
        columnIds,
        collapsed: Boolean(group.collapsed)
      };
    })
    .filter((group) => group.columnIds.length > 0 || group.name);

  const groupIds = new Set(sanitizedGroups.map((group) => group.id));
  const groupedColumns = new Set(sanitizedGroups.flatMap((group) => group.columnIds));
  const layoutSource = Array.isArray(preference?.layout) ? preference.layout : [];
  const layout: PipelineLayoutItemPreference[] = [];

  for (const item of layoutSource) {
    if (!item || typeof item !== "object") continue;

    if (item.type === "group" && groupIds.has(item.id) && !usedGroups.has(item.id)) {
      usedGroups.add(item.id);
      layout.push({ type: "group", id: item.id });
    }

    if (item.type === "column" && validColumns.has(item.id) && !groupedColumns.has(item.id) && !usedLayoutColumns.has(item.id)) {
      usedLayoutColumns.add(item.id);
      layout.push({ type: "column", id: item.id });
    }
  }

  for (const columnId of validColumnIds) {
    if (!groupedColumns.has(columnId) && !usedLayoutColumns.has(columnId)) {
      usedLayoutColumns.add(columnId);
      layout.push({ type: "column", id: columnId });
    }
  }

  for (const group of sanitizedGroups) {
    if (!usedGroups.has(group.id)) {
      usedGroups.add(group.id);
      layout.push({ type: "group", id: group.id });
    }
  }

  return { groups: sanitizedGroups, layout };
}
