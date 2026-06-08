import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { ScanTimeClock } from "@/components/time-clock/employee-time-clock";
import { getMyDay } from "@/modules/time-clock/service";

export default async function ScanTimeClockPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const user = await getCurrentUser();
  const params = await searchParams;
  if (!user) redirect(`/auth/login?callbackUrl=${encodeURIComponent(`/time-clock/scan?token=${params.token ?? ""}`)}`);
  if (!params.token) redirect("/employee/time-clock");
  const day = await getMyDay({ user });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Отметка по QR-коду"
        description="Проверьте действие и подтвердите отправку геолокации. Решение принимает сервер."
      />
      <ScanTimeClock token={params.token} suggestedAction={day.nextSuggestedAction} />
    </div>
  );
}
