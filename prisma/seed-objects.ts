import type { PrismaClient } from "../generated/prisma/client";
import { offsetDate } from "./seed-support";

export async function seedObjects(prisma: PrismaClient, now: Date) {
  await prisma.projectObject.upsert({
    where: { id: "seed_project_object_apartments" },
    update: {
      title: "Комплектация апартаментов",
      objectType: "APARTMENTS_COMPLEX",
      city: "Москва",
      region: "Москва",
      address: "Пресненская набережная, 12",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      status: "ACTIVE",
      stage: "CALCULATION",
      implementationStartAt: now,
      implementationEndAt: offsetDate(now, 45),
      budget: 2800000,
      bathroomsCount: 8,
      interestCategories: ["SANITARY_WARE", "MIXERS", "SHOWER_SYSTEMS", "BATHROOM_FURNITURE"],
      files: ["Планировка апартаментов.pdf", "Спецификация санузлов.xlsx"],
      comment: "Seed-объект для проверки Stage 3",
      responsibleId: "seed_owner",
      archivedAt: null,
      notes: "Seed-объект для проверки Stage 3"
    },
    create: {
      id: "seed_project_object_apartments",
      title: "Комплектация апартаментов",
      objectType: "APARTMENTS_COMPLEX",
      city: "Москва",
      region: "Москва",
      address: "Пресненская набережная, 12",
      clientId: "seed_client_showroom",
      designerId: "seed_designer_north",
      status: "ACTIVE",
      stage: "CALCULATION",
      implementationStartAt: now,
      implementationEndAt: offsetDate(now, 45),
      budget: 2800000,
      bathroomsCount: 8,
      interestCategories: ["SANITARY_WARE", "MIXERS", "SHOWER_SYSTEMS", "BATHROOM_FURNITURE"],
      files: ["Планировка апартаментов.pdf", "Спецификация санузлов.xlsx"],
      comment: "Seed-объект для проверки Stage 3",
      responsibleId: "seed_owner",
      createdById: "seed_owner",
      archivedAt: null,
      notes: "Seed-объект для проверки Stage 3"
    }
  });

  await prisma.projectObjectParticipant.upsert({
    where: { id: "seed_object_participant_owner" },
    update: {
      participantType: "PURCHASE_INFLUENCER",
      fullName: "Анна Собственник",
      company: "STURM Development",
      role: "Собственник",
      phone: "+7 900 000-00-03",
      email: "owner-client@example.com",
      messenger: "Telegram",
      responsibleId: "seed_owner",
      influenceLevel: "HIGH",
      influenceType: "FINAL_DECISION",
      attitudeToSturm: "LOYAL",
      decisionFactors: "Сроки, бренд, наличие",
      responsibilityZone: null,
      canApproveChanges: null,
      whenToInvolve: null,
      comment: "Ключевой участник решения",
      archivedAt: null
    },
    create: {
      id: "seed_object_participant_owner",
      objectId: "seed_project_object_apartments",
      participantType: "PURCHASE_INFLUENCER",
      fullName: "Анна Собственник",
      company: "STURM Development",
      role: "Собственник",
      phone: "+7 900 000-00-03",
      email: "owner-client@example.com",
      messenger: "Telegram",
      responsibleId: "seed_owner",
      influenceLevel: "HIGH",
      influenceType: "FINAL_DECISION",
      attitudeToSturm: "LOYAL",
      decisionFactors: "Сроки, бренд, наличие",
      responsibilityZone: null,
      canApproveChanges: null,
      whenToInvolve: null,
      comment: "Ключевой участник решения",
      createdById: "seed_owner",
      archivedAt: null
    }
  });

  await prisma.projectObjectParticipant.upsert({
    where: { id: "seed_object_participant_foreman" },
    update: {
      participantType: "IMPLEMENTATION_CONTACT",
      fullName: "Игорь Прораб",
      company: "Генподрядчик",
      role: "Прораб",
      phone: "+7 900 000-00-04",
      email: "foreman@example.com",
      messenger: "WhatsApp",
      responsibleId: "seed_project_manager",
      influenceLevel: null,
      influenceType: null,
      attitudeToSturm: null,
      decisionFactors: null,
      responsibilityZone: "Приемка, монтаж, сроки",
      canApproveChanges: "PARTIALLY",
      whenToInvolve: "Перед поставкой и при изменениях на объекте",
      comment: "Контакт реализации",
      archivedAt: null
    },
    create: {
      id: "seed_object_participant_foreman",
      objectId: "seed_project_object_apartments",
      participantType: "IMPLEMENTATION_CONTACT",
      fullName: "Игорь Прораб",
      company: "Генподрядчик",
      role: "Прораб",
      phone: "+7 900 000-00-04",
      email: "foreman@example.com",
      messenger: "WhatsApp",
      responsibleId: "seed_project_manager",
      influenceLevel: null,
      influenceType: null,
      attitudeToSturm: null,
      decisionFactors: null,
      responsibilityZone: "Приемка, монтаж, сроки",
      canApproveChanges: "PARTIALLY",
      whenToInvolve: "Перед поставкой и при изменениях на объекте",
      comment: "Контакт реализации",
      createdById: "seed_owner",
      archivedAt: null
    }
  });


}
