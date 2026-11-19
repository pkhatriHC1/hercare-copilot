import { useState } from "react";
import { ArrowLeft, ArrowRight, Calculator, Check, CheckCircle2, Info, RotateCcw, Send } from "lucide-react";
import { Alert, Badge, Button, Card, EmptyState, Input, Progress, Textarea } from "@hc1com/design-system";
import { AiInsightCard, Wizard } from "@hc1com/design-system/patterns";

const STEPS = [
  { id: "plan", label: "Optimization recommendations" },
  { id: "auth", label: "Prior authorization" },
  { id: "notify", label: "Notify" },
];
const CRITERIA = [
  "Hemoglobin ≥ 10 g/dL",
  "Ferritin < 100 ng/mL, and/or TSAT < 20%",
  "Clinical indication: peri-operative transfusion risk",
  "Evidence-based treatment failure or intolerance to oral iron",
];
const DIAGNOSIS = "Iron deficiency identified (TSAT < 20)";

function StepFooter({ children }) {
  return <div className="flex flex-wrap items-center justify-end gap-8 border-t border-[color:var(--hc-color-border-subtle)] pt-16">{children}</div>;
}

function StepTitle({ eyebrow, title }) {
  return (
    <div className="flex flex-col gap-4">
      <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">{eyebrow}</span>
      <h2 className="text-18 font-semibold text-[color:var(--hc-color-text-primary)]">{title}</h2>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="flex flex-col gap-8">
      <h3 className="text-14 font-semibold text-[color:var(--hc-color-text-primary)]">{title}</h3>
      {children}
    </section>
  );
}

