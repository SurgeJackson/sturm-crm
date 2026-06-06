"use client";

import { useActionState, useMemo, useState } from "react";
import type { CommercialProposal, User } from "@/generated/prisma/client";
import {
  FormMessage,
  FormSection,
  TextareaField
} from "@/components/crm/form-fields";
import { FormActions } from "@/components/crm/form-actions";
import {
  ProposalCommercialFields,
  ProposalDealFields,
  ProposalDeliveryFields,
  type ProposalDealOption
} from "@/components/proposals/proposal-form-sections";
import type { ProposalActionState } from "@/modules/proposals/actions";

type ProposalFormProps = {
  action: (state: ProposalActionState, formData: FormData) => Promise<ProposalActionState>;
  proposal?: CommercialProposal;
  deals: ProposalDealOption[];
  users: Pick<User, "id" | "name" | "email">[];
  currentUserId: string;
  canChangeResponsible: boolean;
  preselectedDealId?: string;
  submitLabel: string;
};

const initialState: ProposalActionState = {};

export function ProposalForm({
  action,
  proposal,
  deals,
  users,
  currentUserId,
  canChangeResponsible,
  preselectedDealId,
  submitLabel
}: ProposalFormProps) {
  const [state, formAction, isPending] = useActionState(action, initialState);
  const initialDealId = proposal?.dealId ?? preselectedDealId ?? "";
  const [dealId, setDealId] = useState(initialDealId);
  const [responsibleId, setResponsibleId] = useState(proposal?.responsibleId ?? currentUserId);
  const [status, setStatus] = useState(proposal?.status ?? "DRAFT");
  const dealsById = useMemo(() => new Map(deals.map((deal) => [deal.id, deal])), [deals]);
  const selectedDeal = dealsById.get(dealId);
  const isSent = status === "SENT";
  const isDeclined = status === "DECLINED";

  function onDealChange(nextDealId: string) {
    setDealId(nextDealId);
    const nextDeal = dealsById.get(nextDealId);
    if (nextDeal) setResponsibleId(nextDeal.responsibleId);
  }

  return (
    <form action={formAction} className="grid gap-5">
      <FormMessage state={state} />

      <FormSection>
        <ProposalDealFields
          state={state}
          deals={deals}
          dealId={dealId}
          onDealChange={onDealChange}
          users={users}
          responsibleId={responsibleId}
          setResponsibleId={setResponsibleId}
          canChangeResponsible={canChangeResponsible}
          selectedDeal={selectedDeal}
        />
        <ProposalCommercialFields
          state={state}
          proposal={proposal}
          selectedDeal={selectedDeal}
          status={status}
          setStatus={setStatus}
          isSent={isSent}
        />
        <ProposalDeliveryFields state={state} proposal={proposal} isSent={isSent} isDeclined={isDeclined} />
      </FormSection>

      <TextareaField name="comment" label="Комментарий" defaultValue={proposal?.comment ?? ""} />

      <FormActions isPending={isPending} submitLabel={submitLabel} />
    </form>
  );
}
