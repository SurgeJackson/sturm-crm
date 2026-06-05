import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { getCurrentUser } from "@/auth/get-current-user";
import { PlaceholderPage } from "@/components/crm/placeholder-page";
import { canAccessSettings } from "@/permissions";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!canAccessSettings(user)) {
    redirect("/");
  }

  return (
    <PlaceholderPage
      title="Настройки"
      description="Управление пользователями, ролями и системными параметрами."
      icon={Settings}
    />
  );
}
