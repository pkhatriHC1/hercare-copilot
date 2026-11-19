import { useEffect, useMemo, useState } from "react";
import { BellDot, History, LogOut, MoreHorizontal, Search, X } from "lucide-react";
import { Alert, Badge, Button, DropdownMenu, EmptyState, PageHeader, Select, Table, Tabs, Tooltip } from "@hc1com/design-system";
import { FilterBar, PageTemplate } from "@hc1com/design-system/patterns";
import { CASE_TYPES, FACILITIES, PATIENTS } from "../lib/clinical";
import { VISIT_TYPES, formatDate, getActiveEpisodes } from "../mock/episodes";
import { DateRangeFilter, MultiFilter, toIso } from "../shared/filters";
import { MhrBadge, MhrScore, Readings, bpTone, careStatus, findLab, isMissing, labTone } from "../shared/clinical-ui";
import { OUTCOMES, POSTPARTUM_WINDOW_DAYS, daysPostpartum, getNotifications, getPendingConfirmations, pendingFor, postpartumReadings, unreadFor } from "../lib/postpartum";
import { ConfirmDeliveryDialog } from "../postpartum/ConfirmDeliveryDialog";
import { DischargeDialog } from "../postpartum/DischargeDialog";
import { DischargeLogDialog } from "../postpartum/DischargeLogDialog";

