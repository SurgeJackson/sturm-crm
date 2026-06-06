export function pageFromParam(value?: string) {
  return Math.max(Number(value ?? "1") || 1, 1);
}

export function paginatedResult<T>(items: T[], total: number, page: number, pageSize: number) {
  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(Math.ceil(total / pageSize), 1)
  };
}
