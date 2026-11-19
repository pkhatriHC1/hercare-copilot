import { FlaskConicalOff } from "lucide-react";
import { Badge, Gauge } from "@hc1com/design-system";

/** Maternal health risk tiers mapped to design-system severity. */
export const MHR_TIER_STYLE = {
  "Very High": { gauge: "critical", variant: "danger", appearance: "soft" },
  High: { gauge: "high", variant: "warning", appearance: "soft" },
  Intermediate: { gauge: "medium", variant: "warning", appearance: "outline" },
  Low: { gauge: "normal", variant: "success", appearance: "soft" },
};

export function MhrBadge({ cat }) {
  const t = MHR_TIER_STYLE[cat] ?? MHR_TIER_STYLE.Low;
  return <Badge variant={t.variant} appearance={t.appearance} size="sm">{cat}</Badge>;
}

/** Maternal health risk score: gauge (0–74) plus tier badge. */
export function MhrScore({ mhr, size = "sm" }) {
  const t = MHR_TIER_STYLE[mhr.cat] ?? MHR_TIER_STYLE.Low;
  return (
    <span className="flex flex-col items-center gap-4">
      <Gauge
        value={mhr.score}
        max={mhr.maxPossible}
        tier={t.gauge}
        size={size}
        aria-label={`Maternal health risk score ${mhr.score} of ${mhr.maxPossible}, ${mhr.cat}`}
      />
      <MhrBadge cat={mhr.cat} />
    </span>
  );
}

/** Lab value colour by result status: critical red, high amber, otherwise default text. */
export function labTone(status) {
  if (status === "critical") return "text-[color:var(--hc-color-status-error-fg)]";
  if (status === "high" || status === "borderline") return "text-[color:var(--hc-color-status-warning-fg)]";
  return "text-[color:var(--hc-color-text-primary)]";
}

/** Blood pressure colour: ≥140/90 red, ≥130/80 amber, otherwise green. */
export function bpTone(bp) {
  const [s, d] = String(bp).split("/").map(Number);
  if (s >= 140 || d >= 90) return "text-[color:var(--hc-color-status-error-fg)]";
  if (s >= 130 || d >= 80) return "text-[color:var(--hc-color-status-warning-fg)]";
  return "text-[color:var(--hc-color-status-success-fg)]";
}

/** One measure: small label, large value and unit. Missing labs show "Missing". */
export function Measure({ label, value, unit, tone, missing, size = "md" }) {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <span className="text-12 font-medium text-[color:var(--hc-color-text-supporting)]">{label}</span>
      {missing ? (
        <span className="flex items-center gap-4 text-14 text-[color:var(--hc-color-text-tertiary)]">
          <FlaskConicalOff className="size-16" aria-hidden /> Missing
        </span>
      ) : (
        <span className="flex items-baseline gap-4">
          <span className={`${size === "lg" ? "text-24" : size === "sm" ? "text-16" : "text-20"} font-semibold leading-tight tabular-nums ${tone ?? "text-[color:var(--hc-color-text-primary)]"}`}>{value}</span>
          {unit && <span className="text-12 text-[color:var(--hc-color-text-supporting)]">{unit}</span>}
        </span>
      )}
    </div>
  );
}

export const findLab = (p, label) => p.labs.find(l => l.label === label);
export const isMissing = lab => !lab || lab.status === "missing" || lab.value === "Missing";

/** Care recommendation status for the active order. */
export function careStatus(p) {
  if (p.activeRecommendation === null) return { label: "No active recommendation", variant: "neutral" };
  if (p.carePlanStatus === "generated") return { label: "Care recommendation generated", variant: "success" };
  if (p.carePlanStatus === "in-progress") return { label: "Care recommendation in progress", variant: "warning" };
  if (p.carePlanStatus === "pending") return { label: "Care recommendation not started", variant: "danger" };
  return null;
}

/** Compact readings list: label on the left, value and unit on the right, one per line. */
export function Readings({ items, missingLabel = "Missing" }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-12 gap-y-4">
      {items.map(({ label, value, unit, tone, missing }) => (
        <div key={label} className="contents">
          <dt className="text-12 text-[color:var(--hc-color-text-supporting)]">{label}</dt>
          <dd className="flex items-baseline gap-4">
            {missing ? (
              <span className="flex items-center gap-4 text-14 text-[color:var(--hc-color-text-tertiary)]">
                <FlaskConicalOff className="size-12" aria-hidden /> {missingLabel}
              </span>
            ) : (
              <>
                <span className={`text-14 font-semibold tabular-nums ${tone ?? "text-[color:var(--hc-color-text-primary)]"}`}>{value}</span>
                {unit && <span className="text-12 text-[color:var(--hc-color-text-supporting)]">{unit}</span>}
              </>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
