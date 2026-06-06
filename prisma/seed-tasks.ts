import type { PrismaClient } from "../generated/prisma/client";
import { offsetDate } from "./seed-support";

export async function seedTasks(prisma: PrismaClient, now: Date, year: number) {
  await prisma.taskActivity.upsert({
    where: { id: "seed_task_proposal_followup" },
    update: {
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: `Связаться по КП КП-${year}-0001`,
      description: "Проверить реакцию клиента после отправки КП",
      status: "NEW",
      priority: "HIGH",
      objectId: "seed_project_object_apartments",
      dealId: "seed_deal_apartments_sanitary",
      proposalId: "seed_proposal_sanitary_v1",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, 2),
      completedAt: null,
      result: null,
      nextStepText: null,
      nextStepAt: null,
      responsibleId: "seed_owner",
      isAutoCreated: true,
      autoRule: "PROPOSAL_FOLLOW_UP",
      archivedAt: null,
      notes: "Seed follow-up по отправленному КП"
    },
    create: {
      id: "seed_task_proposal_followup",
      recordType: "TASK",
      actionType: "FOLLOW_UP",
      title: `Связаться по КП КП-${year}-0001`,
      description: "Проверить реакцию клиента после отправки КП",
      status: "NEW",
      priority: "HIGH",
      objectId: "seed_project_object_apartments",
      dealId: "seed_deal_apartments_sanitary",
      proposalId: "seed_proposal_sanitary_v1",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, 2),
      responsibleId: "seed_owner",
      createdById: "seed_owner",
      isAutoCreated: true,
      autoRule: "PROPOSAL_FOLLOW_UP",
      archivedAt: null,
      notes: "Seed follow-up по отправленному КП"
    }
  });

  await prisma.taskActivity.upsert({
    where: { id: "seed_task_overdue_deal" },
    update: {
      recordType: "TASK",
      actionType: "CALL",
      title: "Позвонить клиенту по подбору",
      description: "Просроченная seed-задача для проверки контроля",
      status: "IN_PROGRESS",
      priority: "URGENT",
      objectId: "seed_project_object_apartments",
      dealId: "seed_deal_apartments_sanitary",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, -1),
      completedAt: null,
      result: null,
      responsibleId: "seed_store_manager",
      archivedAt: null,
      notes: "Seed просроченная задача"
    },
    create: {
      id: "seed_task_overdue_deal",
      recordType: "TASK",
      actionType: "CALL",
      title: "Позвонить клиенту по подбору",
      description: "Просроченная seed-задача для проверки контроля",
      status: "IN_PROGRESS",
      priority: "URGENT",
      objectId: "seed_project_object_apartments",
      dealId: "seed_deal_apartments_sanitary",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, -1),
      responsibleId: "seed_store_manager",
      createdById: "seed_owner",
      archivedAt: null,
      notes: "Seed просроченная задача"
    }
  });

  await prisma.taskActivity.upsert({
    where: { id: "seed_touch_designer_meeting" },
    update: {
      recordType: "TOUCH",
      actionType: "SHOWROOM_MEETING",
      title: "Встреча с дизайнером в шоуруме",
      description: "Обсудили объект и сроки реализации",
      status: "RECORDED",
      priority: "NORMAL",
      objectId: "seed_project_object_apartments",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, -2),
      completedAt: offsetDate(now, -2),
      result: "Дизайнер готов показать подбор клиенту",
      nextStepText: "Отправить уточненную подборку",
      nextStepAt: offsetDate(now, 1),
      responsibleId: "seed_project_manager",
      archivedAt: null,
      notes: "Seed касание"
    },
    create: {
      id: "seed_touch_designer_meeting",
      recordType: "TOUCH",
      actionType: "SHOWROOM_MEETING",
      title: "Встреча с дизайнером в шоуруме",
      description: "Обсудили объект и сроки реализации",
      status: "RECORDED",
      priority: "NORMAL",
      objectId: "seed_project_object_apartments",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      dueAt: offsetDate(now, -2),
      completedAt: offsetDate(now, -2),
      result: "Дизайнер готов показать подбор клиенту",
      nextStepText: "Отправить уточненную подборку",
      nextStepAt: offsetDate(now, 1),
      responsibleId: "seed_project_manager",
      createdById: "seed_owner",
      archivedAt: null,
      notes: "Seed касание"
    }
  });

}
