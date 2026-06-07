import { redirect } from "next/navigation";
import { getCurrentUser } from "@/auth/get-current-user";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function CrmLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!user.emailVerifiedAt) {
    redirect("/auth/resend-verification");
  }

  if (!user.isActive || user.deactivatedAt) {
    redirect("/auth/login?error=USER_NOT_ACTIVE");
  }

  if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
    redirect("/auth/login?error=USER_LOCKED");
  }

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar user={user} />
      <div className="min-w-0 flex-1">
        <Topbar user={user} />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6">{children}</main>
      </div>
    </div>
  );
}
