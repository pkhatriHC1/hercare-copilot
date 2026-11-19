import { useState } from "react";
import { Button, Dialog, Radio, RadioGroup, Textarea } from "@hc1com/design-system";
import { DISCHARGE_REASONS, dischargeFromPostpartum } from "../lib/postpartum";

/** AC10: discharge a patient from postpartum follow-up. The reason and date are logged. */
export function DischargeDialog({ patient, episode, onClose, onDone }) {
  const [reason, setReason] = useState("");
  const [other, setOther] = useState("");
  const final = reason === "Other" ? other.trim() : reason;
  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <Dialog.Content size="md">
        <Dialog.Header>
          <Dialog.Title>Discharge from postpartum follow-up</Dialog.Title>
          <Dialog.Description>{patient.name} · MRN {patient.id}. She leaves the Postpartum worklist and her scheduled follow-ups are cancelled.</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body className="flex flex-col gap-16 [&>*]:shrink-0">
          <RadioGroup
            label={<>Discharge reason <span className="text-[color:var(--hc-color-status-error-fg)]" aria-hidden>*</span></>}
            aria-required="true" value={reason} onValueChange={setReason} name="discharge-reason"
          >
            {[...DISCHARGE_REASONS, "Other"].map(r => <Radio key={r} value={r}>{r}</Radio>)}
          </RadioGroup>
          {reason === "Other" && (
            <Textarea label="Describe the reason" required rows={2} value={other} onChange={e => setOther(e.target.value)} />
          )}
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Actions>
            <Button variant="outline" size="sm" onClick={onClose}>Keep on worklist</Button>
            <Button variant="destructive" size="sm" disabled={!final}
              onClick={() => { dischargeFromPostpartum(episode.id, final); onDone?.(`${patient.name} was discharged from postpartum follow-up.`); onClose(); }}>
              Discharge
            </Button>
          </Dialog.Actions>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
