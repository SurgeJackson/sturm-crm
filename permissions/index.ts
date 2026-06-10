import type { UserRole } from "@/generated/prisma/client";

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

export function canViewAllClients(user?: PermissionUser | null) {
  return canViewAllData(user);
}

export function canViewAllDesigners(user?: PermissionUser | null) {
  return canViewAllData(user);
}

export function canViewAllObjects(user?: PermissionUser | null) {
  return canViewAllData(user);
}

export function canViewAllDeals(user?: PermissionUser | null) {
  return canViewAllData(user);
}

export function canViewAllProposals(user?: PermissionUser | null) {
  return canViewAllData(user);
}

export function canManageUsers(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return elevatedRoles.has(user.role);
}

export function canManageRoles(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER";
}

export function canDeactivateUser(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER";
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

export function canExportAllData(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER";
}

export function canExportReports(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER" || user.role === "SALES_LEAD";
}

export function canViewAuditLog(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER" || user.role === "SALES_LEAD";
}

export function canViewSecurityLog(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER";
}

export function canRunSecurityCheck(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER";
}

export function canIgnoreCrmViolation(user?: PermissionUser | null) {
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

export function canChangeDealResponsible(user?: PermissionUser | null) {
  return canChangeResponsible(user);
}

export function canCloseDealAsLost(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role !== "ADMINISTRATOR";
}

export function canCreateProposal(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role) && user.role !== "ADMINISTRATOR";
}

export function canChangeProposalResponsible(user?: PermissionUser | null) {
  return canChangeResponsible(user);
}

export function canChangeProposalFinancials(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role !== "ADMINISTRATOR";
}

export function canChangeProposalStatus(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role !== "ADMINISTRATOR";
}

export function canCreateTask(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}

export function canCreateTouch(user?: PermissionUser | null) {
  return canCreateTask(user);
}

export function canChangeTaskResponsible(user?: PermissionUser | null) {
  return canChangeResponsible(user);
}

export function canCancelTask(user: PermissionUser | null | undefined, record: OwnedRecord) {
  if (!isActive(user)) return false;
  if (leadershipRoles.has(user.role)) return true;
  return Boolean(user.id && (record.createdById === user.id || record.responsibleId === user.id));
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

export function canArchiveEntity(user: PermissionUser | null | undefined, entity: OwnedRecord) {
  return canArchiveRecord(user, entity);
}

export function canRestoreEntity(user: PermissionUser | null | undefined, entity: OwnedRecord) {
  if (!isActive(user)) return false;
  return Boolean(entity.archivedAt && leadershipRoles.has(user.role));
}

export function canHardDelete(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER" && process.env.ALLOW_OWNER_HARD_DELETE === "1";
}

export function canChangeRecordResponsible(user?: PermissionUser | null) {
  return canChangeResponsible(user);
}

export function canViewPayments(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER" || user.role === "SALES_LEAD";
}

export function canViewSensitiveFields(user: PermissionUser | null | undefined, entity?: OwnedRecord | null) {
  if (!isActive(user) || user.role === "ADMINISTRATOR") return false;
  if (user.role === "OWNER" || user.role === "SALES_LEAD") return true;
  return Boolean(user.id && entity && (entity.createdById === user.id || entity.responsibleId === user.id));
}

export function canViewCommercialTerms(user: PermissionUser | null | undefined, entity?: OwnedRecord | null) {
  return canViewSensitiveFields(user, entity);
}

export function canDownloadProposalFile(user: PermissionUser | null | undefined, proposal: OwnedRecord) {
  return canViewRecord(user, proposal);
}

export function canCreatePayment(user?: PermissionUser | null) {
  return canViewPayments(user);
}

export function canConfirmPayment(user?: PermissionUser | null) {
  return canViewPayments(user);
}

export function canViewOwnTimeClock(user?: PermissionUser | null) {
  return isActive(user);
}

export function canMarkTimeClock(user?: PermissionUser | null) {
  return isActive(user);
}

export function canManageWorkLocations(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER" || user.role === "SALES_LEAD" || user.role === "ADMINISTRATOR";
}

export function canManageWorkShifts(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}

export function canManageShiftTemplates(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER" || user.role === "SALES_LEAD" || user.role === "ADMINISTRATOR";
}

export function canViewSchedulePlanner(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}

export function canEditSchedulePlanner(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}

export function canApproveSchedulePlanner(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER" || user.role === "SALES_LEAD";
}

export function canReviewTimeEvents(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}

export function canManageEmployeeDevices(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return managerRoles.has(user.role);
}

export function canViewTimesheet(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role !== "ADMINISTRATOR";
}

export function canManageTimeAdjustments(user?: PermissionUser | null) {
  return canReviewTimeEvents(user);
}

function ownsBonusContext(user: PermissionUser, record?: OwnedRecord | null) {
  return Boolean(user.id && record && (record.createdById === user.id || record.responsibleId === user.id));
}

export function canViewDesignerBonus(user: PermissionUser | null | undefined, designer?: OwnedRecord | null) {
  if (!isActive(user) || user.role === "ADMINISTRATOR") return false;
  if (user.role === "OWNER" || user.role === "SALES_LEAD") return true;
  return ownsBonusContext(user, designer);
}

export function canManageDesignerBonusAgreement(user: PermissionUser | null | undefined, designer?: OwnedRecord | null) {
  if (!isActive(user)) return false;
  if (user.role === "OWNER") return true;
  return false;
}

export function canViewDesignerBonusAmounts(user: PermissionUser | null | undefined, designer?: OwnedRecord | null) {
  if (!isActive(user) || user.role === "ADMINISTRATOR") return false;
  if (user.role === "OWNER" || user.role === "SALES_LEAD") return true;
  return user.role === "PROJECT_MANAGER" && ownsBonusContext(user, designer);
}

export function canCreateDesignerBonusAccrual(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER";
}

export function canCreateDesignerBonusPayout(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER";
}

export function canApproveDesignerBonusPayout(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER";
}

export function canCreateDesignerBonusAdjustment(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER";
}

export function canViewDesignerBonusReports(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER" || user.role === "SALES_LEAD";
}

export function canExportDesignerBonusReports(user?: PermissionUser | null) {
  if (!isActive(user)) return false;
  return user.role === "OWNER";
}
