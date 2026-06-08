import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canManageWorkLocations } from "@/permissions";
import { blockDisplayDevice } from "@/modules/time-clock/service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageWorkLocations(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const { id } = await params;
  const device = await blockDisplayDevice(id, user.id, "Заблокировано через API");
  return NextResponse.json({ device });
}
