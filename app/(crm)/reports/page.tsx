import { BarChart3 } from "lucide-react";
import { PlaceholderPage } from "@/components/crm/placeholder-page";

export default function ReportsPage() {
  return (
    <PlaceholderPage
      title="Отчеты"
      description="Будущие отчеты по воронке, активности менеджеров и проектным продажам."
      icon={BarChart3}
    />
  );
}
