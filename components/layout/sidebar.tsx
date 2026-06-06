"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  FileText,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  UserRound,
  UsersRound
} from "lucide-react";
import type { UserRole } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { canAccessSettings, canViewReports } from "@/permissions";

const navigation = [
  { href: "/", label: "Рабочий стол", icon: LayoutDashboard },
  { href: "/clients", label: "Клиенты", icon: UsersRound },
  { href: "/designers", label: "Дизайнеры / архитекторы", icon: UserRound },
  { href: "/objects", label: "Объекты", icon: Building2 },
  { href: "/deals", label: "Сделки", icon: BriefcaseBusiness },
  { href: "/proposals", label: "КП", icon: FileText },
  { href: "/tasks", label: "Задачи / касания", icon: CheckSquare },
  { href: "/reports", label: "Отчеты", icon: BarChart3 },
  { href: "/settings", label: "Настройки", icon: Settings }
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
          if (item.href === "/reports" && !canViewReports(user)) {
            return null;
          }

          if (item.href === "/settings" && !canAccessSettings(user)) {
            return null;
          }

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
      </nav>
    </aside>
  );
}
