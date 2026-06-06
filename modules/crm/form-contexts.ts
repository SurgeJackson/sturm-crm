import { prisma } from "@/lib/prisma";
import {
  clientAccessWhere,
  dealAccessWhere,
  designerAccessWhere,
  objectAccessWhere
} from "@/modules/crm/access-where";
import { getAssignableUsers } from "@/modules/users/queries";
import type { PermissionUser } from "@/permissions";

const clientOptionSelect = { id: true, name: true };
const clientContactOptionSelect = { id: true, name: true, phone: true, email: true };
const designerOptionSelect = { id: true, name: true, studio: true };
const objectOptionSelect = { id: true, title: true };
const objectDealOptionSelect = {
  id: true,
  title: true,
  clientId: true,
  designerId: true,
  client: { select: { id: true, name: true } },
  designer: { select: { id: true, name: true, studio: true } }
};
const dealProposalOptionSelect = {
  id: true,
  title: true,
  clientId: true,
  objectId: true,
  designerId: true,
  responsibleId: true,
  client: { select: { id: true, name: true } },
  projectObject: { select: { id: true, title: true } },
  designer: { select: { id: true, name: true, studio: true } },
  responsible: { select: { id: true, name: true } }
};

export async function getDealFilterContext(user: PermissionUser) {
  const [users, clients, objects, designers] = await Promise.all([
    getAssignableUsers(),
    prisma.client.findMany({ where: { AND: [clientAccessWhere(user), { archivedAt: null }] }, orderBy: { name: "asc" }, select: clientOptionSelect }),
    prisma.projectObject.findMany({ where: { AND: [objectAccessWhere(user), { archivedAt: null }] }, orderBy: { title: "asc" }, select: objectOptionSelect }),
    prisma.designer.findMany({ where: { AND: [designerAccessWhere(user), { archivedAt: null }] }, orderBy: { name: "asc" }, select: designerOptionSelect })
  ]);

  return { users, clients, objects, designers };
}

export async function getDealFormContext(user: PermissionUser) {
  const [users, clients, objects, designers] = await Promise.all([
    getAssignableUsers(),
    prisma.client.findMany({ where: { AND: [clientAccessWhere(user), { archivedAt: null }] }, orderBy: { name: "asc" }, select: clientOptionSelect }),
    prisma.projectObject.findMany({ where: { AND: [objectAccessWhere(user), { archivedAt: null }] }, orderBy: { title: "asc" }, select: objectDealOptionSelect }),
    prisma.designer.findMany({ where: { AND: [designerAccessWhere(user), { archivedAt: null }] }, orderBy: { name: "asc" }, select: designerOptionSelect })
  ]);

  return { users, clients, objects, designers };
}

export async function getProposalFilterContext(user: PermissionUser) {
  const [users, clients, objects, deals, designers] = await Promise.all([
    getAssignableUsers(),
    prisma.client.findMany({ where: { AND: [clientAccessWhere(user), { archivedAt: null }] }, orderBy: { name: "asc" }, select: clientOptionSelect }),
    prisma.projectObject.findMany({ where: { AND: [objectAccessWhere(user), { archivedAt: null }] }, orderBy: { title: "asc" }, select: objectOptionSelect }),
    prisma.deal.findMany({ where: { AND: [dealAccessWhere(user), { archivedAt: null }] }, orderBy: { title: "asc" }, select: { id: true, title: true } }),
    prisma.designer.findMany({ where: { AND: [designerAccessWhere(user), { archivedAt: null }] }, orderBy: { name: "asc" }, select: designerOptionSelect })
  ]);

  return { users, clients, objects, deals, designers };
}

export async function getProposalFormContext(user: PermissionUser) {
  const [users, deals] = await Promise.all([
    getAssignableUsers(),
    prisma.deal.findMany({
      where: { AND: [dealAccessWhere(user), { archivedAt: null }] },
      orderBy: { title: "asc" },
      select: dealProposalOptionSelect
    })
  ]);

  return { users, deals };
}

export async function getObjectFilterContext(user: PermissionUser) {
  const [users, clients, designers] = await Promise.all([
    getAssignableUsers(),
    prisma.client.findMany({ where: { AND: [clientAccessWhere(user), { archivedAt: null }] }, orderBy: { name: "asc" }, select: clientOptionSelect }),
    prisma.designer.findMany({ where: { AND: [designerAccessWhere(user), { archivedAt: null }] }, orderBy: { name: "asc" }, select: designerOptionSelect })
  ]);

  return { users, clients, designers };
}

export async function getObjectFormContext(user: PermissionUser) {
  const [users, clients, designers] = await Promise.all([
    getAssignableUsers(),
    prisma.client.findMany({ where: { AND: [clientAccessWhere(user), { archivedAt: null }] }, orderBy: { name: "asc" }, select: clientContactOptionSelect }),
    prisma.designer.findMany({ where: { AND: [designerAccessWhere(user), { archivedAt: null }] }, orderBy: { name: "asc" }, select: designerOptionSelect })
  ]);

  return { users, clients, designers };
}

export async function getClientFormContext(user: PermissionUser) {
  const [users, designers] = await Promise.all([
    getAssignableUsers(),
    prisma.designer.findMany({ where: { AND: [designerAccessWhere(user), { archivedAt: null }] }, orderBy: { name: "asc" }, select: designerOptionSelect })
  ]);

  return { users, designers };
}
