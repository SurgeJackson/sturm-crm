type TaskHrefParams = {
  recordType?: "TASK" | "TOUCH";
  clientId?: string | null;
  objectId?: string | null;
  dealId?: string | null;
  proposalId?: string | null;
  designerId?: string | null;
  responsibleId?: string | null;
};

export function buildTaskHref(params: TaskHrefParams) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && !(key === "recordType" && value === "TASK")) {
      searchParams.set(key, value);
    }
  }

  const query = searchParams.toString();
  return query ? `/tasks/new?${query}` : "/tasks/new";
}
