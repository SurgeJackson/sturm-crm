import {
  clientSourceLabels,
  clientStatusLabels,
  clientTypeLabels,
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerProjectSegmentLabels,
  designerRelationshipStageLabels,
  designerRoleLabels,
  designerSourceLabels,
  designerSpecializationLabels
} from "@/lib/constants";

export function toOptions<T extends string>(labels: Record<T, string>) {
  return Object.entries(labels).map(([value, label]) => ({
    value: value as T,
    label: label as string
  }));
}

export const clientTypeOptions = toOptions(clientTypeLabels);
export const clientSourceOptions = toOptions(clientSourceLabels);
export const clientStatusOptions = toOptions(clientStatusLabels);
export const designerRoleOptions = toOptions(designerRoleLabels);
export const designerSpecializationOptions = toOptions(designerSpecializationLabels);
export const designerProjectSegmentOptions = toOptions(designerProjectSegmentLabels);
export const designerSourceOptions = toOptions(designerSourceLabels);
export const designerRelationshipStageOptions = toOptions(designerRelationshipStageLabels);
export const designerPotentialOptions = toOptions(designerPotentialLabels);
export const designerLoyaltyOptions = toOptions(designerLoyaltyLabels);
