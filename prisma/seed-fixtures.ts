import { UserRole } from "../generated/prisma/client";

export const DEMO_PASSWORD = "Sturm12345";

export const seedUsers = [
  {
    id: "seed_owner",
    name: "Алексей Руководитель",
    email: "owner@sturm.local",
    role: UserRole.OWNER
  },
  {
    id: "seed_sales_lead",
    name: "Мария Старший менеджер",
    email: "sales-lead@sturm.local",
    role: UserRole.SALES_LEAD
  },
  {
    id: "seed_store_manager",
    name: "Ирина Менеджер магазина",
    email: "store-manager@sturm.local",
    role: UserRole.STORE_MANAGER
  },
  {
    id: "seed_project_manager",
    name: "Денис Проектный менеджер",
    email: "project-manager@sturm.local",
    role: UserRole.PROJECT_MANAGER
  },
  {
    id: "seed_administrator",
    name: "Ольга Администратор",
    email: "administrator@sturm.local",
    role: UserRole.ADMINISTRATOR
  }
];
