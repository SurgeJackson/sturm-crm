import type { UserRole } from "@prisma/client";

export type PermissionUser = {
  role: UserRole;
  isActive?: boolean;
};

const leadershipRoles = new Set<UserRole>(["OWNER", "SALES_LEAD"]);
const elevatedRoles = new Set<UserRole>([
  "OWNER",
  "SALES_LEAD",
  "ADMINISTRATOR"
]);
const managerRoles = new Set<UserRole>([
  "OWNER",
  "SALES_LEAD",
  "STORE_MANAGER",
  "PROJECT_MANAGER",
  "ADMINISTRATOR"
]);

function isActive(user?: PermissionUser | null): user is PermissionUser {
  return Boolean(user && user.isActive !== false);
}

export function canViewAllData(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return leadershipRoles.has(user.role);
}

export function canManageUsers(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return elevatedRoles.has(user.role);
}

export function canAccessSettings(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER";
}

export function canChangeResponsible(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return elevatedRoles.has(user.role);
}

export function canDeleteOrArchive(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return leadershipRoles.has(user.role);
}

export function canViewReports(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return leadershipRoles.has(user.role);
}

export function canCreateClient(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}

export function canCreateDesigner(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}

export function canCreateObject(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}

export function canCreateDeal(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}

export function canCreateProposal(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}

export function canCreateTask(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}
