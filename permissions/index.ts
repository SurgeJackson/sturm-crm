import type { UserRole } from "@prisma/client";

export type PermissionUser = {
  id?: string;
  role: UserRole;
  isActive?: boolean;
};

export type OwnedRecord = {
  createdById?: string | null;
  responsibleId?: string | null;
  archivedAt?: Date | string | null;
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

export function canChangeObjectResponsible(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return leadershipRoles.has(user.role);
}

export function canManageObjectParticipants(user: PermissionUser | null | undefined, record: OwnedRecord) {
  return canEditRecord(user, record);
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

export function canViewRecord(user: PermissionUser | null | undefined, record: OwnedRecord) {
  if (!isActive(user)) return false;
  if (canViewAllData(user)) return true;
  return Boolean(user.id && (record.createdById === user.id || record.responsibleId === user.id));
}

export function canEditRecord(user: PermissionUser | null | undefined, record: OwnedRecord) {
  if (!isActive(user)) return false;
  if (canViewAllData(user)) return true;
  return Boolean(user.id && (record.createdById === user.id || record.responsibleId === user.id));
}

export function canArchiveRecord(user: PermissionUser | null | undefined, record: OwnedRecord) {
  if (!isActive(user)) return false;
  if (canDeleteOrArchive(user)) return true;
  return false;
}

export function canChangeRecordResponsible(user?: PermissionUser | null) {
  return canChangeResponsible(user);
}