const CASE_TYPE_OPTIONS = CASE_TYPES.slice(1).map(o => ({ value: o, label: o }));
const VISIT_TYPE_OPTIONS = VISIT_TYPES.map(o => ({ value: o, label: o }));
const STATUS_OPTIONS = ["All", "Active", "In Progress", "Not Started", "Complete", "Inactive", "Cancelled"].map(o => ({ value: o, label: o }));
const STATUS_MAP = { "In Progress": "in-progress", "Not Started": "pending", Complete: "complete", Inactive: "inactive", Cancelled: "cancelled" };
const SEVERITY_OPTIONS = ["Low", "Intermediate", "High", "Very High"].map(o => ({ value: o, label: o }));
const OUTCOME_OPTIONS = OUTCOMES.map(o => ({ value: o, label: o }));
const OUTCOME_VARIANT = { Cesarean: "primary", Vaginal: "info", "Loss/Termination": "neutral", "Ectopic/Molar": "neutral" };
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
export function PatientWorklist({ onOpen, onOpenMhr, onCancelVisit, onToast, listRequest }) {
  const [list, setList] = useState("active");
  useEffect(() => { if (listRequest) setList(listRequest.list); }, [listRequest]);
  const [outcome, setOutcome] = useState(undefined);
  const [logOpen, setLogOpen] = useState(false);
  const [confirming, setConfirming] = useState(null);
  const [discharging, setDischarging] = useState(null);
  const [search, setSearch] = useState("");
  const [facilities, setFacilities] = useState(FACILITIES);
  const [caseType, setCaseType] = useState(undefined);
  const [visitType, setVisitType] = useState(undefined);
  const [status, setStatus] = useState("Active");
  const [severity, setSeverity] = useState(undefined);
  const [start, setStart] = useState(undefined);
  const [end, setEnd] = useState(undefined);
  const [sortBy, setSortBy] = useState("Next Visit Date");

  const everyone = episodeRows();
  const activeAll = everyone.filter(p => p._ep.status === "prenatal");
  const postpartumAll = everyone.filter(p => p._ep.status === "postpartum");
  const isPP = list === "postpartum";
  const all = isPP ? postpartumAll : activeAll;
  const pending = getPendingConfirmations();
  const unread = getNotifications().filter(n => !n.read);
  const bell = <BellDot className="text-[color:var(--hc-color-action-primary)]" aria-label="New changes from Epic" />;
  const filtersActive = search !== "" || facilities.length !== FACILITIES.length || visitType || start || end
    || (isPP ? outcome : caseType || status !== "Active" || severity);
  const reset = () => {
    setSearch(""); setFacilities(FACILITIES); setCaseType(undefined); setVisitType(undefined);
    setStatus("Active"); setSeverity(undefined); setStart(undefined); setEnd(undefined); setOutcome(undefined);
  };

  const rows = useMemo(() => {
    const q = search.toLowerCase(); const s = toIso(start); const e = toIso(end);
    const filtered = all.filter(p => {
      const nv = p._ep.nextVisit;
      const statusOk = status === "All" || p.carePlanStatus === STATUS_MAP[status]
        || (status === "Active" && (p.carePlanStatus === "in-progress" || p.carePlanStatus === "generated"));
      const listOk = isPP
        ? (!outcome || p._ep.postpartum?.outcome === outcome)
        : (!caseType || p.caseType === caseType) && statusOk && (!severity || p._mhr.cat === severity);
      return facilities.includes(p.facility)
        && (!q || p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q) || p.provider.toLowerCase().includes(q))
        && listOk
        && (!visitType || (nv && nv.type === visitType))
        && (!s || !nv || nv.date >= s) && (!e || !nv || nv.date <= e);
    });
    return sortBy === "Severity"
      ? [...filtered].sort((a, b) => (SEVERITY_RANK[b._mhr.cat] || 0) - (SEVERITY_RANK[a._mhr.cat] || 0))
      : [...filtered].sort((a, b) => (a._ep.nextVisit?.date ?? "9999-12-31").localeCompare(b._ep.nextVisit?.date ?? "9999-12-31"));
  }, [all, isPP, outcome, search, facilities, caseType, visitType, status, severity, start, end, sortBy]);

  const firstVisit = all.map(p => p._ep.nextVisit?.date).filter(Boolean).sort()[0];

  return (
    <PageTemplate>
      <PageHeader
        title="Patient worklist"
        subtitle={isPP
          ? `Patients in the ${POSTPARTUM_WINDOW_DAYS} days after the end of pregnancy`
          : "Pregnancy episodes screened for anemia and maternal health risk"}
        actions={
          <div className="flex flex-wrap items-center gap-8">
            {isPP && <Button variant="outline" size="sm" onClick={() => setLogOpen(true)}><History /> Discharge log</Button>}
            <Select aria-label="Sort by" options={SORT_OPTIONS} value={sortBy} onChange={setSortBy} size="sm" fullWidth={false} />
          </div>
        }
        tabs={
          <Tabs value={list} onValueChange={setList} ariaLabel="Worklists">
            <Tabs.List>
              <Tabs.Tab value="active" badge={activeAll.length} icon={unread.some(n => n.kind === "confirm") ? bell : undefined}>Active</Tabs.Tab>
              <Tabs.Tab value="postpartum" badge={postpartumAll.length} icon={unread.some(n => n.kind !== "confirm") ? bell : undefined}>Postpartum</Tabs.Tab>
            </Tabs.List>
          </Tabs>
        }
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
          {isPP
            ? <FilterBar.Filter label="Outcome" value={outcome} onChange={v => setOutcome(v || undefined)} options={OUTCOME_OPTIONS} width={170} />
            : <FilterBar.Filter label="Case type" value={caseType} onChange={v => setCaseType(v || undefined)} options={CASE_TYPE_OPTIONS} width={150} />}
          <FilterBar.Filter label="Visit type" value={visitType} onChange={v => setVisitType(v || undefined)} options={VISIT_TYPE_OPTIONS} width={140} />
          <DateRangeFilter
            label="Date"
            shortLabel="Visit"
            from={start}
            to={end}
            defaultMonth={firstVisit ? new Date(`${firstVisit}T00:00:00`) : undefined}
            onChange={(f, t) => { setStart(f); setEnd(t); }}
          />
          {!isPP && <FilterBar.Filter label="Status" value={status} onChange={v => setStatus(v || "Active")} options={STATUS_OPTIONS} width={140} />}
          {!isPP && <FilterBar.Filter label="Risk" value={severity} onChange={v => setSeverity(v || undefined)} options={SEVERITY_OPTIONS} width={130} />}
        </FilterBar>

        {!isPP && pending.length > 0 && (
          <Alert variant="warning">
            <Alert.Title>{pending.length} end of pregnancy {pending.length === 1 ? "record needs" : "records need"} confirming</Alert.Title>
            <Alert.Description>
              A delivery diagnosis arrived without a procedure code, so the patient was not moved. Confirm the delivery date and outcome.
            </Alert.Description>
            <Alert.Actions>
              {pending.map(item => {
                const pt = PATIENTS.find(x => x.id === item.patientId);
                return <Button key={item.id} variant="outline" size="sm" onClick={() => setConfirming(item)}>Confirm for {pt?.name}</Button>;
              })}
            </Alert.Actions>
          </Alert>
        )}

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
          isPP ? (
            <PostpartumTable rows={rows} onOpen={onOpen} onOpenMhr={onOpenMhr} onCancelVisit={onCancelVisit} onDischarge={setDischarging} />
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
                  <PatientRow key={p._ep.id} p={p} onOpen={onOpen} onOpenMhr={onOpenMhr} onCancelVisit={onCancelVisit} onConfirm={setConfirming} />
                ))}
              </Table.Body>
            </Table.Content>
          </Table>
          )
        )}

        <p className="text-12 text-[color:var(--hc-color-text-supporting)]">Showing {rows.length} of {all.length} episodes</p>
      </div>

      {logOpen && <DischargeLogDialog onClose={() => setLogOpen(false)} />}
      {confirming && (
        <ConfirmDeliveryDialog item={confirming} patient={PATIENTS.find(x => x.id === confirming.patientId)} onClose={() => setConfirming(null)} />
      )}
      {discharging && (
        <DischargeDialog patient={discharging} episode={discharging._ep} onClose={() => setDischarging(null)} onDone={onToast} />
      )}
    </PageTemplate>
  );
}

