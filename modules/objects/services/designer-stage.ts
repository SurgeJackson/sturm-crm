import type { DesignerRelationshipStage, ProjectObject } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog } from "@/modules/crm/audit-helpers";
import { syncDesignerDiscipline } from "@/modules/crm-discipline/service";

export async function moveDesignerToFirstObjectReceived(
  object: ProjectObject & { designer: { id: string; relationshipStage: DesignerRelationshipStage } | null },
  userId: string
) {
  if (!object.designer) return null;

  await prisma.$transaction(async (tx) => {
    const beforeStage = object.designer?.relationshipStage;

    await tx.designer.update({
      where: { id: object.designer!.id },
      data: { relationshipStage: "FIRST_OBJECT_RECEIVED" }
    });

    await writeEntityAuditLog({
      entityType: "DESIGNER",
      entityId: object.designer!.id,
      action: "CHANGE_RELATIONSHIP_STAGE",
      userId,
      before: { relationshipStage: beforeStage },
      after: { relationshipStage: "FIRST_OBJECT_RECEIVED" },
      client: tx
    });
  });

  await syncDesignerDiscipline(object.designer.id, userId);
  return object.designer.id;
}
