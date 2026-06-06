import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { PageHeader } from "@/components/layout/page-header";
import { TaskCalendarDayList, TaskCalendarFilters, TaskCalendarRangeNav } from "@/components/tasks/task-calendar";
import { Button } from "@/components/ui/button";
import { getTaskCalendar, getTaskFormContext, type TaskCalendarSearchParams } from "@/modules/tasks/queries";

type TaskCalendarPageProps = {
  searchParams: Promise<TaskCalendarSearchParams>;
};

export default async function TaskCalendarPage({ searchParams }: TaskCalendarPageProps) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const params = await searchParams;
  const [calendar, context] = await Promise.all([
    getTaskCalendar(params, user),
    getTaskFormContext(user)
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Календарь задач"
        description="Недельный список задач и касаний."
        actions={<Button asChild variant="outline"><Link href="/tasks">К списку</Link></Button>}
      />

      <TaskCalendarFilters params={params} users={context.users} />
      <TaskCalendarRangeNav params={params} range={calendar.range} />
      <TaskCalendarDayList days={calendar.days} />
    </div>
  );
}
