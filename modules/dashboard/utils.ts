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
