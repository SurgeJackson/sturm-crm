"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import type { UserRole } from "@/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { canAccessSettings, canViewDesignerBonusReports, canViewPayments, canViewReports, canViewSecurityLog } from "@/permissions";

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

type MobileNavProps = {
  user: {
    role: UserRole;
    isActive: boolean;
  };
};

export function MobileNav({ user }: MobileNavProps) {
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
            if (link.href === "/reports" && !canViewReports(user)) {
              return null;
            }

            if (link.href === "/payments" && !canViewPayments(user)) {
              return null;
            }

            if (link.href === "/designer-bonuses/accruals" && !canViewDesignerBonusReports(user)) {
              return null;
            }

            if (link.href === "/settings" && !canAccessSettings(user)) {
              return null;
            }

            if (link.href === "/security" && !canViewSecurityLog(user)) {
              return null;
            }

            return (
              <Link key={link.href} className="rounded-md px-3 py-2 text-sm hover:bg-muted" href={link.href}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
