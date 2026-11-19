import { ArrowDown, ArrowRight, ArrowUp, BookOpen, Check, Sparkles, TriangleAlert } from "lucide-react";
import { Badge, Button, Card, EmptyState } from "@hc1com/design-system";
import { AiInsightCard } from "@hc1com/design-system/patterns";
import { Measure, MhrScore, bpTone, careStatus, findLab, isMissing, labTone } from "../shared/clinical-ui";

const EVIDENCE = [
  { t: "ACOG Practice Bulletin #233 (2021)", d: "Anemia in Pregnancy — IV iron preferred for moderate-severe" },
  { t: "ACOG Safe Motherhood Initiative", d: "Optimizing Hgb before delivery reduces transfusion 60–70%" },
  { t: "NEJM 2015 — Breymann et al.", d: "IV ferric carboxymaltose superior to oral iron in pregnancy" },
  { t: "WHO Maternal Nutrition Guidelines", d: "Iron deficiency affects 40% of pregnancies worldwide" },
];

/* Protocol and recommendations by patient severity, as in the original prototype. */
function plan(p) {
  if (p.severity === "Critical") return {
    drug: "Ferric Carboxymaltose 1000mg IV — initiate within 24h",
    recs: ["Approve IV Iron per ACOG PB #233 — urgent", "MFM consultation for high-risk monitoring", "Target Hgb ≥11 g/dL before delivery"],
    insight: `Patient has hemoglobin of ${p.labs[0].value} g/dL at ${p.gestAge} gestation with ${p.comorbidities.length} active comorbidities, indicating critical OB anemia requiring immediate IV iron intervention.`,
  };
  const insight = `Patient has hemoglobin of ${p.labs[0].value} g/dL with ferritin ${p.labs[1].value} ng/mL at ${p.gestAge} gestation. ACOG PB #233 criteria met for IV iron therapy.`;
  if (p.severity === "High") return {
    drug: "Ferric Carboxymaltose 750mg IV — week 1 & 3",
    recs: ["Initiate IV Iron within 14 days", "Recheck Hgb & Ferritin in 7–10 days", "Coordinate with OB team on delivery Hgb target"],
    insight,
  };
  return {
    drug: "Ferric Carboxymaltose 500mg IV — reassess in 4 weeks",
    recs: ["Continue monitoring — CBC weekly", "IV Iron supplementation if Hgb <11", "OB follow-up in 2 weeks"],
    insight,
  };
}

