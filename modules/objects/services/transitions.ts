import type { ProjectObject } from "@/generated/prisma/client";

export function isFrozenObjectTransition(
  before: Pick<ProjectObject, "stage" | "status">,
  after: Pick<ProjectObject, "stage" | "status">
) {
  return (
    (after.status === "FROZEN" || after.stage === "FROZEN") &&
    before.status !== "FROZEN" &&
    before.stage !== "FROZEN"
  );
}
