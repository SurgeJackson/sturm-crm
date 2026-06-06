import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { ObjectHeaderBadges } from "@/components/crm/detail-header-badges";
import {
  ActionPromptCard,
  EntityDetailShell
} from "@/components/crm/detail-page";
import { ObjectDetailTabs } from "@/components/crm/detail-tabs/object-detail-tabs";
import { Button } from "@/components/ui/button";
import { getAuditLogs } from "@/lib/audit-log";
import {
  archiveProjectObjectAction,
  archiveProjectObjectParticipantAction,
  moveDesignerToFirstObjectReceivedAction
} from "@/modules/objects/actions";
import { getProjectObjectForUser } from "@/modules/objects/queries";
import { canArchiveRecord, canCreateTask, canEditRecord, canManageObjectParticipants } from "@/permissions";

type ObjectPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    saved?: string;
    archived?: string;
    participantSaved?: string;
    participantArchived?: string;
    designerStage?: string;
    error?: string;
  }>;
};

const designerStageOrder = [
  "NEW_CONTACT",
  "FIRST_CONTACT",
  "INTERESTED",
  "INVITED_TO_SHOWROOM",
  "MEETING_DONE",
  "PRESENTATION_DONE",
  "TERMS_DISCUSSING",
  "IN_DEVELOPMENT",
  "FIRST_OBJECT_RECEIVED",
  "ACTIVE_PARTNER",
  "KEY_PARTNER",
  "SLEEPING",
  "LOST_OR_IRRELEVANT"
] as const;

type DesignerStageOrderValue = (typeof designerStageOrder)[number];

function isDesignerStageOrderValue(stage: string): stage is DesignerStageOrderValue {
  return designerStageOrder.includes(stage as DesignerStageOrderValue);
}

function shouldOfferDesignerStageUpdate(stage?: string) {
  if (!stage) return false;
  if (!isDesignerStageOrderValue(stage)) return false;
  const current = designerStageOrder.indexOf(stage);
  const target = designerStageOrder.indexOf("FIRST_OBJECT_RECEIVED");
  return current < target;
}

export default async function ObjectPage({ params, searchParams }: ObjectPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const query = await searchParams;
  const [projectObject, auditLogs] = await Promise.all([
    getProjectObjectForUser(id, user),
    getAuditLogs("OBJECT", id)
  ]);
  const archiveAction = archiveProjectObjectAction.bind(null, id);
  const moveDesignerStageAction = moveDesignerToFirstObjectReceivedAction.bind(null, id);
  const archiveParticipantAction = (participantId: string) => archiveProjectObjectParticipantAction.bind(null, id, participantId);
  const canManageParticipants = canManageObjectParticipants(user, projectObject);

  return (
    <EntityDetailShell
      title={projectObject.title}
      badges={<ObjectHeaderBadges objectType={projectObject.objectType} stage={projectObject.stage} status={projectObject.status} />}
      listHref="/objects"
      editHref={`/objects/${id}/edit`}
      canEdit={canEditRecord(user, projectObject)}
      archiveAction={archiveAction}
      canArchive={canArchiveRecord(user, projectObject) && !projectObject.archivedAt}
      notices={[
        { show: Boolean(query.saved), message: "Объект сохранен." },
        { show: Boolean(query.archived), message: "Объект архивирован." },
        { show: Boolean(query.participantSaved), message: "Участник сохранен." },
        { show: Boolean(query.participantArchived), message: "Участник архивирован." },
        { show: Boolean(query.designerStage), message: "Этап дизайнера обновлен." },
        { show: Boolean(query.error), tone: "destructive", message: "Действие недоступно или данные не найдены." }
      ]}
      discipline={{
        entityType: "OBJECT",
        entityId: projectObject.id,
        editHref: `/objects/${id}/edit`,
        returnTo: `/objects/${id}`,
        violations: projectObject.crmViolations,
        user
      }}
    >

      {projectObject.designer && shouldOfferDesignerStageUpdate(projectObject.designer.relationshipStage) ? (
        <ActionPromptCard
          message={
            <>
              Этот дизайнер передал объект. Можно перевести его на этап “Первый объект получен”.
            </>
          }
          action={
            <form action={moveDesignerStageAction}>
              <Button type="submit" variant="secondary">Перевести этап</Button>
            </form>
          }
        />
      ) : null}

      <ObjectDetailTabs
        objectId={id}
        projectObject={projectObject}
        auditLogs={auditLogs}
        canCreateTasks={canCreateTask(user)}
        canManageParticipants={canManageParticipants}
        archiveParticipantAction={archiveParticipantAction}
      />
    </EntityDetailShell>
  );
}
