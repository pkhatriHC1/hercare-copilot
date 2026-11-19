import { useMemo, useState } from "react";
import { MoreHorizontal, Search, X } from "lucide-react";
import { Badge, Button, DropdownMenu, EmptyState, PageHeader, Select, Table } from "@hc1com/design-system";
import { FilterBar, PageTemplate } from "@hc1com/design-system/patterns";
import { CASE_TYPES, FACILITIES, PATIENTS } from "../lib/clinical";
import { VISIT_TYPES, formatDate, getActiveEpisodes } from "../mock/episodes";
import { DateRangeFilter, MultiFilter, toIso } from "../shared/filters";
import { MhrScore, Readings, bpTone, careStatus, findLab, isMissing, labTone } from "../shared/clinical-ui";

const CASE_TYPE_OPTIONS = CASE_TYPES.slice(1).map(o => ({ value: o, label: o }));
const VISIT_TYPE_OPTIONS = VISIT_TYPES.map(o => ({ value: o, label: o }));
const STATUS_OPTIONS = ["All", "Active", "In Progress", "Not Started", "Complete", "Inactive", "Cancelled"].map(o => ({ value: o, label: o }));
const STATUS_MAP = { "In Progress": "in-progress", "Not Started": "pending", Complete: "complete", Inactive: "inactive", Cancelled: "cancelled" };
const SEVERITY_OPTIONS = ["Low", "Intermediate", "High", "Very High"].map(o => ({ value: o, label: o }));
const SEVERITY_RANK = { Low: 1, Intermediate: 2, High: 3, "Very High": 4 };
const SORT_OPTIONS = [
  { value: "Next Visit Date", label: "Sort: Next visit" },
  { value: "Severity", label: "Sort: Severity" },
];

/** Patients' active pregnancy episodes, one row each. */
function episodeRows() {
  return getActiveEpisodes()
    .map(ep => {
      const patient = PATIENTS.find(p => p.id === ep.patientId);
      return patient ? { ...patient, _ep: ep } : null;
    })
    .filter(Boolean);
}

/**
 * HerCare worklist. onOpen(patient, zone, episodeId) opens the patient; onOpenMhr(patient) shows the
 * maternal health risk breakdown; onCancelVisit(target) cancels the episode's next visit.
 */
