import { describe, expect, it } from "vitest";
import {
  attitudeToSturmLabels,
  changeApprovalLabels,
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
  projectObjectParticipantTypeLabels
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
});
