import { CalendarClock, ClipboardList, ExternalLink, MapPin, X } from "lucide-react";
import { Badge, Button, Dialog, Tooltip } from "@hc1com/design-system";
import { formatDate, gaAtVisit } from "../mock/episodes";

const FLAG_VARIANT = { critical: "danger", high: "warning", low: "neutral" };
const STATUS = { scheduled: ["Scheduled", "info"], completed: ["Completed", "success"], cancelled: ["Cancelled", "neutral"] };

function Section({ label, children }) {
  return (
    <section className="flex flex-col gap-8">
      <h3 className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">{label}</h3>
      {children}
    </section>
  );
}

/** Coming-soon action: disabled button with a tooltip. */
function Soon({ children }) {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <span tabIndex={0} className="inline-flex"><Button variant="outline" size="sm" disabled>{children}</Button></span>
      </Tooltip.Trigger>
      <Tooltip.Content>Coming soon</Tooltip.Content>
    </Tooltip>
  );
}

/** One visit: where, why, orders, results and follow-up, with visit actions for scheduled visits. */
export function VisitDetailDialog({ visit, episode, onClose, onCancelVisit }) {
  const isFuture = visit.status === "scheduled";
  const isPast = visit.status === "completed";
  const ga = episode ? gaAtVisit(episode, visit.date) : null;
  const gaText = ga ? (ga.postpartum ? `${ga.weeks}w postpartum` : ga.label) : "—";
  const [statusLabel, statusVariant] = STATUS[visit.status] ?? STATUS.completed;

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <Dialog.Content size="md">
        <Dialog.Header>
          <Dialog.Title>
            <span className="inline-flex flex-wrap items-center gap-8">
              {visit.type}
              <Badge variant={statusVariant} appearance="soft" size="sm">{statusLabel}</Badge>
            </span>
          </Dialog.Title>
          <Dialog.Description>{formatDate(visit.date)} · {gaText} · {visit.provider}</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body className="flex flex-col gap-24 [&>*]:shrink-0">
          <Section label="Location">
            <span className="flex items-center gap-8 text-14 text-[color:var(--hc-color-text-primary)]">
              <MapPin className="size-16 shrink-0 text-[color:var(--hc-color-text-tertiary)]" aria-hidden /> {visit.location}
            </span>
          </Section>
          {visit.reason && (
            <Section label="Reason / purpose">
              <p className="text-14 text-[color:var(--hc-color-text-primary)]">{visit.reason}</p>
            </Section>
          )}
          {visit.orders?.length > 0 && (
            <Section label={`Orders requested (${visit.orders.length})`}>
              <ul className="flex flex-col gap-8">
                {visit.orders.map(o => (
                  <li key={o.label || o} className="flex items-center gap-8 text-14 text-[color:var(--hc-color-text-primary)]">
                    <ClipboardList className="size-16 shrink-0 text-[color:var(--hc-color-action-primary)]" aria-hidden /> {o.label || o}
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {isPast && visit.results?.length > 0 && (
            <Section label={`Results (${visit.results.length})`}>
              <ul className="flex flex-col divide-y divide-[color:var(--hc-color-border-subtle)] rounded-[var(--hc-radius-8)] border border-[color:var(--hc-color-border-subtle)]">
                {visit.results.map(r => (
                  <li key={r.label} className="flex items-center justify-between gap-12 px-12 py-8">
                    <span className="text-14 text-[color:var(--hc-color-text-primary)]">{r.label}</span>
                    <span className="flex items-center gap-8">
                      <span className="text-14 font-semibold tabular-nums text-[color:var(--hc-color-text-primary)]">{r.value}</span>
                      {r.flag && <Badge variant={FLAG_VARIANT[r.flag] ?? "success"} appearance="soft" size="xs">{r.flag}</Badge>}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          {visit.followUpReason && (
            <Section label="Follow-up reason">
              <p className="text-14 text-[color:var(--hc-color-text-primary)]">{visit.followUpReason}</p>
            </Section>
          )}
          {visit.summary && (
            <Section label="Summary">
              <p className="text-14 text-[color:var(--hc-color-text-primary)]">{visit.summary}</p>
            </Section>
          )}
          <Button variant="link" size="sm" className="self-start px-0" onClick={e => e.preventDefault()}>
            <ExternalLink /> View in Epic
          </Button>
        </Dialog.Body>
        {isFuture && (
          <Dialog.Footer>
            <Dialog.Actions className="w-full">
              <Button variant="destructive" size="sm" className="mr-auto" onClick={() => { onClose(); onCancelVisit(visit); }}>
                <X /> Cancel visit
              </Button>
              <Soon><CalendarClock /> Reschedule</Soon>
              <Soon>Confirm</Soon>
            </Dialog.Actions>
          </Dialog.Footer>
        )}
      </Dialog.Content>
    </Dialog>
  );
}
