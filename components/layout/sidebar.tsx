"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  CheckSquare,
  Clock,
  FileText,
  HandCoins,
  LayoutDashboard,
  MapPin,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  Settings,
  ShieldCheck,
  Smartphone,
  UserRound,
  UsersRound
} from "lucide-react";
import type { UserRole } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  canAccessSettings,
  canManageEmployeeDevices,
  canManageTimeAdjustments,
  canManageWorkLocations,
  canManageWorkShifts,
  canReviewTimeEvents,
  canViewDesignerBonusReports,
  canViewOwnTimeClock,
  canViewPayments,
  canViewReports,
  canViewSecurityLog,
  canViewTimesheet
} from "@/permissions";

const navigation = [
  { href: "/", label: "Рабочий стол", icon: LayoutDashboard },
  { href: "/clients", label: "Клиенты", icon: UsersRound },
  { href: "/designers", label: "Дизайнеры / архитекторы", icon: UserRound },
  { href: "/objects", label: "Объекты", icon: Building2 },
  { href: "/deals", label: "Сделки", icon: BriefcaseBusiness },
  { href: "/proposals", label: "КП", icon: FileText },
  { href: "/payments", label: "Оплаты", icon: HandCoins },
  { href: "/designer-bonuses/accruals", label: "Бонусы дизайнеров", icon: HandCoins },
  { href: "/tasks", label: "Задачи / касания", icon: CheckSquare },
  { href: "/reports", label: "Отчеты", icon: BarChart3 },
  { href: "/security", label: "Безопасность", icon: ShieldCheck },
  { href: "/settings", label: "Настройки", icon: Settings }
];

const timeClockNavigation = [
  { href: "/employee/time-clock", label: "Мое время", icon: Clock },
  { href: "/admin/timesheet", label: "Табель", icon: CalendarClock },
  { href: "/admin/work-locations", label: "Рабочие точки", icon: MapPin },
  { href: "/admin/work-shifts", label: "График смен", icon: CalendarDays },
  { href: "/admin/time-events/review", label: "Спорные отметки", icon: ShieldAlert },
  { href: "/admin/employee-devices", label: "Устройства сотрудников", icon: Smartphone },
  { href: "/admin/time-adjustments", label: "Корректировки времени", icon: Clock },
  { href: "/admin/time-reports", label: "Отчеты времени", icon: BarChart3 }
];

type SidebarProps = {
  user: {
    role: UserRole;
    isActive: boolean;
  };
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(() =>
    typeof window === "undefined" ? false : localStorage.getItem("sturm-sidebar-collapsed") === "1"
  );

  function toggleCollapsed() {
    setIsCollapsed((current) => {
      const next = !current;
      localStorage.setItem("sturm-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  }

  function canShowItem(href: string) {
    if (href === "/reports") return canViewReports(user);
    if (href === "/payments") return canViewPayments(user);
    if (href === "/designer-bonuses/accruals") return canViewDesignerBonusReports(user);
    if (href === "/employee/time-clock") return canViewOwnTimeClock(user);
    if (href === "/admin/timesheet") return canViewTimesheet(user);
    if (href === "/admin/work-locations") return canManageWorkLocations(user);
    if (href === "/admin/work-shifts") return canManageWorkShifts(user);
    if (href === "/admin/time-events/review") return canReviewTimeEvents(user);
    if (href === "/admin/employee-devices") return canManageEmployeeDevices(user);
    if (href === "/admin/time-adjustments") return canManageTimeAdjustments(user);
    if (href === "/admin/time-reports") return canViewTimesheet(user);
    if (href === "/settings") return canAccessSettings(user);
    if (href === "/security") return canViewSecurityLog(user);
    return true;
  }

  const visibleTimeClockNavigation = timeClockNavigation.filter((item) => canShowItem(item.href));

  return (
    <aside className={cn("hidden shrink-0 border-r bg-card transition-[width] duration-200 lg:block", isCollapsed ? "w-20" : "w-72")}>
      <div className={cn("flex h-16 items-center gap-2 border-b px-3", isCollapsed ? "justify-center" : "justify-between")}>
        <Link href="/" className={cn("min-w-0 text-lg font-semibold tracking-normal", isCollapsed ? "sr-only" : "truncate")}>
          STURM CRM
        </Link>
        {isCollapsed ? <div className="text-sm font-semibold">S</div> : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
          title={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
          onClick={toggleCollapsed}
        >
          {isCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </Button>
      </div>
      <nav className="space-y-1 p-3">
        {navigation.map((item) => {
          if (!canShowItem(item.href)) return null;

          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(`${item.href}/`));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={isCollapsed ? item.label : undefined}
              aria-label={item.label}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                isCollapsed && "justify-center px-2",
                isActive && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className={cn("truncate", isCollapsed && "sr-only")}>{item.label}</span>
            </Link>
          );
        })}
        {visibleTimeClockNavigation.length ? (
          <div className="pt-3">
            <div className={cn("px-3 pb-1 text-xs font-medium uppercase tracking-normal text-muted-foreground", isCollapsed && "sr-only")}>
              Учет времени
            </div>
            <div className="space-y-1">
              {visibleTimeClockNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={isCollapsed ? item.label : undefined}
                    aria-label={item.label}
                    className={cn(
                      "flex min-h-9 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                      !isCollapsed && "pl-5",
                      isCollapsed && "justify-center px-2",
                      isActive && "bg-muted text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className={cn("truncate", isCollapsed && "sr-only")}>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}
      </nav>
    </aside>
  );
}
