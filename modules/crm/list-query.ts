import { paginatedResult } from "@/modules/crm/pagination";

export function sortFromParam<TSort>(value: string | undefined, options: Record<string, TSort>, fallback: TSort) {
  return value && Object.prototype.hasOwnProperty.call(options, value) ? options[value] : fallback;
}

export async function paginatedQuery<TItem, TResult = TItem>({
  page,
  pageSize,
  findRows,
  countRows,
  mapRows
}: {
  page: number;
  pageSize: number;
  findRows: () => Promise<TItem[]>;
  countRows: () => Promise<number>;
  mapRows?: (rows: TItem[]) => Promise<TResult[]> | TResult[];
}) {
  const [rows, total] = await Promise.all([findRows(), countRows()]);
  const items = mapRows ? await mapRows(rows) : (rows as unknown as TResult[]);
  return paginatedResult(items, total, page, pageSize);
}
