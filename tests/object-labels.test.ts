import { describe, expect, it } from "vitest";
import {
  attitudeToSturmLabels,
  changeApprovalLabels,
  commercialProposalStatusLabels,
  dealLossReasonLabels,
  dealProbabilityLabels,
  dealProbabilityPercent,
  dealSourceLabels,
  dealStageLabels,
  influenceLevelLabels,
  influenceTypeLabels,
  objectInterestCategoryLabels,
  objectStageLabels,
  objectStatusLabels,
  objectTypeLabels,
  proposalDeclineReasonLabels,
  projectObjectParticipantTypeLabels,
  recipientTypeLabels,
  taskActionTypeLabels,
  taskAutoRuleLabels,
  taskPriorityLabels,
  taskRecordTypeLabels,
  taskStatusLabels
} from "../lib/constants";

describe("project object labels", () => {
  it("contains Russian labels for Stage 3 object enums", () => {
    expect(objectTypeLabels.HOTEL).toBe("Гостиница");
    expect(objectInterestCategoryLabels.SHOWER_SYSTEMS).toBe("Душевые системы");
    expect(objectStageLabels.CALCULATION).toBe("Расчет");
    expect(objectStatusLabels.FROZEN).toBe("Заморожен");
  });

  it("contains labels for both participant types and conditional fields", () => {
    expect(projectObjectParticipantTypeLabels.PURCHASE_INFLUENCER).toBe("Влияет на решение о закупке");
    expect(projectObjectParticipantTypeLabels.IMPLEMENTATION_CONTACT).toBe("Контактное лицо реализации");
    expect(influenceLevelLabels.HIGH).toBe("Высокий");
    expect(influenceTypeLabels.FINAL_DECISION).toBe("Финальное решение");
    expect(attitudeToSturmLabels.UNKNOWN).toBe("Неизвестно");
    expect(changeApprovalLabels.PARTIALLY).toBe("Частично");
  });

  it("contains Russian labels for Stage 4 deal enums", () => {
    expect(dealStageLabels.PROPOSAL_IN_PROGRESS).toBe("КП в работе");
    expect(dealStageLabels.LOST).toBe("Проиграно");
    expect(dealProbabilityLabels.VERY_HIGH).toBe("Очень высокая");
    expect(dealProbabilityPercent.VERY_HIGH).toBe(90);
    expect(dealSourceLabels.COMMERCIAL_PROJECT).toBe("Коммерческий проект");
    expect(dealLossReasonLabels.PROJECT_FROZEN).toBe("Проект заморожен");
  });

  it("contains Russian labels for Stage 5 proposal enums", () => {
    expect(commercialProposalStatusLabels.CLIENT_THINKING).toBe("Клиент думает");
    expect(commercialProposalStatusLabels.NEEDS_RECALCULATION).toBe("Требуется пересчет");
    expect(recipientTypeLabels.PURCHASE_INFLUENCER).toBe("Влияющий на закупку");
    expect(proposalDeclineReasonLabels.DESIGNER_NOT_SUPPORT).toBe("Дизайнер не поддержал");
  });

  it("contains Russian labels for Stage 6 task and touch enums", () => {
    expect(taskRecordTypeLabels.TOUCH).toBe("Касание");
    expect(taskActionTypeLabels.SHOWROOM_MEETING).toBe("Встреча в шоуруме");
    expect(taskStatusLabels.NEEDS_NEXT_STEP).toBe("Нужен следующий шаг");
    expect(taskPriorityLabels.URGENT).toBe("Срочный");
    expect(taskAutoRuleLabels.DESIGNER_REACTIVATION).toBe("Реактивация дизайнера");
  });
});
