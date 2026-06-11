"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
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
  canReviewTimeEvents,
  canViewDesignerBonusReports,
  canViewOwnTimeClock,
  canViewPayments,
  canViewReports,
  canViewSchedulePlanner,
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
  { href: "/admin/schedule-planner", label: "Планировщик", icon: CalendarDays },
  { href: "/admin/timesheet", label: "Табель", icon: CalendarClock },
  { href: "/admin/work-locations", label: "Рабочие точки", icon: MapPin },
  { href: "/admin/time-events/review", label: "Спорные отметки", icon: ShieldAlert },
  { href: "/admin/employee-devices", label: "Устройства сотрудников", icon: Smartphone },
  { href: "/admin/time-adjustments", label: "Корректировки времени", icon: Clock },
  { href: "/admin/time-reports", label: "Отчеты времени", icon: BarChart3 }
];

const SIDEBAR_COLLAPSED_KEY = "sturm-sidebar-collapsed";
const SIDEBAR_COLLAPSED_EVENT = "sturm-sidebar-collapsed-change";

type SidebarProps = {
  user: {
    role: UserRole;
    isActive: boolean;
  };
};

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const isCollapsed = useSyncExternalStore(
    subscribeSidebarCollapsed,
    getSidebarCollapsedSnapshot,
    getSidebarCollapsedServerSnapshot
  );

  function toggleCollapsed() {
    const next = !isCollapsed;
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
    window.dispatchEvent(new Event(SIDEBAR_COLLAPSED_EVENT));
  }

  function canShowItem(href: string) {
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

  const visibleTimeClockNavigation = timeClockNavigation.filter((item) => canShowItem(item.href));

  return (
    <aside className={cn(
      "hidden h-screen shrink-0 overflow-hidden border-r bg-card transition-[width] duration-200 lg:sticky lg:top-0 lg:flex lg:flex-col",
      isCollapsed ? "w-20" : "w-72"
    )}>
      <div className={cn("flex h-14 shrink-0 items-center gap-2 border-b px-2.5", isCollapsed ? "justify-center" : "justify-between")}>
        <Link href="/" className={cn("min-w-0 text-base font-semibold tracking-normal", isCollapsed ? "sr-only" : "truncate")}>
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
      <nav className="flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2 [scrollbar-gutter:stable]">
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
                "flex min-h-8 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
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
          <div className="pt-2">
            <div className={cn("px-2.5 pb-1 text-[11px] font-medium uppercase leading-4 tracking-normal text-muted-foreground", isCollapsed && "sr-only")}>
              Учет времени
            </div>
            <div className="space-y-0.5">
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
                      "flex min-h-8 items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                      !isCollapsed && "pl-4",
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

function subscribeSidebarCollapsed(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_COLLAPSED_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_COLLAPSED_EVENT, callback);
  };
}

function getSidebarCollapsedSnapshot() {
  return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
}

function getSidebarCollapsedServerSnapshot() {
  return false;
}
