import {
  clientSourceLabels,
  clientStatusLabels,
  clientTypeLabels,
  attitudeToSturmLabels,
  changeApprovalLabels,
  commercialProposalStatusLabels,
  dealLossReasonLabels,
  dealProbabilityLabels,
  dealSourceLabels,
  dealStageLabels,
  designerBonusAccrualStatusLabels,
  designerBonusAccrualTypeLabels,
  designerBonusAdjustmentTypeLabels,
  designerBonusAgreementStatusLabels,
  designerBonusAgreementTypeLabels,
  designerBonusAppliesToLabels,
  designerBonusCalculationBaseLabels,
  designerBonusPayoutMethodLabels,
  designerBonusPayoutStatusLabels,
  designerLoyaltyLabels,
  designerPotentialLabels,
  designerProjectSegmentLabels,
  designerRelationshipStageLabels,
  designerRoleLabels,
  designerSourceLabels,
  designerSpecializationLabels,
  influenceLevelLabels,
  influenceTypeLabels,
  objectInterestCategoryLabels,
  objectStageLabels,
  objectStatusLabels,
  objectTypeLabels,
  paymentSourceLabels,
  paymentStatusLabels,
  paymentTypeLabels,
  projectObjectParticipantTypeLabels,
  proposalDeclineReasonLabels,
  recipientTypeLabels,
  taskActionTypeLabels,
  taskAutoRuleLabels,
  taskPriorityLabels,
  taskRecordTypeLabels,
  taskStatusLabels,
  roleLabels
} from "@/lib/constants";

export function toOptions<T extends string>(labels: Record<T, string>) {
  return Object.entries(labels).map(([value, label]) => ({
    value: value as T,
    label: label as string
  }));
}

export const clientTypeOptions = toOptions(clientTypeLabels);
export const roleOptions = toOptions(roleLabels);
export const clientSourceOptions = toOptions(clientSourceLabels);
export const clientStatusOptions = toOptions(clientStatusLabels);
export const designerRoleOptions = toOptions(designerRoleLabels);
export const designerSpecializationOptions = toOptions(designerSpecializationLabels);
export const designerProjectSegmentOptions = toOptions(designerProjectSegmentLabels);
export const designerSourceOptions = toOptions(designerSourceLabels);
export const designerRelationshipStageOptions = toOptions(designerRelationshipStageLabels);
export const designerPotentialOptions = toOptions(designerPotentialLabels);
export const designerLoyaltyOptions = toOptions(designerLoyaltyLabels);
export const objectTypeOptions = toOptions(objectTypeLabels);
export const objectInterestCategoryOptions = toOptions(objectInterestCategoryLabels);
export const objectStageOptions = toOptions(objectStageLabels);
export const objectStatusOptions = toOptions(objectStatusLabels);
export const projectObjectParticipantTypeOptions = toOptions(projectObjectParticipantTypeLabels);
export const influenceLevelOptions = toOptions(influenceLevelLabels);
export const influenceTypeOptions = toOptions(influenceTypeLabels);
export const attitudeToSturmOptions = toOptions(attitudeToSturmLabels);
export const changeApprovalOptions = toOptions(changeApprovalLabels);
export const dealStageOptions = toOptions(dealStageLabels);
export const dealProbabilityOptions = toOptions(dealProbabilityLabels);
export const dealSourceOptions = toOptions(dealSourceLabels);
export const dealLossReasonOptions = toOptions(dealLossReasonLabels);
export const commercialProposalStatusOptions = toOptions(commercialProposalStatusLabels);
export const recipientTypeOptions = toOptions(recipientTypeLabels);
export const proposalDeclineReasonOptions = toOptions(proposalDeclineReasonLabels);
export const designerBonusAgreementTypeOptions = toOptions(designerBonusAgreementTypeLabels);
export const designerBonusCalculationBaseOptions = toOptions(designerBonusCalculationBaseLabels);
export const designerBonusAppliesToOptions = toOptions(designerBonusAppliesToLabels);
export const designerBonusAgreementStatusOptions = toOptions(designerBonusAgreementStatusLabels);
export const paymentTypeOptions = toOptions(paymentTypeLabels);
export const paymentStatusOptions = toOptions(paymentStatusLabels);
export const paymentSourceOptions = toOptions(paymentSourceLabels);
export const designerBonusAccrualTypeOptions = toOptions(designerBonusAccrualTypeLabels);
export const designerBonusAccrualStatusOptions = toOptions(designerBonusAccrualStatusLabels);
export const designerBonusPayoutMethodOptions = toOptions(designerBonusPayoutMethodLabels);
export const designerBonusPayoutStatusOptions = toOptions(designerBonusPayoutStatusLabels);
export const designerBonusAdjustmentTypeOptions = toOptions(designerBonusAdjustmentTypeLabels);
export const taskRecordTypeOptions = toOptions(taskRecordTypeLabels);
export const taskActionTypeOptions = toOptions(taskActionTypeLabels);
export const taskStatusOptions = toOptions(taskStatusLabels);
export const taskPriorityOptions = toOptions(taskPriorityLabels);
export const taskAutoRuleOptions = toOptions(taskAutoRuleLabels);
