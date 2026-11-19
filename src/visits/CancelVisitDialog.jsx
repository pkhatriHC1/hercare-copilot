import { useState } from "react";
import { X } from "lucide-react";
import { Button, Dialog, Radio, RadioGroup } from "@hc1com/design-system";
import { CANCELLATION_REASONS } from "../lib/clinical";
import { formatDate, gaAtVisit } from "../mock/episodes";

function Field({ label, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">{label}</span>
      <span className="text-14 font-medium text-[color:var(--hc-color-text-primary)]">{children}</span>
    </div>
  );
}

/** Cancel one visit with a required reason. onCancel(reason) confirms; onKeep closes. */
export function CancelVisitDialog({ visit, patient, episode, onCancel, onKeep }) {
  const [reason, setReason] = useState("");
  const ga = episode ? gaAtVisit(episode, visit.date) : null;
  const gaText = ga ? (ga.postpartum ? `${ga.weeks}w postpartum` : ga.label) : null;

  return (
    <Dialog open onOpenChange={o => { if (!o) onKeep(); }}>
      <Dialog.Content size="md">
        <Dialog.Header>
          <Dialog.Title>Cancel visit</Dialog.Title>
          <Dialog.Description>
            {formatDate(visit.date)} · {patient.name} · MRN {patient.id}{gaText ? ` · ${gaText}` : ""}
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Body className="flex flex-col gap-24 [&>*]:shrink-0">
          <RadioGroup
            label={<>Cancellation reason <span className="text-[color:var(--hc-color-status-error-fg)]" aria-hidden>*</span></>}
            aria-required="true"
            value={reason}
            onValueChange={setReason}
            name="visit-cancellation-reason"
          >
            {CANCELLATION_REASONS.map(r => <Radio key={r} value={r}>{r}</Radio>)}
          </RadioGroup>
          <div className="grid grid-cols-3 gap-16 rounded-[var(--hc-radius-8)] bg-[color:var(--hc-color-bg-subtle)] p-16">
            <Field label="Visit type">{visit.type}</Field>
            <Field label="Provider">{visit.provider}</Field>
            <Field label="Location">{visit.location}</Field>
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Actions>
            <Button variant="outline" size="sm" onClick={onKeep}>Keep visit</Button>
            <Button variant="destructive" size="sm" onClick={() => onCancel(reason)} disabled={!reason}><X /> Cancel visit</Button>
          </Dialog.Actions>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
