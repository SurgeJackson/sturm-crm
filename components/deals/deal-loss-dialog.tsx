"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { dealLossReasonOptions } from "@/modules/crm/options";

type DealLossDialogProps = {
  action: (formData: FormData) => Promise<void>;
};

export function DealLossDialog({ action }: DealLossDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive">Закрыть как проигранную</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Причина проигрыша</DialogTitle>
        </DialogHeader>
        <form action={action} className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lossReason">Причина *</Label>
            <NativeSelect id="lossReason" name="lossReason" required>
              <option value="">Выберите причину</option>
              {dealLossReasonOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </NativeSelect>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lossComment">Комментарий</Label>
            <Textarea id="lossComment" name="lossComment" />
          </div>
          <Button type="submit" variant="destructive">Закрыть как проигранную</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
