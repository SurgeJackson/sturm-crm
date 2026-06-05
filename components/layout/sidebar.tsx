"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CheckSquare,
  FileText,
  LayoutDashboard,
  Settings,
  UserRound,
  UsersRound
} from "lucide-react";
import type { UserRole } from "@prisma/client";
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

  return (
    <aside className="hidden w-72 shrink-0 border-r bg-card lg:block">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/" className="text-lg font-semibold tracking-normal">
          STURM CRM
        </Link>
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
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                isActive && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
