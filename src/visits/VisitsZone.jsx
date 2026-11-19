import { useState } from "react";
import { CalendarDays, CheckCircle2, ChevronRight, Clock, MapPin, Plus, User } from "lucide-react";
import { Alert, Badge, Button, Card, Tooltip } from "@hc1com/design-system";
import { formatDate, futureVisits, gaAtVisit, nextVisit, pastVisits, visitOneLiner, visitsForEpisode } from "../mock/episodes";
import { VisitDetailDialog } from "./VisitDetailDialog";

function ScheduleSoon() {
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <span tabIndex={0} className="inline-flex">
          <Button variant="outline" size="sm" disabled><Plus /> Schedule visit</Button>
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content>Scheduling write-back to Epic is coming soon</Tooltip.Content>
    </Tooltip>
  );
}

function SectionTitle({ icon, label, count, end }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <h2 className="flex items-center gap-8 text-16 font-semibold text-[color:var(--hc-color-text-primary)]">
        {icon} {label}
        {count != null && <Badge variant="neutral" appearance="soft" size="xs">{count}</Badge>}
      </h2>
      {end}
    </div>
  );
}

function VisitRow({ v, ep, isNext, onOpen }) {
  const ga = ep ? gaAtVisit(ep, v.date) : null;
  const gaText = ga ? (ga.postpartum ? `${ga.weeks}w PP` : ga.label) : "";
  const done = v.status === "completed" || v.status === "cancelled";
  const cancelled = v.status === "cancelled";
  return (
    <button
      type="button"
      onClick={() => onOpen(v)}
      className={`flex w-full items-center gap-16 rounded-[var(--hc-radius-12)] border px-16 py-12 text-left hover:bg-[color:var(--hc-color-bg-subtle)] focus-visible:outline-2 focus-visible:outline-[color:var(--hc-color-border-focus)] ${
        isNext ? "border-[color:var(--hc-color-action-primary)] bg-[color:var(--hc-color-brand-50)]"
          : cancelled ? "border-[color:var(--hc-color-border-subtle)] bg-[color:var(--hc-color-bg-subtle)]"
          : "border-[color:var(--hc-color-border-subtle)] bg-[color:var(--hc-color-bg-surface)]"
      }`}
    >
      <span className="flex w-128 shrink-0 flex-col gap-4 border-r border-[color:var(--hc-color-border-subtle)] pr-16">
        <span className="text-14 font-semibold tabular-nums text-[color:var(--hc-color-text-primary)]">{formatDate(v.date)}</span>
        {done && gaText && <span className="text-12 text-[color:var(--hc-color-text-supporting)]">{gaText}</span>}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-4">
        <span className="flex flex-wrap items-center gap-8">
          <span className="text-14 font-semibold text-[color:var(--hc-color-action-primary)]">{v.type}</span>
          {isNext && <Badge variant="primary" appearance="solid" size="xs">Next</Badge>}
          {cancelled && <Badge variant="neutral" appearance="soft" size="xs">Cancelled</Badge>}
          {cancelled && v.cancellationReason && <span className="text-12 text-[color:var(--hc-color-text-supporting)]">{v.cancellationReason}</span>}
        </span>
        <span className="truncate text-14 text-[color:var(--hc-color-text-secondary)]">{visitOneLiner(v)}</span>
        <span className="flex flex-wrap items-center gap-12 text-12 text-[color:var(--hc-color-text-supporting)]">
          <span className="inline-flex items-center gap-4"><User className="size-12" aria-hidden />{v.provider}</span>
          <span className="inline-flex items-center gap-4"><MapPin className="size-12" aria-hidden />{v.location}</span>
        </span>
      </span>
      <ChevronRight className="size-16 shrink-0 text-[color:var(--hc-color-text-tertiary)]" aria-hidden />
    </button>
  );
}

function EmptyRow({ children }) {
  return <p className="rounded-[var(--hc-radius-12)] bg-[color:var(--hc-color-bg-subtle)] px-16 py-12 text-14 text-[color:var(--hc-color-text-supporting)]">{children}</p>;
}

/** Visits tab: next, future and past visits for the selected episode. */
export function VisitsZone({ episode: ep, onCancelVisit }) {
  const [selected, setSelected] = useState(null);
  const all = ep ? visitsForEpisode(ep.id) : [];
  const nv = nextVisit(all);
  const future = futureVisits(all);
  const past = pastVisits(all);

  return (
    <Card variant="default" density="comfortable">
      <Card.Content className="flex flex-col gap-24">
        <section className="flex flex-col gap-12">
          <SectionTitle icon={<Clock className="size-16 text-[color:var(--hc-color-action-primary)]" aria-hidden />} label="Next visit" end={<ScheduleSoon />} />
          {nv ? (
            <VisitRow v={nv} ep={ep} isNext onOpen={setSelected} />
          ) : (
            <Alert variant="warning">
              <Alert.Title>No upcoming visit</Alert.Title>
              <Alert.Description>There's a scheduling gap to chase for this episode.</Alert.Description>
            </Alert>
          )}
        </section>

        <section className="flex flex-col gap-12">
          <SectionTitle icon={<CalendarDays className="size-16 text-[color:var(--hc-color-text-tertiary)]" aria-hidden />} label="Future visits" count={future.length} />
          {future.length === 0 ? <EmptyRow>No upcoming visits</EmptyRow> : (
            <div className="flex flex-col gap-8">{future.map(v => <VisitRow key={v.id} v={v} ep={ep} onOpen={setSelected} />)}</div>
          )}
        </section>

        <section className="flex flex-col gap-12">
          <SectionTitle icon={<CheckCircle2 className="size-16 text-[color:var(--hc-color-status-success-fg)]" aria-hidden />} label="Past visits" count={past.length} />
          {past.length === 0 ? <EmptyRow>No past visits</EmptyRow> : (
            <div className="flex flex-col gap-8">{past.map(v => <VisitRow key={v.id} v={v} ep={ep} onOpen={setSelected} />)}</div>
          )}
        </section>
      </Card.Content>

      {selected && <VisitDetailDialog visit={selected} episode={ep} onClose={() => setSelected(null)} onCancelVisit={onCancelVisit} />}
    </Card>
  );
}
