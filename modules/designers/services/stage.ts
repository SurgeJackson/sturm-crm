import type { Designer, DesignerRelationshipStage } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { writeEntityAuditLog } from "@/modules/crm/audit-helpers";
import { syncDesignerDiscipline } from "@/modules/crm-discipline/entity-sync";

export async function changeDesignerStage(
  id: string,
  before: Designer,
  stage: DesignerRelationshipStage,
  userId: string
) {
  const after = await prisma.$transaction(async (tx) => {
    const updated = await tx.designer.update({
      where: { id },
      data: { relationshipStage: stage }
    });

    await writeEntityAuditLog({
      entityType: "DESIGNER",
      entityId: id,
      action: "CHANGE_RELATIONSHIP_STAGE",
      userId,
      before: { relationshipStage: before.relationshipStage },
      after: { relationshipStage: updated.relationshipStage },
      client: tx
    });

    return updated;
  });

  await syncDesignerDiscipline(id, userId);
  return after;
}
