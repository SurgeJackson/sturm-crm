import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/auth/get-current-user";
import { getTimesheetMatrix } from "@/modules/time-clock/queries";
import { canViewTimesheet } from "@/permissions";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !canViewTimesheet(user)) return NextResponse.json({ message: "Недостаточно прав" }, { status: 403 });

  const params = {
    locationId: request.nextUrl.searchParams.get("locationId") ?? undefined,
    employeeId: request.nextUrl.searchParams.get("employeeId") ?? undefined,
    year: request.nextUrl.searchParams.get("year") ?? undefined,
    month: request.nextUrl.searchParams.get("month") ?? undefined
  };
  const data = await getTimesheetMatrix(params);
  return NextResponse.json(data);
}