function EvidenceList({ refs }) {
  return (
    <Section title="Evidence base">
      <ul className="grid grid-cols-1 gap-12 md:grid-cols-2">
        {refs.map(r => (
          <li key={r.title} className="flex items-start gap-8">
            <Check className="mt-4 size-16 shrink-0 text-[color:var(--hc-color-status-success-fg)]" aria-hidden />
            <span className="flex flex-col gap-4">
              <span className="text-14 font-medium text-[color:var(--hc-color-text-primary)]">{r.title}</span>
              {r.description && <span className="text-12 text-[color:var(--hc-color-text-supporting)]">{r.description}</span>}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  );
}

/** Optimization recommendations → prior authorization → notify (approve and transmit), for one patient. */
export function CarePlan({ p }) {
  const [step, setStep] = useState(0);
  const [approved, setApproved] = useState(p.carePlanStatus === "generated");
  const [notes, setNotes] = useState("");
  const [targetHgb, setTargetHgb] = useState("13");
  const [appliedTarget, setAppliedTarget] = useState(13);
  const [manualMode, setManualMode] = useState(false);
  const [paChecked, setPaChecked] = useState(true);
  const s = p.severity;

  /* Prior authorization criteria, as in the original prototype. */
  const criteriaResults = [
    parseFloat(p.labs[0].value) < 11,
    parseFloat(p.labs[1]?.value || 99) < 30,
    s === "Critical",
    true,
  ];
  const metCount = criteriaResults.filter(Boolean).length;
  const authPct = Math.round((metCount / 4) * 100);

  const drug = s === "Critical" ? "Ferric Carboxymaltose 1000mg IV — initiate within 24h, repeat in 7 days" : "Ferric Carboxymaltose 750mg IV — week 1 & 3";
  const currentHgb = parseFloat(p.labs[0]?.value) || 10;
  const weight = parseFloat(p.weight) || 68.04;
  const dose = Math.max(0, Math.round((weight * (appliedTarget - currentHgb) * 2.4 + 500) / 50) * 50);
  const recalc = () => {
    const next = Number(targetHgb);
    if (Number.isFinite(next) && next >= 5 && next <= 20) setAppliedTarget(next);
  };
  const toggleManual = () => {
    if (manualMode) { setManualMode(false); setTargetHgb("13"); setAppliedTarget(13); } else setManualMode(true);
  };

  if (approved) {
    return (
      <Card variant="default" density="comfortable">
        <EmptyState variant="default" layout="centered">
          <EmptyState.Icon><CheckCircle2 /></EmptyState.Icon>
          <EmptyState.Title>Care recommendations approved</EmptyState.Title>
          <EmptyState.Description>IV iron order transmitted to pharmacy. Care team notified via Epic InBasket.</EmptyState.Description>
        </EmptyState>
      </Card>
    );
  }

  return (
    <Card variant="default" density="comfortable">
      <Card.Content className="flex flex-col gap-24">
        <Wizard steps={STEPS} currentStep={step} onStepChange={setStep} />

        {step === 0 && (
          <div className="flex flex-col gap-24">
            <div className="flex flex-col gap-8">
              <h2 className="text-18 font-semibold text-[color:var(--hc-color-text-primary)]">Anemic - {DIAGNOSIS}</h2>
              <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">Evidence-based recommendations</span>
              <p className="text-14 font-medium text-[color:var(--hc-color-text-primary)]">
                Screening for anemia and iron deficiency (hemoglobin + ferritin) Oral/IV Iron. Consider possible sources of chronic blood loss, malabsorption, dietary deficiency, or medications.
              </p>
            </div>

            <Input label="Attested diagnosis" value={DIAGNOSIS} readOnly />
            <Textarea label="Clinical notes" optional minRows={3} resize="none" placeholder="Add clinical notes, observations, or additional context…" value={notes} onChange={e => setNotes(e.target.value)} />

            <Section title="Interventions">
              <div className="flex flex-col gap-16 rounded-control border border-[color:var(--hc-color-border-default)] px-16 py-16">
                <div className="flex flex-col gap-4">
                  <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">Medication recommendation</span>
                  <span className="text-16 font-semibold text-[color:var(--hc-color-text-primary)]">IV Iron infusion</span>
                </div>
                <div className="flex flex-col gap-12 rounded-control bg-[color:var(--hc-color-bg-subtle)] px-16 py-16">
                  <div className="flex items-center justify-between gap-8">
                    <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">Calculated dose ({manualMode ? "manual" : "Ganzoni"})</span>
                    <Button variant="outline" size="xs" onClick={toggleManual}>
                      {manualMode ? <><RotateCcw /> Reset</> : <><Calculator /> Manual</>}
                    </Button>
                  </div>
                  {manualMode && (
                    <div className="flex flex-wrap items-end gap-8">
                      <div className="w-128">
                        <Input
                          label="Target Hgb (g/dL)"
                          type="number" step="0.1" min="5" max="20" size="sm"
                          value={targetHgb}
                          onChange={e => setTargetHgb(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") recalc(); }}
                        />
                      </div>
                      <Button variant="default" size="sm" onClick={recalc}>Recalculate</Button>
                      <span className="text-12 text-[color:var(--hc-color-text-supporting)]">Default target is 13 g/dL.</span>
                    </div>
                  )}
                  <span className="flex items-baseline gap-8">
                    <span className="text-24 font-bold leading-none tabular-nums text-[color:var(--hc-color-text-primary)]">{dose}</span>
                    <span className="text-14 text-[color:var(--hc-color-text-secondary)]">mg IV iron (total)</span>
                    {manualMode && <Badge variant="primary" appearance="soft" size="sm">Manual target {appliedTarget} g/dL</Badge>}
                  </span>
                  <span className="text-12 tabular-nums text-[color:var(--hc-color-text-supporting)]">
                    Formula: {weight.toFixed(2)} kg × ({appliedTarget} − {currentHgb}) × 2.4 + 500 mg = {dose} mg
                  </span>
                  <span className="flex items-start gap-8 border-t border-[color:var(--hc-color-border-subtle)] pt-8 text-12 text-[color:var(--hc-color-text-supporting)]">
                    <Info className="mt-4 size-12 shrink-0" aria-hidden />
                    This is the recommended total dose of intravenous iron for the target Hgb of {appliedTarget} g/dL. The actual order must be placed in Epic based on institution-specific formulary availability.
                  </span>
                </div>
              </div>
            </Section>

            <Alert variant="warning">
              <Alert.Title>Clinical review required</Alert.Title>
              <Alert.Description>Please review for patient-specific contraindications, drug interactions, and appropriateness before approval.</Alert.Description>
            </Alert>

            <StepFooter>
              <Button variant="cta" size="sm" onClick={() => setStep(1)}><Check /> Attest and check prior authorization</Button>
            </StepFooter>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-24">
            <StepTitle eyebrow="Prior authorization analysis" title="Approval probability" />

            {!paChecked ? (
              <div className="flex flex-wrap items-center justify-between gap-12 rounded-control bg-[color:var(--hc-color-bg-subtle)] px-16 py-16">
                <span className="text-14 text-[color:var(--hc-color-text-secondary)]">Run the check to estimate the prior authorization probability against LCD criteria.</span>
                <Button variant="default" size="sm" onClick={() => setPaChecked(true)}>Run PA check</Button>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-12 rounded-control bg-[color:var(--hc-color-bg-subtle)] px-16 py-16">
                  <span className="flex items-baseline gap-8">
                    <span className="text-24 font-bold leading-none tabular-nums text-[color:var(--hc-color-text-primary)]">{authPct}%</span>
                    <span className="text-14 text-[color:var(--hc-color-text-secondary)]">AI probability of approval</span>
                  </span>
                  <Progress value={authPct} tone="success" size="md" aria-label={`${authPct}% probability of approval`} />
                  <span className="text-14 text-[color:var(--hc-color-text-secondary)]">High likelihood — documentation is strong.</span>
                </div>

                <Section title={`LCD criteria met: ${metCount} of 4`}>
                  <ul className="flex flex-col gap-8">
                    {CRITERIA.map((c, i) => {
                      const met = criteriaResults[i];
                      return (
                        <li key={c} className="flex items-start gap-12 rounded-control border border-[color:var(--hc-color-border-default)] px-12 py-12">
                          <span className={`flex size-20 shrink-0 items-center justify-center rounded-full ${met ? "bg-[color:var(--hc-color-status-success-bg)] text-[color:var(--hc-color-status-success-fg)]" : "border border-[color:var(--hc-color-border-strong)]"}`}>
                            {met && <Check className="size-12" />}
                          </span>
                          <span className={`text-14 ${met ? "text-[color:var(--hc-color-text-primary)]" : "text-[color:var(--hc-color-text-supporting)]"}`}>{c}</span>
                        </li>
                      );
                    })}
                  </ul>
                </Section>

                <Section title="Clinical evidence">
                  <dl className="grid grid-cols-[auto_1fr] gap-x-24 gap-y-8 rounded-control border border-[color:var(--hc-color-border-default)] px-16 py-12">
                    {[
                      ["Hemoglobin", `${p.labs[0].value} g/dL at ${p.gestAge} – Meets ACOG threshold`],
                      ["Ferritin", `${p.labs[1].value} ng/mL – Meets threshold`],
                      ["Pregnancy", `Gestational age ${p.gestAge}, ${p.parity}`],
                      ["Indication", `${DIAGNOSIS} per ACOG Practice Bulletin #233`],
                    ].map(([k, v]) => (
                      <div key={k} className="contents">
                        <dt className="text-14 font-medium text-[color:var(--hc-color-text-primary)]">{k}</dt>
                        <dd className="text-14 text-[color:var(--hc-color-text-secondary)]">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </Section>

                <Section title="Diagnosis codes (ICD-10)">
                  <div className="flex flex-wrap gap-8">
                    {p.icdCodes.map(c => <Badge key={c} variant="primary" appearance="soft" size="sm">{c}</Badge>)}
                  </div>
                </Section>

                <AiInsightCard
                  title="Suggestions to improve authorization approval"
                  description="These documentation gaps may reduce approval probability. Address them to strengthen the case before submission."
                >
                  <div className="flex flex-col gap-12">
                    <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">Recommended actions</span>
                    <ol className="flex flex-col gap-8">
                      {[
                        "Document a primary anemia diagnosis code and supporting laboratory results.",
                        "Add a secondary diagnosis code when clinically appropriate.",
                        "Ensure the underlying condition is coded as secondary when required.",
                      ].map((a, i) => (
                        <li key={a} className="flex items-start gap-8 text-14 text-[color:var(--hc-color-text-secondary)]">
                          <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[color:var(--hc-color-ai-subtle-bg)] text-12 font-semibold text-[color:var(--hc-color-ai-text)]">{i + 1}</span>
                          {a}
                        </li>
                      ))}
                    </ol>
                    <p className="text-12 text-[color:var(--hc-color-text-supporting)]">This is an estimated approval likelihood only; payer criteria determine final coverage.</p>
                  </div>
                </AiInsightCard>

                <EvidenceList refs={[{ title: "Treatment of Iron Deficiency Anemia" }, { title: "Intravenous Iron Therapy" }]} />
              </>
            )}

            <StepFooter>
              <Button variant="ghost" size="sm" onClick={() => setStep(0)}><ArrowLeft /> Back</Button>
              <Button variant="cta" size="sm" onClick={() => setStep(2)}>Proceed to notify <ArrowRight /></Button>
            </StepFooter>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-24">
            <StepTitle eyebrow="Evidence-based care recommendations" title="ACOG evidence-based care recommendations" />

            <div className="flex flex-col gap-4 rounded-control bg-[color:var(--hc-color-bg-subtle)] px-16 py-12">
              <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">Treatment goals</span>
              <span className="text-14 text-[color:var(--hc-color-text-primary)]">
                {s === "Critical" ? "Achieve Hgb ≥11 g/dL before delivery, reduce SMM risk, prevent PPH" : "Optimize Hgb ≥11 g/dL by 34 weeks, Ferritin >30 ng/mL, prevent peripartum transfusion"}
              </span>
            </div>

            <Section title="Interventions">
              <ol className="flex flex-col divide-y divide-[color:var(--hc-color-border-subtle)] rounded-control border border-[color:var(--hc-color-border-default)]">
                {[
                  { num: "Medication order", title: s === "Critical" ? "IV Iron — Ferric Carboxymaltose 1000mg STAT" : "IV Iron — Ferric Carboxymaltose 750mg × 2", detail: drug },
                  { num: "Monitoring", title: "Lab monitoring", detail: "CBC at 2–4 weeks, Ferritin at 6 weeks, Target Hgb >11 g/dL by 34 weeks" },
                  { num: "Specialist", title: s === "Critical" ? "MFM consultation — STAT" : "MFM consultation — within 2 weeks", detail: `Maternal health risk score ${p._mhr.score} — ${p._mhr.cat}` },
                ].map((it, i) => (
                  <li key={it.num} className="flex items-start gap-12 px-16 py-12">
                    <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[color:var(--hc-color-brand-50)] text-12 font-semibold text-[color:var(--hc-color-action-primary)]">{i + 1}</span>
                    <span className="flex flex-col gap-4">
                      <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">{it.num}</span>
                      <span className="text-14 font-semibold text-[color:var(--hc-color-text-primary)]">{it.title}</span>
                      <span className="text-14 text-[color:var(--hc-color-text-secondary)]">{it.detail}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </Section>

            <EvidenceList refs={[
              { title: "ACOG Practice Bulletin #233 (2021)", description: "Anemia in Pregnancy — IV iron preferred for moderate-severe" },
              { title: "ACOG Safe Motherhood Initiative", description: "Optimizing Hgb before delivery reduces transfusion 60–70%" },
              { title: "WHO Anemia Guidelines for Pregnancy", description: "Hgb ≥11 g/dL target for pregnant women" },
              { title: "NEJM 2015 – Breymann et al.", description: "IV iron achieves target Hgb 2–3 weeks faster than oral" },
            ]} />

            <Alert variant="warning">
              <Alert.Title>Clinical review required</Alert.Title>
              <Alert.Description>Please review for patient-specific contraindications, gestational age considerations, and drug interactions before approval.</Alert.Description>
            </Alert>

            <StepFooter>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}><ArrowLeft /> Back</Button>
              <Button variant="default" size="sm" onClick={() => setApproved(true)}><Send /> Approve and transmit to pharmacy</Button>
            </StepFooter>
          </div>
        )}
      </Card.Content>
    </Card>
  );
}
