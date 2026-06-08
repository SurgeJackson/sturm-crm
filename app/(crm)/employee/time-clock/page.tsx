import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { PageNoticeStack } from "@/components/layout/page-notice";
import { EmployeeTimeClock } from "@/components/time-clock/employee-time-clock";
import { getMyDay } from "@/modules/time-clock/service";
import { canViewOwnTimeClock } from "@/permissions";

export default async function EmployeeTimeClockPage({ searchParams }: { searchParams: Promise<{ adjustment?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  if (!canViewOwnTimeClock(user)) redirect("/");
  const params = await searchParams;
  const day = await getMyDay({ user });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Учет рабочего времени"
        description="Текущая смена, статус устройства и заявки на корректировку времени."
      />
      <PageNoticeStack notices={[
        { show: Boolean(params.adjustment), message: "Заявка на корректировку отправлена руководителю." }
      ]} />
      <EmployeeTimeClock initialDay={day as never} />
    </div>
  );
}
