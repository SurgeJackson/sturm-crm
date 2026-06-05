import { UserRound } from "lucide-react";
import { PlaceholderPage } from "@/components/crm/placeholder-page";

export default function DesignersPage() {
  return (
    <PlaceholderPage
      title="Дизайнеры / архитекторы"
      description="Партнерская база дизайнеров, архитекторов и бюро."
      icon={UserRound}
      actionLabel="Создать дизайнера"
    />
  );
}