export function PatientWorklist({ onOpen, onOpenMhr, onCancelVisit }) {
  const [search, setSearch] = useState("");
  const [facilities, setFacilities] = useState(FACILITIES);
  const [caseType, setCaseType] = useState(undefined);
  const [visitType, setVisitType] = useState(undefined);
  const [status, setStatus] = useState("Active");
  const [severity, setSeverity] = useState(undefined);
  const [start, setStart] = useState(undefined);
  const [end, setEnd] = useState(undefined);
  const [sortBy, setSortBy] = useState("Next Visit Date");

  const all = episodeRows();
  const filtersActive = search !== "" || facilities.length !== FACILITIES.length || caseType || visitType
    || status !== "Active" || severity || start || end;
  const reset = () => {
    setSearch(""); setFacilities(FACILITIES); setCaseType(undefined); setVisitType(undefined);
    setStatus("Active"); setSeverity(undefined); setStart(undefined); setEnd(undefined);
  };

  const rows = useMemo(() => {
    const q = search.toLowerCase(); const s = toIso(start); const e = toIso(end);
    const filtered = all.filter(p => {
      const nv = p._ep.nextVisit;
      const statusOk = status === "All" || p.carePlanStatus === STATUS_MAP[status]
        || (status === "Active" && (p.carePlanStatus === "in-progress" || p.carePlanStatus === "generated"));
      return facilities.includes(p.facility)
        && (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.provider.toLowerCase().includes(q))
        && (!caseType || p.caseType === caseType)
        && statusOk
        && (!severity || p._mhr.cat === severity)
        && (!visitType || (nv && nv.type === visitType))
        && (!s || !nv || nv.date >= s) && (!e || !nv || nv.date <= e);
    });
    return sortBy === "Severity"
      ? [...filtered].sort((a, b) => (SEVERITY_RANK[b._mhr.cat] || 0) - (SEVERITY_RANK[a._mhr.cat] || 0))
      : [...filtered].sort((a, b) => (a._ep.nextVisit?.date ?? "9999-12-31").localeCompare(b._ep.nextVisit?.date ?? "9999-12-31"));
  }, [all, search, facilities, caseType, visitType, status, severity, start, end, sortBy]);

  const firstVisit = all.map(p => p._ep.nextVisit?.date).filter(Boolean).sort()[0];

  return (
    <PageTemplate>
      <PageHeader
        title="Patient worklist"
        subtitle="Pregnancy episodes screened for anemia and maternal health risk"
        actions={<Select aria-label="Sort by" options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} size="sm" fullWidth={false} />}
      />

      <div className="flex flex-col gap-16">
        <FilterBar onClearAll={filtersActive ? reset : undefined}>
          <FilterBar.Search
            aria-label="Search patients, MRN or provider"
            placeholder="Search patients, MRN, provider"
            width={150}
            value={search}
            onChange={e => setSearch(e.target.value)}
            onClear={() => setSearch("")}
          />
          <MultiFilter label="Facility" options={FACILITIES} selected={facilities} onChange={setFacilities} />
          <FilterBar.Filter label="Case type" value={caseType} onChange={v => setCaseType(v || undefined)} options={CASE_TYPE_OPTIONS} width={150} />
          <FilterBar.Filter label="Visit type" value={visitType} onChange={v => setVisitType(v || undefined)} options={VISIT_TYPE_OPTIONS} width={140} />
          <DateRangeFilter
            label="Date"
            shortLabel="Visit"
            from={start}
            to={end}
            defaultMonth={firstVisit ? new Date(`${firstVisit}T00:00:00`) : undefined}
            onChange={(f, t) => { setStart(f); setEnd(t); }}
          />
          <FilterBar.Filter label="Status" value={status} onChange={v => setStatus(v || "Active")} options={STATUS_OPTIONS} width={140} />
          <FilterBar.Filter label="Risk" value={severity} onChange={v => setSeverity(v || undefined)} options={SEVERITY_OPTIONS} width={130} />
        </FilterBar>

        {rows.length === 0 ? (
          <EmptyState variant="search" layout="contained">
            <EmptyState.Icon><Search /></EmptyState.Icon>
            <EmptyState.Title>No patients match</EmptyState.Title>
            <EmptyState.Description>Try a different search, or clear the filters.</EmptyState.Description>
            {filtersActive && (
              <EmptyState.Actions>
                <Button variant="outline" size="sm" onClick={reset}>Clear filters</Button>
              </EmptyState.Actions>
            )}
          </EmptyState>
        ) : (
          <Table density="relaxed">
            <Table.Content className="[&_table]:table-fixed">
              <Table.Header>
                <Table.Row>
                  <Table.Head width="21%">Patient</Table.Head>
                  <Table.Head width="17%">Next visit</Table.Head>
                  <Table.Head width="15%">Labs and BP</Table.Head>
                  <Table.Head width="11%">Risk score</Table.Head>
                  <Table.Head>Active order</Table.Head>
                  <Table.Head width="10%">Provider</Table.Head>
                  <Table.Head width={48}><span className="sr-only">Actions</span></Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map(p => (
                  <PatientRow key={p._ep.id} p={p} onOpen={onOpen} onOpenMhr={onOpenMhr} onCancelVisit={onCancelVisit} />
                ))}
              </Table.Body>
            </Table.Content>
          </Table>
        )}

        <p className="text-12 text-[color:var(--hc-color-text-supporting)]">Showing {rows.length} of {all.length} episodes</p>
      </div>
    </PageTemplate>
  );
}

