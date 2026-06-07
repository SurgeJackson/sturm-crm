import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { roleLabels } from "@/lib/constants";
import { paginatedQuery, sortFromParam } from "@/modules/crm/list-query";
import { enumParam } from "@/modules/crm/param-parsing";
import { pageFromParam } from "@/modules/crm/pagination";
import { defaultPermissionAllowed, permissionKeys, permissionLabels, permissionRoles } from "@/modules/admin/permissions";

export type UserListSearchParams = {
  q?: string;
  role?: string;
  status?: string;
  page?: string;
  sort?: string;
};

const PAGE_SIZE = 20;

export function userStatus(user: { isActive: boolean; emailVerifiedAt?: Date | null; deactivatedAt?: Date | null; lockedUntil?: Date | null }) {
  if (user.deactivatedAt) return "DEACTIVATED";
  if (user.lockedUntil && user.lockedUntil > new Date()) return "LOCKED";
  if (!user.emailVerifiedAt) return "EMAIL_PENDING";
  if (!user.isActive) return "PENDING_ACTIVATION";
  return "ACTIVE";
}

export const userStatusLabels = {
  ACTIVE: "Активен",
  EMAIL_PENDING: "Email не подтвержден",
  PENDING_ACTIVATION: "Ожидает активации",
  LOCKED: "Заблокирован",
  DEACTIVATED: "Деактивирован"
} as const;

export async function getAdminUsers(params: UserListSearchParams) {
  const page = pageFromParam(params.page);
  const filters: Prisma.UserWhereInput[] = [];
  const role = enumParam(params.role, roleLabels);

  if (params.q) {
    filters.push({
      OR: [
        { name: { contains: params.q, mode: "insensitive" } },
        { email: { contains: params.q, mode: "insensitive" } }
      ]
    });
  }
  if (role) filters.push({ role });
  if (params.status === "active") filters.push({ isActive: true, emailVerifiedAt: { not: null }, deactivatedAt: null });
  if (params.status === "pending") filters.push({ OR: [{ emailVerifiedAt: null }, { isActive: false }] });
  if (params.status === "deactivated") filters.push({ deactivatedAt: { not: null } });

  const where: Prisma.UserWhereInput = filters.length ? { AND: filters } : {};
  const orderBy = sortFromParam<Prisma.UserOrderByWithRelationInput>(params.sort, {
    name: { name: "asc" },
    createdAt: { createdAt: "desc" },
    lastLoginAt: { lastLoginAt: "desc" }
  }, { createdAt: "desc" });

  return paginatedQuery({
    page,
    pageSize: PAGE_SIZE,
    findRows: () => prisma.user.findMany({
      where,
      orderBy,
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        emailVerifiedAt: true,
        lastLoginAt: true,
        lockedUntil: true,
        deactivatedAt: true,
        createdAt: true
      }
    }),
    countRows: () => prisma.user.count({ where })
  });
}

export async function getAdminUser(id: string) {
  const [user, auditLogs, securityLogs, activity] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      include: {
        deactivatedBy: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.auditLog.findMany({
      where: { OR: [{ userId: id }, { entityType: "USER", entityId: id }] },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { user: { select: { id: true, name: true, email: true } } }
    }),
    prisma.securityLog.findMany({
      where: { OR: [{ userId: id }, { entityType: "USER", entityId: id }] },
      orderBy: { createdAt: "desc" },
      take: 80
    }),
    Promise.all([
      prisma.client.count({ where: { createdById: id } }),
      prisma.designer.count({ where: { createdById: id } }),
      prisma.projectObject.count({ where: { createdById: id } }),
      prisma.deal.count({ where: { createdById: id } }),
      prisma.commercialProposal.count({ where: { createdById: id } }),
      prisma.taskActivity.count({ where: { createdById: id } })
    ])
  ]);

  if (!user) return null;

  return {
    user,
    auditLogs,
    securityLogs,
    activity: {
      clients: activity[0],
      designers: activity[1],
      objects: activity[2],
      deals: activity[3],
      proposals: activity[4],
      tasks: activity[5]
    }
  };
}

export async function getPermissionMatrix() {
  const overrides = await prisma.rolePermission.findMany();
  const overrideMap = new Map(overrides.map((item) => [`${item.role}:${item.permissionKey}`, item.isAllowed]));

  return permissionKeys.map((key) => ({
    key,
    label: permissionLabels[key],
    roles: permissionRoles.map((role) => ({
      role,
      isAllowed: overrideMap.get(`${role}:${key}`) ?? defaultPermissionAllowed(role, key),
      isOverridden: overrideMap.has(`${role}:${key}`)
    }))
  }));
}
