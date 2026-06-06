export type DisciplineSyncResult = { created: number; resolved: number; active: number };
export type DisciplineCheckTotals = DisciplineSyncResult & { checked: number };

export async function processCursorBatches<T extends { id: string }>(
  fetchBatch: (cursorId?: string) => Promise<T[]>,
  mapper: (item: T) => Promise<DisciplineSyncResult>
): Promise<DisciplineCheckTotals> {
  const totals: DisciplineCheckTotals = { checked: 0, created: 0, resolved: 0, active: 0 };
  let cursorId: string | undefined;

  for (;;) {
    const batch = await fetchBatch(cursorId);
    if (batch.length === 0) return totals;

    const results = await Promise.all(batch.map(mapper));
    for (const result of results) {
      totals.checked += 1;
      totals.created += result.created;
      totals.resolved += result.resolved;
      totals.active += result.active;
    }

    cursorId = batch.at(-1)?.id;
    if (!cursorId) return totals;
  }
}