function PatientRow({ p, onOpen, onOpenMhr, onCancelVisit }) {
  const ep = p._ep;
  const nv = ep.nextVisit;
  /* As in the original: a missing upcoming visit is highlighted, except for Ashley Thompson. */
  const highlight = ep.hasNoUpcoming && p.name !== "Ashley Thompson";
  const ferritin = findLab(p, "Ferritin");
  const tsat = findLab(p, "Transferrin Sat");
  const cs = careStatus(p);

  return (
    <Table.Row
      onClick={() => onOpen(p, "overview", ep.id)}
      className={highlight ? "bg-[color:var(--hc-color-status-warning-bg)]" : undefined}
    >
      <Table.Cell truncate={false}>
        <div className="flex flex-col gap-4">
          <span className="text-16 font-semibold text-[color:var(--hc-color-text-primary)]">{p.name}</span>
          <span className="text-14 tabular-nums text-[color:var(--hc-color-text-supporting)]">MRN {p.id} · Age {p.age}</span>
          <span className="text-14 tabular-nums text-[color:var(--hc-color-text-supporting)]">
            {ep.parityLabel} · {ep.gaLabel} · {ep.due.label}
          </span>
          <div className="flex flex-wrap gap-4 pt-4">
            <Badge variant="neutral" appearance="outline" size="sm">{ep.obType}</Badge>
            {ep.status === "postpartum" && ep.obType !== "Postpartum" && <Badge variant="info" appearance="soft" size="sm">Postpartum</Badge>}
          </div>
        </div>
      </Table.Cell>
      <Table.Cell truncate={false}>
        {ep.hasNoUpcoming ? (
          <Badge variant="warning" appearance="soft" size="sm">No upcoming visit</Badge>
        ) : nv ? (
          <div className="flex min-w-0 flex-col gap-4">
            <span className="text-14 font-semibold tabular-nums text-[color:var(--hc-color-text-primary)]">{formatDate(nv.date)}</span>
            <span className="text-14 font-medium text-[color:var(--hc-color-action-primary)]">{nv.type}</span>
            <span className="text-12 text-[color:var(--hc-color-text-supporting)]">{nv.provider} · {nv.location}</span>
          </div>
        ) : "—"}
      </Table.Cell>
      <Table.Cell truncate={false}>
        <Readings items={[
          { label: "Hgb", value: p.labs[0].value, unit: "g/dL", tone: labTone(p.labs[0].status) },
          { label: "Ferritin", value: ferritin?.value, unit: "ng/mL", tone: labTone(ferritin?.status), missing: isMissing(ferritin) },
          { label: "TSAT", value: tsat?.value, unit: "%", tone: labTone(tsat?.status), missing: isMissing(tsat) },
          { label: "BP", value: p.bp, unit: "mmHg", tone: bpTone(p.bp) },
        ]} />
      </Table.Cell>
      <Table.Cell truncate={false} onClick={e => e.stopPropagation()}>
        <button
          type="button"
          className="rounded-[var(--hc-radius-8)] focus-visible:outline-2 focus-visible:outline-[color:var(--hc-color-border-focus)]"
          aria-label={`Maternal health risk score ${p._mhr.score} of ${p._mhr.maxPossible}, ${p._mhr.cat}. Show breakdown`}
          onClick={() => onOpenMhr(p)}
        >
          <MhrScore mhr={p._mhr} size="md" />
        </button>
      </Table.Cell>
      <Table.Cell truncate={false}>
        <div className="flex flex-col items-start gap-8">
          {cs && <Badge variant={cs.variant} appearance="soft" size="sm">{cs.label}</Badge>}
          {p.activeRecommendation !== null && p.carePlanStatus !== "pending" && p.order && (
            <span className="text-14 text-[color:var(--hc-color-text-secondary)]">{p.order}</span>
          )}
        </div>
      </Table.Cell>
      <Table.Cell className="font-medium">{p.provider}</Table.Cell>
      <Table.Cell truncate={false} className="text-right" onClick={e => e.stopPropagation()}>
        {nv && (
          <DropdownMenu>
            <DropdownMenu.Trigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${p.name}`}><MoreHorizontal /></Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content size="sm" align="end">
              <DropdownMenu.Item destructive onSelect={() => onCancelVisit({ visit: nv, patient: p, episode: ep })}>
                <X /> Cancel visit
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        )}
      </Table.Cell>
    </Table.Row>
  );
}
