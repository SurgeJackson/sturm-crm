import { dealStageVariant, designerPotentialVariant, objectStatusVariant, proposalStatusVariant, taskStatusVariant } from "@/components/crm/status-variants";
import { Badge } from "@/components/ui/badge";
import {
  clientStatusLabels,
  clientTypeLabels,
  commercialProposalStatusLabels,
  dealProbabilityLabels,
  dealProbabilityPercent,
  dealSourceLabels,
  dealStageLabels,
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerRelationshipStageLabels,
  objectStageLabels,
  objectStatusLabels,
  objectTypeLabels,
  taskActionTypeLabels,
  taskRecordTypeLabels,
  taskStatusLabels
} from "@/lib/constants";
import { formatMoney } from "@/utils/money";

export function ClientHeaderBadges({
  status,
  clientType
}: {
  status: keyof typeof clientStatusLabels;
  clientType: keyof typeof clientTypeLabels;
}) {
  return (
    <>
      <Badge variant={status === "ARCHIVED" ? "outline" : "secondary"}>{clientStatusLabels[status]}</Badge>
      <Badge variant="outline">{clientTypeLabels[clientType]}</Badge>
    </>
  );
}

export function DealHeaderBadges({
  stage,
  probability,
  source
}: {
  stage: keyof typeof dealStageLabels;
  probability: keyof typeof dealProbabilityLabels | null;
  source: keyof typeof dealSourceLabels;
}) {
  return (
    <>
      <Badge variant={dealStageVariant(stage)}>{dealStageLabels[stage]}</Badge>
      {probability ? <Badge variant="outline">{dealProbabilityLabels[probability]} · {dealProbabilityPercent[probability]}%</Badge> : null}
      <Badge variant="outline">{dealSourceLabels[source]}</Badge>
    </>
  );
}

export function DesignerHeaderBadges({
  relationshipStage,
  potential,
  loyalty
}: {
  relationshipStage: keyof typeof designerRelationshipStageLabels;
  potential: keyof typeof designerPotentialLabels;
  loyalty: keyof typeof designerLoyaltyLabels;
}) {
  return (
    <>
      <Badge variant="secondary">{designerRelationshipStageLabels[relationshipStage]}</Badge>
      <Badge variant={designerPotentialVariant(potential)}>{designerPotentialLabels[potential]}</Badge>
      <Badge variant="outline">{designerLoyaltyLabels[loyalty]}</Badge>
    </>
  );
}

export function ObjectHeaderBadges({
  objectType,
  stage,
  status
}: {
  objectType: keyof typeof objectTypeLabels;
  stage: keyof typeof objectStageLabels;
  status: keyof typeof objectStatusLabels;
}) {
  return (
    <>
      <Badge variant="outline">{objectTypeLabels[objectType]}</Badge>
      <Badge variant="outline">{objectStageLabels[stage]}</Badge>
      <Badge variant={objectStatusVariant(status)}>{objectStatusLabels[status]}</Badge>
    </>
  );
}

export function ProposalHeaderBadges({
  status,
  version,
  amount,
  canViewAmount = true
}: {
  status: keyof typeof commercialProposalStatusLabels;
  version: number;
  amount?: number | null;
  canViewAmount?: boolean;
}) {
  return (
    <>
      <Badge variant={proposalStatusVariant(status)}>{commercialProposalStatusLabels[status]}</Badge>
      <Badge variant="outline">v{version}</Badge>
      <Badge variant="outline">{canViewAmount ? formatMoney(amount, "0 ₽") : "Скрыто"}</Badge>
    </>
  );
}

export function TaskHeaderBadges({
  recordType,
  actionType,
  status
}: {
  recordType: keyof typeof taskRecordTypeLabels;
  actionType: keyof typeof taskActionTypeLabels;
  status: keyof typeof taskStatusLabels;
}) {
  return (
    <>
      <Badge variant="outline">{taskRecordTypeLabels[recordType]}</Badge>
      <Badge variant="outline">{taskActionTypeLabels[actionType]}</Badge>
      <Badge variant={taskStatusVariant(status)}>{taskStatusLabels[status]}</Badge>
    </>
  );
}
