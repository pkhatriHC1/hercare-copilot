import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, ClipboardList, Stethoscope } from "lucide-react";
import { Badge, Button, PageHeader, Tabs } from "@hc1com/design-system";
import { PageTemplate } from "@hc1com/design-system/patterns";
import { dueDateLabel, formatDate, gestationalAge, nextVisit, visitsForEpisode } from "../mock/episodes";
import { VisitsZone } from "../visits/VisitsZone";
import { POSTPARTUM_WINDOW_DAYS, daysPostpartum } from "../lib/postpartum";
import { CarePlan } from "./CarePlan";
import { OverviewZone } from "./OverviewZone";

/** Patient header facts for the episode: next visit, provider, MRN, age, GA or delivery, EDD or postpartum age, obstetric history. */
function metaFor(p, episode) {
  const ga = episode ? gestationalAge(episode) : null;
  const next = episode ? nextVisit(visitsForEpisode(episode.id)) : null;
  const due = episode ? dueDateLabel(episode) : null;
  const delivered = due?.kind === "delivered";
  const gaLabel = ga ? (ga.postpartum ? `${ga.weeks} weeks postpartum` : `${ga.weeks}w${ga.days}d`) : p.gestAge;
  return [
    ["Visit date", next ? formatDate(next.date) : "No upcoming visit"],
    [null, p.provider],
    [null, `MRN ${p.id}`],
    [null, `Age ${p.age}`],
    [delivered ? "Delivered" : "GA", delivered ? formatDate(episode.deliveryDate || episode.edd) : gaLabel],
    [delivered ? "Postpartum" : "EDD", delivered ? `${ga.weeks} weeks postpartum` : episode ? formatDate(episode.edd) : p.edd],
    ["Obstetric history", episode ? `G${episode.gravida}P${episode.para}` : p.parity],
  ];
}

/**
 * One patient episode: header, then clinical decision support, optimization recommendations and visits.
 * onCancelVisit(target) opens the cancel dialog for a visit.
 */
export function PatientWorkspace({ patient: p, episode, defaultZone = "overview", onBack, onOpenMhr, onCancelVisit }) {
  const [zone, setZone] = useState(defaultZone);
  useEffect(() => { setZone(defaultZone); }, [p.id, episode?.id, defaultZone]);

  return (
    <PageTemplate>
      <PageHeader
        breadcrumb={<Button variant="link" size="sm" className="px-0" onClick={onBack}><ArrowLeft /> Back to worklist</Button>}
        title={
          <span className="inline-flex flex-wrap items-center gap-12">
            {p.name}
            {episode?.status === "postpartum" && <Badge variant="info" appearance="soft" size="sm">Postpartum · day {daysPostpartum(episode) ?? "—"} of {POSTPARTUM_WINDOW_DAYS}</Badge>}
            {episode?.postpartum && <Badge variant="neutral" appearance="soft" size="sm">{episode.postpartum.outcome}{episode.postpartum.deliveryType ? ` · ${episode.postpartum.deliveryType}` : ""}</Badge>}
            {episode?.postpartum?.readmission && <Badge variant="danger" appearance="solid" size="sm">Readmitted {formatDate(episode.postpartum.readmission.date)}</Badge>}
          </span>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-x-8 gap-y-4">
            {metaFor(p, episode).map(([k, v], i) => (
              <span key={i} className="inline-flex items-center gap-4">
                {i > 0 && <span aria-hidden className="pr-4 text-[color:var(--hc-color-text-tertiary)]">·</span>}
                {k && <span className="font-medium text-[color:var(--hc-color-text-primary)]">{k}</span>}
                <span className="tabular-nums">{v}</span>
              </span>
            ))}
          </span>
        }
        tabs={
          <Tabs value={zone} onValueChange={setZone} ariaLabel="Patient sections">
            <Tabs.List>
              <Tabs.Tab value="overview" icon={<Stethoscope />}>Clinical decision support</Tabs.Tab>
              <Tabs.Tab value="cp" icon={<ClipboardList />}>Optimization recommendations</Tabs.Tab>
              <Tabs.Tab value="visits" icon={<CalendarDays />}>Visits</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        }
      />

      {zone === "overview" && <OverviewZone p={p} onNavigate={setZone} onOpenMhr={() => onOpenMhr(p)} />}
      {zone === "cp" && <CarePlan key={p.id} p={p} />}
      {zone === "visits" && <VisitsZone episode={episode} onCancelVisit={v => onCancelVisit({ visit: v, patient: p, episode })} />}
    </PageTemplate>
  );
}
