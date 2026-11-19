import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Minus } from "lucide-react";
import { Alert, Badge, Button, Card, Dialog, Gauge, Progress, Table } from "@hc1com/design-system";
import { MHR_TIER_STYLE, MhrBadge } from "../shared/clinical-ui";

const CALC_DATE = "Oct 2, 2026 · 14:32";
const DOT = {
  high: "bg-[color:var(--hc-color-status-error-fg)]",
  moderate: "bg-[color:var(--hc-color-status-warning-fg)]",
  mild: "bg-[color:var(--hc-color-severity-medium-text)]",
};
const PROGRESS_TONE = { "Very High": "danger", High: "warning", Intermediate: "warning", Low: "success" };

/** The inputs behind the score, with where each came from and whether it was available. */
function transparencyInputs(p) {
  const m = p.mhr;
  return [
    ...p.labs.map(l => ({ name: l.label, value: `${l.value} ${l.unit || ""}`, date: "Apr 9, 2026", source: "Lab (EHR)", used: true })),
    { name: "PT", value: `${m.pt ?? "—"} s`, date: "Apr 9, 2026", source: "Lab (EHR)", used: m.pt != null },
    { name: "INR", value: `${m.inr ?? "—"}`, date: "Apr 9, 2026", source: "Lab (EHR)", used: m.inr != null },
    { name: "Fibrinogen", value: `${m.fibrinogen ?? "—"} mg/dL`, date: "Apr 9, 2026", source: "Lab (EHR)", used: m.fibrinogen != null },
    { name: "Placental diagnosis", value: m.placental || "Not documented", date: "—", source: "Ultrasound", used: m.placental != null },
    { name: "Prior PPH", value: m.priorPPH === undefined ? "Not documented" : m.priorPPH ? "Yes" : "No", date: "—", source: "OB history", used: m.priorPPH !== undefined },
    { name: "Hypertensive disorder", value: m.hypertensiveDisorder || "None", date: "—", source: "OB history", used: m.hypertensiveDisorder !== undefined },
    { name: "Gestational diabetes", value: m.gestationalDiabetes === undefined ? "Not documented" : m.gestationalDiabetes ? "Yes" : "No", date: "—", source: "OB history", used: m.gestationalDiabetes !== undefined },
    { name: "Anticoagulation status", value: m.anticoagulationStatus || "None", date: "—", source: "Medication list", used: m.anticoagulationStatus !== undefined },
  ];
}

