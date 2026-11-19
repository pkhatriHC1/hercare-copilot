import { useState } from "react";
import { Alert, Badge, Button, DatePicker, Dialog, Select } from "@hc1com/design-system";
import { OUTCOMES, PROCEDURE_CODES, codeLabel, confirmDelivery, dismissConfirmation, suggestedOutcome } from "../lib/postpartum";
import { formatDate } from "../mock/episodes";

const toIso = d => (d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}` : "");
const typeOptions = outcome => [...new Set(Object.values(PROCEDURE_CODES).filter(c => c.outcome === outcome && c.deliveryType).map(c => c.deliveryType))]
  .map(t => ({ value: t, label: t }));

/** AC4: a delivery diagnosis arrived with no procedure code. The user confirms the date and outcome before the move. */
export function ConfirmDeliveryDialog({ item, patient, onClose }) {
  const [date, setDate] = useState(new Date(`${item.date}T00:00:00`));
  const [outcome, setOutcome] = useState(suggestedOutcome(item.codes) || undefined);
  const [deliveryType, setDeliveryType] = useState(undefined);
  const types = outcome ? typeOptions(outcome) : [];

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <Dialog.Content size="md">
        <Dialog.Header>
          <Dialog.Title>Confirm end of pregnancy</Dialog.Title>
          <Dialog.Description>{patient.name} · MRN {patient.id}</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body className="flex flex-col gap-24 [&>*]:shrink-0">
          <Alert variant="info">
            <Alert.Title>A delivery diagnosis was received without a procedure code</Alert.Title>
            <Alert.Description>
              The patient was not moved automatically. Confirm the delivery date and outcome to move her to the Postpartum worklist.
            </Alert.Description>
          </Alert>
          <div className="flex flex-col gap-8">
            <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">Received {formatDate(item.date)} · encounter {item.encounterId}</span>
            <div className="flex flex-wrap gap-8">
              {item.codes.map(c => <Badge key={c} variant="neutral" appearance="soft" size="sm">{c} · {codeLabel(c)}</Badge>)}
            </div>
          </div>
          <div className="flex flex-col gap-8">
            <span className="text-14 font-medium text-[color:var(--hc-color-text-primary)]">Delivery date (Day 0)</span>
            <DatePicker ariaLabel="Delivery date" value={date} onChange={setDate} />
          </div>
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
            <Select label="Outcome" required placeholder="Choose outcome" options={OUTCOMES.map(o => ({ value: o, label: o }))}
              value={outcome} onChange={v => { setOutcome(v); setDeliveryType(undefined); }} fullWidth />
            <Select label="Delivery type" optional placeholder={types.length ? "Choose type" : "Not applicable"} options={types}
              value={deliveryType} onChange={setDeliveryType} disabled={types.length === 0} fullWidth />
          </div>
        </Dialog.Body>
        <Dialog.Footer>
          <Dialog.Actions className="w-full">
            <Button variant="ghost" size="sm" className="mr-auto" onClick={() => { dismissConfirmation(item.id); onClose(); }}>Not an end of pregnancy</Button>
            <Button variant="outline" size="sm" onClick={onClose}>Later</Button>
            <Button variant="default" size="sm" disabled={!outcome || !date}
              onClick={() => { confirmDelivery(item.id, { day0: toIso(date), outcome, deliveryType }); onClose(); }}>
              Confirm and move to Postpartum
            </Button>
          </Dialog.Actions>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
