import { UsersRound } from "lucide-react";
import { PlaceholderPage } from "@/components/crm/placeholder-page";

export default function ClientsPage() {
  return (
    <PlaceholderPage
      title="Клиенты"
      description="База клиентов компании STURM с ответственными и историей касаний."
      icon={UsersRound}
      actionLabel="Создать клиента"
    />
  );
}
