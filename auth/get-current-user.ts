import { getServerSession } from "next-auth";
import { authOptions } from "@/auth/options";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      emailVerifiedAt: true,
      lockedUntil: true,
      deactivatedAt: true
    }
  });

  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive && !user.deactivatedAt && (!user.lockedUntil || user.lockedUntil <= new Date()),
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    lockedUntil: user.lockedUntil?.toISOString() ?? null,
    deactivatedAt: user.deactivatedAt?.toISOString() ?? null
  };
}
