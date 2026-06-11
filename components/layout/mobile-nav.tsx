"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import type { UserRole } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  canAccessSettings,
  canManageEmployeeDevices,
  canManageTimeAdjustments,
  canManageWorkLocations,
  canReviewTimeEvents,
  canViewDesignerBonusReports,
  canViewOwnTimeClock,
  canViewPayments,
  canViewReports,
  canViewSchedulePlanner,
  canViewSecurityLog,
  canViewTimesheet
} from "@/permissions";

const mobileLinks = [
  { href: "/", label: "Рабочий стол" },
  { href: "/clients", label: "Клиенты" },
  { href: "/designers", label: "Дизайнеры / архитекторы" },
  { href: "/objects", label: "Объекты" },
  { href: "/deals", label: "Сделки" },
  { href: "/proposals", label: "КП" },
  { href: "/payments", label: "Оплаты" },
  { href: "/designer-bonuses/accruals", label: "Бонусы дизайнеров" },
  { href: "/tasks", label: "Задачи / касания" },
  { href: "/reports", label: "Отчеты" },
  { href: "/security", label: "Безопасность" },
  { href: "/settings", label: "Настройки" }
];

const timeClockMobileLinks = [
  { href: "/employee/time-clock", label: "Мое время" },
  { href: "/admin/schedule-planner", label: "Планировщик" },
  { href: "/admin/timesheet", label: "Табель" },
  { href: "/admin/work-locations", label: "Рабочие точки" },
  { href: "/admin/time-events/review", label: "Спорные отметки" },
  { href: "/admin/employee-devices", label: "Устройства сотрудников" },
  { href: "/admin/time-adjustments", label: "Корректировки времени" },
  { href: "/admin/time-reports", label: "Отчеты времени" }
];

type MobileNavProps = {
  user: {
    role: UserRole;
    isActive: boolean;
  };
};

export function MobileNav({ user }: MobileNavProps) {
  function canShowLink(href: string) {
    if (href === "/reports") return canViewReports(user);
    if (href === "/payments") return canViewPayments(user);
    if (href === "/designer-bonuses/accruals") return canViewDesignerBonusReports(user);
    if (href === "/employee/time-clock") return canViewOwnTimeClock(user);
    if (href === "/admin/schedule-planner") return canViewSchedulePlanner(user);
    if (href === "/admin/timesheet") return canViewTimesheet(user);
    if (href === "/admin/work-locations") return canManageWorkLocations(user);
    if (href === "/admin/time-events/review") return canReviewTimeEvents(user);
    if (href === "/admin/employee-devices") return canManageEmployeeDevices(user);
    if (href === "/admin/time-adjustments") return canManageTimeAdjustments(user);
    if (href === "/admin/time-reports") return canViewTimesheet(user);
    if (href === "/settings") return canAccessSettings(user);
    if (href === "/security") return canViewSecurityLog(user);
    return true;
  }

  const visibleTimeClockLinks = timeClockMobileLinks.filter((link) => canShowLink(link.href));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="lg:hidden" variant="outline" size="icon" aria-label="Открыть меню">
          <Menu className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="left-4 top-4 max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-sm translate-x-0 translate-y-0 overflow-y-auto">
        <nav className="mt-6 grid gap-1">
          {mobileLinks.map((link) => {
            if (!canShowLink(link.href)) return null;

            return (
              <Link key={link.href} className="rounded-md px-3 py-2 text-sm hover:bg-muted" href={link.href}>
                {link.label}
              </Link>
            );
          })}
          {visibleTimeClockLinks.length ? (
            <div className="mt-3 border-t pt-3">
              <div className="px-3 pb-1 text-xs font-medium uppercase tracking-normal text-muted-foreground">Учет времени</div>
              <div className="grid gap-1">
                {visibleTimeClockLinks.map((link) => (
                  <Link key={link.href} className="rounded-md px-5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground" href={link.href}>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : null}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