function DriverList({ title, drivers, empty }) {
  return (
    <Card variant="default" density="compact">
      <Card.Header>
        <Card.Title>
          <span className="inline-flex items-center gap-8">{title} <Badge variant="neutral" appearance="soft" size="xs">{drivers.length}</Badge></span>
        </Card.Title>
      </Card.Header>
      <Card.Content>
        {drivers.length === 0 ? (
          <p className="text-14 text-[color:var(--hc-color-text-supporting)]">{empty}</p>
        ) : (
          <ul className="flex flex-col gap-12">
            {drivers.map(d => (
              <li key={d.label} className="flex items-start gap-8">
                <span className={`mt-4 size-8 shrink-0 rounded-full ${DOT[d.severity] ?? DOT.mild}`} aria-hidden />
                <span className="flex min-w-0 flex-col gap-4">
                  <span className="text-14 font-medium text-[color:var(--hc-color-text-primary)]">{d.label}</span>
                  <span className="text-12 text-[color:var(--hc-color-text-supporting)]">{d.value} · {d.severity} impact</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}

/** Maternal health risk score breakdown: summary, risk drivers, data used, and points by domain. */
export function MhrDialog({ p, onClose }) {
  const mhr = p._mhr;
  const [showInputs, setShowInputs] = useState(false);
  const inputs = transparencyInputs(p);
  const tone = PROGRESS_TONE[mhr.cat] ?? "default";

  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <Dialog.Content size="lg">
        <Dialog.Header>
          <Dialog.Title>Maternal health risk score</Dialog.Title>
          <Dialog.Description>{p.name} · MRN {p.id}</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body className="flex flex-col gap-24 [&>*]:shrink-0">
          <div className="flex flex-wrap items-center gap-24">
            <Gauge
              value={mhr.score}
              max={mhr.maxPossible}
              tier={MHR_TIER_STYLE[mhr.cat]?.gauge ?? "normal"}
              size="xl"
              aria-label={`Maternal health risk score ${mhr.score} of ${mhr.maxPossible}, ${mhr.cat}`}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-8">
              <div className="flex items-center gap-8">
                <MhrBadge cat={mhr.cat} />
                <span className="text-14 tabular-nums text-[color:var(--hc-color-text-supporting)]">{mhr.score} of {mhr.maxPossible} points</span>
              </div>
              <p className="text-16 text-[color:var(--hc-color-text-primary)]">{mhr.interp}</p>
              <span className="text-12 text-[color:var(--hc-color-text-supporting)]">Calculated {CALC_DATE}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-24 gap-y-12 md:grid-cols-3">
            {mhr.domains.map(d => (
              <div key={d.id} className="flex flex-col gap-4">
                <div className="flex items-baseline justify-between gap-8">
                  <span className="truncate text-12 text-[color:var(--hc-color-text-supporting)]">{d.name}</span>
                  <span className="text-12 font-medium tabular-nums text-[color:var(--hc-color-text-primary)]">{d.clamped}/{d.cap}</span>
                </div>
                <Progress value={d.cap > 0 ? Math.min((d.clamped / d.cap) * 100, 100) : 0} tone={d.clamped > 0 ? tone : "default"} size="sm" aria-label={`${d.name} ${d.clamped} of ${d.cap}`} />
              </div>
            ))}
          </div>

          {mhr.missing.length > 0 && (
            <Alert variant="warning">
              <Alert.Title>Missing input data</Alert.Title>
              <Alert.Description>
                {mhr.missing.join(", ")}. {mhr.calcComplete ? "Complete risk calculation performed." : "The score may be incomplete; interpret it with caution."}
              </Alert.Description>
            </Alert>
          )}

          <section className="flex flex-col gap-12">
            <h3 className="text-16 font-semibold text-[color:var(--hc-color-text-primary)]">Risk drivers</h3>
            <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
              <DriverList title="Potentially modifiable" drivers={mhr.modifiableDrivers} empty="No modifiable drivers identified" />
              <DriverList title="Obstetric / non-modifiable" drivers={mhr.nonModifiableDrivers} empty="No non-modifiable drivers identified" />
            </div>
          </section>

          <section className="flex flex-col gap-12">
            <Button variant="ghost" size="sm" className="self-start" aria-expanded={showInputs} onClick={() => setShowInputs(s => !s)}>
              Data used · {inputs.filter(i => i.used).length} of {inputs.length} inputs {showInputs ? <ChevronUp /> : <ChevronDown />}
            </Button>
            {showInputs && (
              <Table density="compact">
                <Table.Content>
                  <Table.Header>
                    <Table.Row>
                      <Table.Head>Input</Table.Head>
                      <Table.Head>Value</Table.Head>
                      <Table.Head>Date</Table.Head>
                      <Table.Head>Source</Table.Head>
                      <Table.Head width={96}>Status</Table.Head>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {inputs.map(i => (
                      <Table.Row key={i.name}>
                        <Table.Cell className="font-medium">{i.name}</Table.Cell>
                        <Table.Cell className="tabular-nums">{i.value}</Table.Cell>
                        <Table.Cell>{i.date}</Table.Cell>
                        <Table.Cell>{i.source}</Table.Cell>
                        <Table.Cell><Badge variant={i.used ? "success" : "warning"} appearance="soft" size="xs">{i.used ? "Used" : "Missing"}</Badge></Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Content>
              </Table>
            )}
          </section>

          <section className="flex flex-col gap-16">
            <h3 className="text-16 font-semibold text-[color:var(--hc-color-text-primary)]">Points by domain</h3>
            {mhr.domains.map(dom => (
              <div key={dom.id} className="flex flex-col gap-8">
                <div className="flex items-baseline justify-between gap-8">
                  <span className="text-14 font-semibold text-[color:var(--hc-color-text-primary)]">{dom.name}</span>
                  <span className="text-14 font-semibold tabular-nums text-[color:var(--hc-color-text-primary)]">{dom.clamped}<span className="font-normal text-[color:var(--hc-color-text-supporting)]">/{dom.cap}</span></span>
                </div>
                <ul className="flex flex-col divide-y divide-[color:var(--hc-color-border-subtle)] rounded-[var(--hc-radius-8)] border border-[color:var(--hc-color-border-subtle)]">
                  {dom.factors.map(f => {
                    const earned = f.points > 0;
                    return (
                      <li key={f.label} className={`flex items-center gap-12 px-12 py-8 ${earned ? "" : "bg-[color:var(--hc-color-bg-subtle)]"}`}>
                        {earned
                          ? <Check className="size-16 shrink-0 text-[color:var(--hc-color-status-success-fg)]" aria-label="Earned" />
                          : <Minus className="size-16 shrink-0 text-[color:var(--hc-color-text-tertiary)]" aria-label="Not earned" />}
                        <span className="flex min-w-0 flex-1 flex-col gap-4">
                          <span className="text-14 font-medium text-[color:var(--hc-color-text-primary)]">{f.label}</span>
                          <span className="text-12 text-[color:var(--hc-color-text-supporting)]">{f.value} · {f.criteria}{f.icd ? ` · ICD-10: ${f.icd}` : ""}</span>
                        </span>
                        <span className="text-14 tabular-nums">
                          <span className={earned ? "font-semibold text-[color:var(--hc-color-text-primary)]" : "text-[color:var(--hc-color-text-tertiary)]"}>+{f.points}</span>
                          <span className="text-[color:var(--hc-color-text-tertiary)]">/{f.max}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {dom.raw > dom.cap && <span className="text-12 text-[color:var(--hc-color-text-supporting)]">Raw sum {dom.raw} capped at {dom.cap}</span>}
              </div>
            ))}
          </section>
        </Dialog.Body>
        <Dialog.Footer>
          <p className="text-12 text-[color:var(--hc-color-text-supporting)]">
            This assessment supports but does not replace clinical judgment. All clinical decisions are made by the treating provider.
          </p>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog>
  );
}
