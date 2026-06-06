import { prisma } from "@/lib/prisma";

export function groupRowsToCountMap<T extends Record<string, unknown>>(
  rows: Array<T & { _count: { _all: number } }>,
  key: keyof T
) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = row[key];
    if (value == null) return acc;
    acc[String(value)] = row._count._all;
    return acc;
  }, {});
}

export function uniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))));
}

export async function getUserNameMap(ids: string[]) {
  const unique = uniqueIds(ids);
  if (unique.length === 0) return new Map<string, string>();

  const users = await prisma.user.findMany({
    where: { id: { in: unique } },
    select: { id: true, name: true }
  });

  return new Map(users.map((user) => [user.id, user.name]));
}

export function namedCountRows(
  rows: Array<{ responsibleId: string; _count: { _all: number } }>,
  names: Map<string, string>,
  fallback = "Не назначен"
) {
  return rows
    .map((row) => ({
      name: names.get(row.responsibleId) ?? fallback,
      count: row._count._all
    }))
    .sort((a, b) => b.count - a.count);
}

export function namedAmountRows<T extends { responsibleId: string }>(
  rows: T[],
  names: Map<string, string>,
  amount: (row: T) => number | null | undefined,
  fallback = "Не назначен"
) {
  return rows
    .map((row) => ({
      name: names.get(row.responsibleId) ?? fallback,
      amount: amount(row) ?? 0
    }))
    .sort((a, b) => b.amount - a.amount);
}
