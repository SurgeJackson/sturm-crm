import { BriefcaseBusiness } from "lucide-react";
import { PlaceholderPage } from "@/components/crm/placeholder-page";

export default function DealsPage() {
  return (
    <PlaceholderPage
      title="Сделки"
      description="Воронка проектных и магазинных продаж."
      icon={BriefcaseBusiness}
      actionLabel="Создать сделку"
    />
  );
}