function Stat({ label, children, wide }) {
  return (
    <div className={`flex min-w-0 flex-col gap-8 px-24 py-16 ${wide ? "col-span-2 md:col-span-3 xl:col-span-1" : ""}`}>
      {label && <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">{label}</span>}
      {children}
    </div>
  );
}

/** Clinical decision support tab: clinical summary, AI insight and evidence. */
export function OverviewZone({ p, onNavigate, onOpenMhr }) {
  const hgb = p.labs[0];
  const draws = hgb.draws || [];
  const hasDelta = draws.length >= 2;
  const delta = hasDelta ? Math.abs(draws[draws.length - 1].value - draws[0].value).toFixed(1) : null;
  const isDown = hasDelta && draws[draws.length - 1].value < draws[0].value;
  const ferritin = findLab(p, "Ferritin");
  const tsat = findLab(p, "Transferrin Sat");
  const cs = careStatus(p);
  const { drug, recs, insight } = plan(p);

  return (
    <div className="flex flex-col gap-24">
      <Card variant="default" density="comfortable">
        <Card.Header>
          <Card.Icon><TriangleAlert /></Card.Icon>
          <Card.Title>Clinical summary</Card.Title>
        </Card.Header>
        <div className="grid grid-cols-2 divide-[color:var(--hc-color-border-subtle)] border-t border-[color:var(--hc-color-border-subtle)] md:grid-cols-3 xl:grid-cols-[repeat(5,minmax(0,1fr))_minmax(0,2fr)] xl:divide-x">
          <Stat>
            <Measure label="Hgb" value={hgb.value} unit="g/dL" tone={labTone(hgb.status)} size="lg" />
            {hasDelta && (
              <Badge className="self-start" variant={isDown ? "danger" : "success"} appearance="soft" size="sm" leadingIcon={isDown ? <ArrowDown /> : <ArrowUp />}>
                {delta} g/dL
              </Badge>
            )}
          </Stat>
          <Stat><Measure label="Ferritin" value={ferritin?.value} unit="ng/mL" tone={labTone(ferritin?.status)} missing={isMissing(ferritin)} size="lg" /></Stat>
          <Stat><Measure label="TSAT" value={tsat?.value} unit="%" tone={labTone(tsat?.status)} missing={isMissing(tsat)} size="lg" /></Stat>
          <Stat><Measure label="Blood pressure" value={p.bp} unit="mmHg" tone={bpTone(p.bp)} size="lg" /></Stat>
          <Stat label="Maternal health risk">
            <button
              type="button"
              className="self-start rounded-[var(--hc-radius-8)] focus-visible:outline-2 focus-visible:outline-[color:var(--hc-color-border-focus)]"
              aria-label={`Maternal health risk score ${p._mhr.score} of ${p._mhr.maxPossible}, ${p._mhr.cat}. Show breakdown`}
              onClick={onOpenMhr}
            >
              <MhrScore mhr={p._mhr} size="md" />
            </button>
          </Stat>
          <Stat label="Active order" wide>
            {p.activeRecommendation === null || p.carePlanStatus === "pending" ? (
              cs && <Badge className="self-start" variant={cs.variant} appearance="soft" size="sm">{cs.label}</Badge>
            ) : (
              <span className="text-16 font-semibold text-[color:var(--hc-color-text-primary)]">{p.order}</span>
            )}
          </Stat>
        </div>
      </Card>

      {p.activeRecommendation === null ? (
        <Card variant="default" density="comfortable">
          <EmptyState variant="default" layout="centered">
            <EmptyState.Icon><Sparkles /></EmptyState.Icon>
            <EmptyState.Title>No AI insight recommendations</EmptyState.Title>
            <EmptyState.Description>There is no active recommendation for this episode yet.</EmptyState.Description>
          </EmptyState>
        </Card>
      ) : (
        <AiInsightCard
          title="AI insight"
          provenance="ACOG PB #233"
          extraActions={
            <Button variant="cta" size="sm" onClick={() => onNavigate("cp")}>
              Review optimization recommendations <ArrowRight />
            </Button>
          }
        >
          <div className="grid grid-cols-1 gap-24 md:grid-cols-2">
            <div className="flex flex-col gap-12">
              <p className="text-14 leading-relaxed text-[color:var(--hc-color-text-secondary)]">{insight}</p>
              <div className="flex flex-col gap-4">
                <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">Recommended protocol</span>
                <span className="text-16 font-semibold text-[color:var(--hc-color-text-primary)]">OB Iron Deficiency Anemia – ACOG PB #233</span>
                <span className="text-14 text-[color:var(--hc-color-text-secondary)]">{drug}</span>
              </div>
            </div>
            <div className="flex flex-col gap-8">
              <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">Key recommendations</span>
              <ol className="flex flex-col gap-8">
                {recs.map((r, i) => (
                  <li key={r} className="flex items-start gap-8 text-14 text-[color:var(--hc-color-text-secondary)]">
                    <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[color:var(--hc-color-ai-subtle-bg)] text-12 font-semibold text-[color:var(--hc-color-ai-text)]">{i + 1}</span>
                    {r}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </AiInsightCard>
      )}

      <Card variant="default" density="comfortable">
        <Card.Header>
          <Card.Icon><BookOpen /></Card.Icon>
          <Card.Title>Evidence base</Card.Title>
          <Card.Description>The guidelines and studies behind these recommendations</Card.Description>
        </Card.Header>
        <Card.Content>
          <ul className="grid grid-cols-1 gap-16 md:grid-cols-2">
            {EVIDENCE.map(({ t, d }) => (
              <li key={t} className="flex items-start gap-8">
                <Check className="mt-4 size-16 shrink-0 text-[color:var(--hc-color-status-success-fg)]" aria-hidden />
                <div className="flex flex-col gap-4">
                  <span className="text-14 font-medium text-[color:var(--hc-color-text-primary)]">{t}</span>
                  <span className="text-12 text-[color:var(--hc-color-text-supporting)]">{d}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card.Content>
      </Card>
    </div>
  );
}
