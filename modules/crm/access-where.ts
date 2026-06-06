import type { Prisma } from "@/generated/prisma/client";
import { canViewAllData, type PermissionUser } from "@/permissions";

type OwnableWhere =
  | Prisma.ClientWhereInput
  | Prisma.DesignerWhereInput
  | Prisma.ProjectObjectWhereInput
  | Prisma.DealWhereInput
  | Prisma.CommercialProposalWhereInput
  | Prisma.TaskActivityWhereInput;

export type SharedOwnerWhere =
  & Prisma.ClientWhereInput
  & Prisma.DesignerWhereInput
  & Prisma.ProjectObjectWhereInput
  & Prisma.DealWhereInput
  & Prisma.CommercialProposalWhereInput
  & Prisma.TaskActivityWhereInput;

function deniedWhere<T extends OwnableWhere>(): T {
  return { id: "__no_access__" } as T;
}

export function ownerRecordWhere<T extends OwnableWhere = SharedOwnerWhere>(
  user: PermissionUser,
  responsibleId?: string
): T {
  if (canViewAllData(user)) {
    return (responsibleId ? { responsibleId } : {}) as T;
  }

  if (!user.id) return deniedWhere<T>();

  return {
    OR: [{ responsibleId: user.id }, { createdById: user.id }]
  } as T;
}

export function clientAccessWhere(user: PermissionUser, responsibleId?: string): Prisma.ClientWhereInput {
  return ownerRecordWhere<Prisma.ClientWhereInput>(user, responsibleId);
}

export function designerAccessWhere(user: PermissionUser, responsibleId?: string): Prisma.DesignerWhereInput {
  return ownerRecordWhere<Prisma.DesignerWhereInput>(user, responsibleId);
}

export function objectAccessWhere(user: PermissionUser, responsibleId?: string): Prisma.ProjectObjectWhereInput {
  return ownerRecordWhere<Prisma.ProjectObjectWhereInput>(user, responsibleId);
}

export function dealAccessWhere(user: PermissionUser, responsibleId?: string): Prisma.DealWhereInput {
  return ownerRecordWhere<Prisma.DealWhereInput>(user, responsibleId);
}

export function proposalAccessWhere(
  user: PermissionUser,
  responsibleId?: string
): Prisma.CommercialProposalWhereInput {
  return ownerRecordWhere<Prisma.CommercialProposalWhereInput>(user, responsibleId);
}

export function taskDirectAccessWhere(user: PermissionUser, responsibleId?: string): Prisma.TaskActivityWhereInput {
  return ownerRecordWhere<Prisma.TaskActivityWhereInput>(user, responsibleId);
}

export function taskAccessWhere(user: PermissionUser): Prisma.TaskActivityWhereInput {
  if (canViewAllData(user)) return {};
  if (!user.id) return deniedWhere<Prisma.TaskActivityWhereInput>();

  return {
    OR: [
      { responsibleId: user.id },
      { createdById: user.id },
      { client: clientAccessWhere(user) },
      { designer: designerAccessWhere(user) },
      { projectObject: objectAccessWhere(user) },
      { deal: dealAccessWhere(user) },
      { proposal: proposalAccessWhere(user) }
    ]
  };
}

export function objectParticipantAccessWhere(user: PermissionUser): Prisma.ProjectObjectParticipantWhereInput {
  if (canViewAllData(user)) return {};
  if (!user.id) return { id: "__no_access__" };

  return {
    OR: [
      { responsibleId: user.id },
      { createdById: user.id },
      { object: objectAccessWhere(user) }
    ]
  };
}

export function accessWhereBundle(user: PermissionUser) {
  return {
    client: clientAccessWhere(user),
    designer: designerAccessWhere(user),
    object: objectAccessWhere(user),
    deal: dealAccessWhere(user),
    proposal: proposalAccessWhere(user),
    task: taskDirectAccessWhere(user)
  };
}
