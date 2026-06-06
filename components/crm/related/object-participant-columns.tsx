import type { ParticipantColumn } from "@/components/crm/related/object-participant-table";
import {
  attitudeToSturmLabels,
  changeApprovalLabels,
  influenceLevelLabels,
  influenceTypeLabels
} from "@/lib/constants";

function fieldValue(value?: string | null) {
  return value || "Нет данных";
}

export const purchaseInfluencerColumns: ParticipantColumn[] = [
  { head: "Роль", render: (participant) => participant.role },
  { head: "Компания", render: (participant) => fieldValue(participant.company) },
  { head: "Уровень", render: (participant) => participant.influenceLevel ? influenceLevelLabels[participant.influenceLevel] : "Нет данных" },
  { head: "Тип влияния", render: (participant) => participant.influenceType ? influenceTypeLabels[participant.influenceType] : "Нет данных" },
  { head: "Отношение", render: (participant) => participant.attitudeToSturm ? attitudeToSturmLabels[participant.attitudeToSturm] : "Нет данных" },
  { head: "Что важно", render: (participant) => fieldValue(participant.decisionFactors) }
];

export const implementationContactColumns: ParticipantColumn[] = [
  { head: "Роль", render: (participant) => participant.role },
  { head: "Компания", render: (participant) => fieldValue(participant.company) },
  { head: "Зона", render: (participant) => fieldValue(participant.responsibilityZone) },
  { head: "Согласует", render: (participant) => participant.canApproveChanges ? changeApprovalLabels[participant.canApproveChanges] : "Нет данных" },
  { head: "Когда подключать", render: (participant) => fieldValue(participant.whenToInvolve) }
];
