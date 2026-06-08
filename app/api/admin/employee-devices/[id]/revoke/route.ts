import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { canManageEmployeeDevices } from "@/permissions";
import { changeEmployeeDeviceStatus } from "@/modules/time-clock/service";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !canManageEmployeeDevices(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });
  const { id } = await params;
  const device = await changeEmployeeDeviceStatus(id, "PENDING", user.id);
  return NextResponse.json({ device });
}