/** Small bell next to a patient HerCare changed from an Epic record that nobody has looked at yet. */
function RowBell({ episodeId }) {
  const n = unreadFor(episodeId);
  if (!n) return null;
  return (
    <Tooltip>
      <Tooltip.Trigger>
        <span tabIndex={0} aria-label={`${n.title}. ${n.detail}`} className="inline-flex rounded-full text-[color:var(--hc-color-action-primary)] focus-visible:outline-2 focus-visible:outline-[color:var(--hc-color-border-focus)]">
          <BellDot className="size-16" aria-hidden />
        </span>
      </Tooltip.Trigger>
      <Tooltip.Content maxWidth={280}>{n.title} · {n.detail}</Tooltip.Content>
    </Tooltip>
  );
}

function PatientRow({ p, onOpen, onOpenMhr, onCancelVisit, onConfirm }) {
  const toConfirm = pendingFor(p._ep.id);
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
          <span className="flex items-center gap-8"><span className="text-16 font-semibold text-[color:var(--hc-color-text-primary)]">{p.name}</span><RowBell episodeId={p._ep.id} /></span>
          <span className="text-14 tabular-nums text-[color:var(--hc-color-text-supporting)]">MRN {p.id} · Age {p.age}</span>
          <span className="text-14 tabular-nums text-[color:var(--hc-color-text-supporting)]">
            {ep.parityLabel} · {ep.gaLabel} · {ep.due.label}
          </span>
          <div className="flex flex-wrap gap-4 pt-4">
            <Badge variant="neutral" appearance="outline" size="sm">{ep.obType}</Badge>
            {toConfirm && (
              <Button variant="outline" size="xs" onClick={e => { e.stopPropagation(); onConfirm(toConfirm); }}>
                Delivery to confirm
              </Button>
            )}
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

/** AC2, AC5, AC8, AC9: postpartum rows — outcome, delivery, days postpartum, postpartum readings and the final antepartum risk. */
function PostpartumTable({ rows, onOpen, onOpenMhr, onCancelVisit, onDischarge }) {
  return (
    <Table density="relaxed">
      <Table.Content className="[&_table]:table-fixed">
        <Table.Header>
          <Table.Row>
            <Table.Head width="20%">Patient</Table.Head>
            <Table.Head width="16%">End of pregnancy</Table.Head>
            <Table.Head width="18%">Next follow-up</Table.Head>
            <Table.Head width="16%">Labs and BP</Table.Head>
            <Table.Head>Antepartum risk</Table.Head>
            <Table.Head width="10%">Provider</Table.Head>
            <Table.Head width={48}><span className="sr-only">Actions</span></Table.Head>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {rows.map(p => <PostpartumRow key={p._ep.id} p={p} onOpen={onOpen} onOpenMhr={onOpenMhr} onCancelVisit={onCancelVisit} onDischarge={onDischarge} />)}
        </Table.Body>
      </Table.Content>
    </Table>
  );
}

function PostpartumRow({ p, onOpen, onCancelVisit, onDischarge }) {
  const ep = p._ep;
  const pp = ep.postpartum;
  const nv = ep.nextVisit;
  const dpp = daysPostpartum(ep);
  const r = postpartumReadings(ep);
  const ante = pp?.antepartum;

  return (
    <Table.Row onClick={() => onOpen(p, "overview", ep.id)}>
      <Table.Cell truncate={false}>
        <div className="flex flex-col gap-4">
          <span className="flex items-center gap-8"><span className="text-16 font-semibold text-[color:var(--hc-color-text-primary)]">{p.name}</span><RowBell episodeId={p._ep.id} /></span>
          <span className="text-14 tabular-nums text-[color:var(--hc-color-text-supporting)]">MRN {p.id} · Age {p.age} · {ep.parityLabel}</span>
          <div className="flex flex-wrap gap-4 pt-4">
            {pp && <Badge variant={OUTCOME_VARIANT[pp.outcome] ?? "neutral"} appearance="soft" size="sm">{pp.outcome}</Badge>}
            {pp?.readmission && <Badge variant="danger" appearance="solid" size="sm">Readmitted {formatDate(pp.readmission.date)}</Badge>}
          </div>
        </div>
      </Table.Cell>
      <Table.Cell truncate={false}>
        {pp ? (
          <div className="flex flex-col gap-4">
            <span className="text-14 font-semibold tabular-nums text-[color:var(--hc-color-text-primary)]">{formatDate(pp.day0)}</span>
            {pp.deliveryType && <span className="text-14 text-[color:var(--hc-color-text-secondary)]">{pp.deliveryType}</span>}
            <span className="text-12 tabular-nums text-[color:var(--hc-color-text-supporting)]">Day {dpp} of {POSTPARTUM_WINDOW_DAYS} postpartum</span>
          </div>
        ) : "—"}
      </Table.Cell>
      <Table.Cell truncate={false}>
        {nv ? (
          <div className="flex min-w-0 flex-col gap-4">
            <span className="text-14 font-semibold tabular-nums text-[color:var(--hc-color-text-primary)]">{formatDate(nv.date)}</span>
            <span className="text-14 font-medium text-[color:var(--hc-color-action-primary)]">{nv.type}</span>
            <span className="text-12 text-[color:var(--hc-color-text-supporting)]">{nv.reason?.split(" — ")[0]}</span>
          </div>
        ) : <Badge variant="warning" appearance="soft" size="sm">No follow-up scheduled</Badge>}
      </Table.Cell>
      <Table.Cell truncate={false}>
        <Readings
          missingLabel="Awaiting"
          items={[
            { label: "Hgb", value: r.hgb?.value, unit: "g/dL", tone: labTone(r.hgb?.status), missing: !r.hgb },
            { label: "Ferritin", value: r.ferritin?.value, unit: "ng/mL", tone: labTone(r.ferritin?.status), missing: !r.ferritin },
            { label: "TSAT", value: r.tsat?.value, unit: "%", tone: labTone(r.tsat?.status), missing: !r.tsat },
            { label: "BP", value: r.bp?.value, unit: "mmHg", tone: r.bp ? bpTone(r.bp.value) : undefined, missing: !r.bp },
          ]}
        />
      </Table.Cell>
      <Table.Cell truncate={false}>
        {ante ? (
          <div className="flex flex-col items-start gap-4">
            <span className="flex items-center gap-8">
              <span className="text-16 font-semibold tabular-nums text-[color:var(--hc-color-text-primary)]">{ante.score}<span className="text-12 font-normal text-[color:var(--hc-color-text-supporting)]"> / {ante.max}</span></span>
              <MhrBadge cat={ante.cat} />
            </span>
            <span className="text-12 text-[color:var(--hc-color-text-supporting)]">Final maternal health risk before delivery</span>
          </div>
        ) : "—"}
      </Table.Cell>
      <Table.Cell className="font-medium">{p.provider}</Table.Cell>
      <Table.Cell truncate={false} className="text-right" onClick={e => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${p.name}`}><MoreHorizontal /></Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content size="md" align="end">
            {nv && (
              <DropdownMenu.Item onSelect={() => onCancelVisit({ visit: nv, patient: p, episode: ep })}>
                <X /> Cancel next follow-up
              </DropdownMenu.Item>
            )}
            <DropdownMenu.Item destructive onSelect={() => onDischarge(p)}>
              <LogOut /> Discharge from follow-up
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </Table.Cell>
    </Table.Row>
  );
}
