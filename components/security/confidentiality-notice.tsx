import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { acceptConfidentialityAction } from "@/modules/security/actions";

export function ConfidentialityNotice() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Коммерческая тайна STURM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            Данные CRM являются конфиденциальной информацией компании STURM. Несанкционированное копирование, выгрузка и
            передача данных запрещены.
          </p>
          <form action={acceptConfidentialityAction}>
            <Button type="submit" className="w-full">Я ознакомлен с правилами</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
