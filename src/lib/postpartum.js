/*
 * Postpartum worklist: moving a pregnancy episode from the Active worklist to the Postpartum
 * worklist when an end-of-pregnancy event arrives from the EHR (mocked FHIR resources).
 *
 * The rules live here, apart from the UI, so engineering can lift them as they are.
 * PLACEHOLDERS pending clinical sign-off are marked below: the procedure code set, the
 * follow-up rules and the discharge reasons.
 */
import { EPISODES, TODAY, VISITS, formatDate, visitsForEpisode } from "../mock/episodes.js";
import { PATIENTS } from "./clinical.js";

export const POSTPARTUM_WINDOW_DAYS = 365;
export const OUTCOMES = ["Cesarean", "Vaginal", "Loss/Termination", "Ectopic/Molar"];

/*
 * End-of-pregnancy PROCEDURE codes (ICD-10-PCS). PLACEHOLDER: the story's reference table lists
 * only diagnosis codes, so this set needs confirming by the clinical team.
 * Each code gives the outcome category and, where the code says it, the delivery type.
 */
export const PROCEDURE_CODES = {
  "10D00Z0": { outcome: "Cesarean", deliveryType: "Classical cesarean", display: "Extraction of POC, classical, open" },
  "10D00Z1": { outcome: "Cesarean", deliveryType: "Low cesarean", display: "Extraction of POC, low, open" },
  "10D00Z2": { outcome: "Cesarean", deliveryType: "Extraperitoneal cesarean", display: "Extraction of POC, extraperitoneal, open" },
  "10D07Z3": { outcome: "Vaginal", deliveryType: "Low forceps", display: "Extraction of POC, low forceps" },
  "10D07Z4": { outcome: "Vaginal", deliveryType: "Mid forceps", display: "Extraction of POC, mid forceps" },
  "10D07Z5": { outcome: "Vaginal", deliveryType: "High forceps", display: "Extraction of POC, high forceps" },
  "10D07Z6": { outcome: "Vaginal", deliveryType: "Vacuum", display: "Extraction of POC, vacuum" },
  "10D07Z8": { outcome: "Vaginal", deliveryType: "Other assisted vaginal", display: "Extraction of POC, other, via natural opening" },
  "10E0XZZ": { outcome: "Vaginal", deliveryType: null, display: "Delivery of products of conception" },
  "10A07ZZ": { outcome: "Loss/Termination", deliveryType: null, display: "Abortion of POC, via natural opening" },
  "10A07Z6": { outcome: "Loss/Termination", deliveryType: "Vacuum aspiration", display: "Abortion of POC, vacuum" },
  "10D17ZZ": { outcome: "Loss/Termination", deliveryType: "Retained POC extraction", display: "Extraction of retained POC, via natural opening" },
  "10T20ZZ": { outcome: "Ectopic/Molar", deliveryType: "Ectopic, open", display: "Resection of ectopic POC, open" },
  "10T24ZZ": { outcome: "Ectopic/Molar", deliveryType: "Ectopic, laparoscopic", display: "Resection of ectopic POC, percutaneous endoscopic" },
};

/* End-of-pregnancy DIAGNOSIS codes (ICD-10-CM), from the story. On their own they never move a patient (AC4). */
export const DIAGNOSIS_CODES = {
  "Z37.0": "Single live birth", "Z37.1": "Single stillbirth", "Z37.2": "Twins, both liveborn",
  "Z37.3": "Twins, one liveborn and one stillborn", "Z37.4": "Twins, both stillborn",
  "Z37.50": "Multiple births, unspecified, all liveborn", "Z37.51": "Triplets, all liveborn", "Z37.52": "Quadruplets, all liveborn",
  "Z37.53": "Quintuplets, all liveborn", "Z37.54": "Sextuplets, all liveborn", "Z37.59": "Other multiple births, all liveborn",
  "Z37.60": "Multiple births, unspecified, some liveborn", "Z37.61": "Triplets, some liveborn", "Z37.62": "Quadruplets, some liveborn",
  "Z37.63": "Quintuplets, some liveborn", "Z37.64": "Sextuplets, some liveborn", "Z37.69": "Other multiple births, some liveborn",
  "Z37.70": "Multiple births, unspecified, all stillborn", "Z37.71": "Triplets, all stillborn", "Z37.72": "Quadruplets, all stillborn",
  "Z37.73": "Quintuplets, all stillborn", "Z37.74": "Sextuplets, all stillborn", "Z37.79": "Other multiple births, all stillborn",
  "Z37.9": "Outcome of delivery, unspecified",
  "O80": "Encounter for full-term uncomplicated delivery", "O82": "Encounter for cesarean delivery without indication",
};
/* Outcome suggested to the user when confirming a diagnosis-only record. */
const SUGGESTED_OUTCOME = { O80: "Vaginal", O82: "Cesarean" };
export const isPphCode = code => /^O72(\.|$)/.test(code);

/*
 * Follow-up rules by outcome and condition. PLACEHOLDER: offsets are days after Day 0 and need
 * clinical sign-off; the labels follow ACOG postpartum care guidance.
 */
export const FOLLOW_UP_RULES = {
  liveBirth: [
    { day: 21, type: "Postpartum", reason: "Postpartum contact (within 3 weeks)" },
    { day: 42, type: "Postpartum", reason: "Comprehensive postpartum visit" },
  ],
  "Loss/Termination": [
    { day: 14, type: "Postpartum", reason: "Follow-up and support visit after pregnancy loss" },
    { day: 42, type: "Postpartum", reason: "Comprehensive follow-up visit" },
  ],
  "Ectopic/Molar": [
    { day: 7, type: "Lab", reason: "Serial hCG until negative" },
    { day: 14, type: "Postpartum", reason: "Post-procedure follow-up visit" },
  ],
  hypertensive: [
    { day: 3, type: "Postpartum", reason: "Blood pressure check (hypertensive disorder)" },
    { day: 10, type: "Postpartum", reason: "Blood pressure recheck (hypertensive disorder)" },
  ],
  anemia: [{ day: 14, type: "Lab", reason: "CBC and iron studies (anemia)" }],
  pph: [{ day: 7, type: "Lab", reason: "Hemoglobin recheck after postpartum hemorrhage" }],
};

/* PLACEHOLDER discharge reasons for leaving the Postpartum worklist (AC10). */
export const DISCHARGE_REASONS = [
  "Postpartum follow-up complete",
  "Transferred to another provider",
  "Patient declined further follow-up",
  "Lost to follow-up",
];

/* ── State: confirmations awaiting the user, discharge log and processing log ── */
const pending = [];       // AC4 — { id, patientId, episodeId, encounterId, codes[], date }
const dischargeLog = [];  // AC10 — { patientId, patientName, episodeId, reason, date, by }
const notifications = []; // { id, kind, patientId, episodeId, title, detail, date, read }
let nextNote = 1;
function notify(kind, p, ep, title, detail) {
  notifications.unshift({ id: `N-${nextNote++}`, kind, patientId: p.id, episodeId: ep.id, title, detail, date: TODAY, read: false });
}
const emit = () => window.dispatchEvent(new Event("postpartum-updated"));

/* Calendar-day arithmetic in UTC so dates never shift with the viewer's time zone. */
const utc = iso => { const [y, m, d] = iso.split("-").map(Number); return Date.UTC(y, m - 1, d); };
const addDays = (iso, n) => new Date(utc(iso) + n * 86400000).toISOString().slice(0, 10);
export const daysBetween = (fromIso, toIso) => Math.round((utc(toIso) - utc(fromIso)) / 86400000);
export const daysPostpartum = ep => (ep.postpartum ? daysBetween(ep.postpartum.day0, TODAY) : null);

const patientOf = id => PATIENTS.find(p => p.id === id);
/** The pregnancy episode an event belongs to: the patient's current prenatal or postpartum episode. */
const episodeFor = patientId =>
  EPISODES.find(e => e.patientId === patientId && e.status === "prenatal")
  || EPISODES.find(e => e.patientId === patientId && e.status === "postpartum");

/** Conditions that add follow-ups (AC6). */
function conditionsFor(p, codes) {
  const ht = p?.mhr?.hypertensiveDisorder;
  const [s, d] = String(p?.bp || "0/0").split("/").map(Number);
  const hgb = parseFloat(p?.labs?.[0]?.value);
  return {
    hypertensive: (ht && ht !== "none") || s >= 140 || d >= 90,
    anemia: Number.isFinite(hgb) && hgb < 11,
    pph: codes.some(isPphCode),
  };
}

/** Generated follow-up visits for an outcome and the patient's conditions (AC6, AC8). */
function followUpsFor(ep, p, outcome, conds) {
  const rules = [
    ...(outcome === "Cesarean" || outcome === "Vaginal" ? FOLLOW_UP_RULES.liveBirth : FOLLOW_UP_RULES[outcome] || []),
    ...(conds.hypertensive ? FOLLOW_UP_RULES.hypertensive : []),
    ...(conds.anemia ? FOLLOW_UP_RULES.anemia : []),
    ...(conds.pph ? FOLLOW_UP_RULES.pph : []),
  ];
  const location = p.facility ? `${p.facility} · OB Outpatient` : "OB Outpatient";
  return rules.map((r, i) => {
    const due = addDays(ep.postpartum.day0, r.day);
    const overdue = due < TODAY;
    return {
      id: `PP-${ep.id}-${i}`, episodeId: ep.id, date: overdue ? TODAY : due, type: r.type,
      provider: p.provider, location, status: "scheduled", generated: true,
      reason: `${r.reason} — due day ${r.day} (${formatDate(due)})${overdue ? ", overdue" : ""}`,
      orders: [], results: [], followUpReason: "", summary: `${r.type} — ${r.reason}`,
    };
  });
}

/** Replace the episode's generated follow-ups, and close prenatal visits scheduled after Day 0. */
function scheduleFollowUps(ep, p, conds) {
  for (let i = VISITS.length - 1; i >= 0; i--) if (VISITS[i].episodeId === ep.id && VISITS[i].generated) VISITS.splice(i, 1);
  VISITS.forEach((v, i) => {
    if (v.episodeId === ep.id && v.status === "scheduled" && v.date >= ep.postpartum.day0 && !v.generated && v.type !== "Postpartum") {
      VISITS[i] = { ...v, status: "cancelled", cancellationReason: "Pregnancy ended", cancelledBy: "System", cancelledAt: TODAY };
    }
  });
  VISITS.push(...followUpsFor(ep, p, ep.postpartum.outcome, conds));
}

/**
 * Move an episode to the Postpartum worklist, or update it if it is already there (AC1, AC7).
 * Returns "moved" | "updated" | "unchanged".
 */
function moveToPostpartum(ep, { day0, outcome, deliveryType, codes, encounterId, source }) {
  const p = patientOf(ep.patientId);
  const conds = conditionsFor(p, codes);
  if (ep.status === "postpartum" && ep.postpartum) {
    if (ep.postpartum.day0 === day0 && ep.postpartum.outcome === outcome) return "unchanged";
    ep.postpartum = { ...ep.postpartum, day0, outcome, deliveryType: deliveryType ?? ep.postpartum.deliveryType, updatedAt: TODAY };
    ep.deliveryDate = day0;
    /* Only re-time follow-ups the system generated; visits booked by hand are left alone. */
    if (VISITS.some(v => v.episodeId === ep.id && v.generated)) scheduleFollowUps(ep, p, conds);
    return "updated";
  }
  ep.status = "postpartum";
  ep.deliveryDate = day0;
  ep.postpartum = {
    day0, outcome, deliveryType, codes, encounterId, source, movedAt: TODAY,
    endsOn: addDays(day0, POSTPARTUM_WINDOW_DAYS),
    antepartum: { score: p._mhr.score, max: p._mhr.maxPossible, cat: p._mhr.cat }, // AC5 — final antepartum risk
    conditions: conds,
  };
  scheduleFollowUps(ep, p, conds);
  return "moved";
}

/**
 * Process incoming FHIR resources (AC1, AC3, AC4, AC7, AC9).
 * Resources: { resourceType: "Procedure" | "Condition" | "Encounter", patientId, encounterId, code, date, class? }
 * Returns one result line per patient/encounter for the demo log.
 */
export function processFhirResources(resources) {
  const results = [];
  const byEncounter = new Map();
  resources.forEach(r => {
    if (r.resourceType === "Encounter") return;
    const key = `${r.patientId}|${r.encounterId}`;
    if (!byEncounter.has(key)) byEncounter.set(key, []);
    byEncounter.get(key).push(r);
  });

  byEncounter.forEach(list => {
    const { patientId, encounterId } = list[0];
    const p = patientOf(patientId);
    const ep = episodeFor(patientId);
    if (!p || !ep) return;
    const codes = list.map(r => r.code);
    const procedures = list.filter(r => r.resourceType === "Procedure" && PROCEDURE_CODES[r.code]);
    const deliveryDx = list.filter(r => r.resourceType === "Condition" && DIAGNOSIS_CODES[r.code]);

    if (procedures.length > 0) {
      // AC3: one entry per encounter, earliest procedure date is Day 0, most specific code sets the type.
      const day0 = procedures.map(r => r.date).sort()[0];
      const typed = procedures.find(r => PROCEDURE_CODES[r.code].deliveryType) || procedures[0];
      const { outcome, deliveryType } = PROCEDURE_CODES[typed.code];
      const result = moveToPostpartum(ep, { day0, outcome, deliveryType, codes, encounterId, source: "Procedure" });
      const i = pending.findIndex(x => x.episodeId === ep.id);
      if (i >= 0) pending.splice(i, 1);
      if (result === "moved") notify("moved", p, ep, `${p.name} moved to Postpartum`, `${outcome}${deliveryType ? ` (${deliveryType})` : ""} on ${formatDate(day0)} · procedure ${typed.code}`);
      if (result === "updated") notify("updated", p, ep, `${p.name}'s postpartum entry updated`, `End of pregnancy date changed to ${formatDate(day0)}`);
      results.push({
        patient: p.name, result,
        detail: result === "moved"
          ? `Moved to Postpartum — ${outcome}${deliveryType ? ` (${deliveryType})` : ""}, Day 0 ${formatDate(day0)}${procedures.length > 1 ? ` · ${procedures.length} procedure codes, one entry` : ""}`
          : result === "updated" ? `Already on Postpartum — entry updated, Day 0 now ${formatDate(day0)}`
          : "Already on Postpartum — no change, no duplicate created",
      });
    } else if (deliveryDx.length > 0 && ep.status === "prenatal") {
      // AC4: diagnosis only — do not move; ask the user to confirm.
      if (!pending.some(x => x.episodeId === ep.id)) {
        notify("confirm", p, ep, `Confirm end of pregnancy for ${p.name}`, `Diagnosis ${deliveryDx.map(r => r.code).join(", ")} received without a procedure code`);
        pending.push({ id: `C-${ep.id}`, patientId, episodeId: ep.id, encounterId, codes: deliveryDx.map(r => r.code), date: deliveryDx.map(r => r.date).sort()[0] });
      }
      results.push({ patient: p.name, result: "confirm", detail: `Diagnosis only (${deliveryDx.map(r => r.code).join(", ")}) — not moved, waiting for confirmation` });
    }
  });

  // AC9: a hospital admission for a postpartum patient keeps her on the list and flags a readmission.
  resources.filter(r => r.resourceType === "Encounter" && r.class === "inpatient").forEach(r => {
    const p = patientOf(r.patientId);
    const ep = EPISODES.find(e => e.patientId === r.patientId && e.status === "postpartum");
    if (!p || !ep) return;
    if (!ep.postpartum.readmission) notify("readmission", p, ep, `${p.name} readmitted`, `${r.reason || "Inpatient admission"} on ${formatDate(r.date)} · stays on Postpartum`);
    ep.postpartum.readmission = { date: r.date, reason: r.reason || "Inpatient admission" };
    results.push({ patient: p.name, result: "readmission", detail: `Readmitted ${formatDate(r.date)} — stays on Postpartum, flagged` });
  });

  emit();
  return results;
}

/** AC4: the user confirms the delivery date and outcome for a diagnosis-only record. */
export function confirmDelivery(pendingId, { day0, outcome, deliveryType }) {
  const i = pending.findIndex(x => x.id === pendingId);
  if (i < 0) return;
  const item = pending[i];
  const ep = EPISODES.find(e => e.id === item.episodeId);
  moveToPostpartum(ep, { day0, outcome, deliveryType: deliveryType || null, codes: item.codes, encounterId: item.encounterId, source: "Confirmed by user" });
  pending.splice(i, 1);
  notifications.forEach(n => { if (n.episodeId === ep.id && n.kind === "confirm") n.read = true; });
  emit();
}
export function dismissConfirmation(pendingId) {
  const i = pending.findIndex(x => x.id === pendingId);
  if (i >= 0) {
    notifications.forEach(n => { if (n.episodeId === pending[i].episodeId && n.kind === "confirm") n.read = true; });
    pending.splice(i, 1);
  }
  emit();
}
export const getPendingConfirmations = () => [...pending];
export const pendingFor = episodeId => pending.find(x => x.episodeId === episodeId) || null;
export const suggestedOutcome = codes => codes.map(c => SUGGESTED_OUTCOME[c]).find(Boolean) || "";

/** AC10: discharge from postpartum follow-up, by the user or at the end of the window. */
export function dischargeFromPostpartum(episodeId, reason, by = "Clinical IQ User") {
  const ep = EPISODES.find(e => e.id === episodeId);
  if (!ep) return;
  const p = patientOf(ep.patientId);
  ep.status = "closed";
  ep.postpartum = { ...ep.postpartum, dischargedAt: TODAY, dischargeReason: reason };
  VISITS.forEach((v, i) => {
    if (v.episodeId === episodeId && v.status === "scheduled") VISITS[i] = { ...v, status: "cancelled", cancellationReason: "Discharged from postpartum follow-up", cancelledBy: by, cancelledAt: TODAY };
  });
  dischargeLog.unshift({ patientId: ep.patientId, patientName: p?.name, episodeId, reason, date: TODAY, by });
  emit();
}
export const getDischargeLog = () => [...dischargeLog];

/* ── Notifications: what the background rules did, for the top-bar bell and the row bells ── */
export const getNotifications = () => [...notifications];
export const unreadCount = () => notifications.filter(n => !n.read).length;
export const unreadFor = episodeId => notifications.find(n => n.episodeId === episodeId && !n.read) || null;
export function markRead(id) { const n = notifications.find(x => x.id === id); if (n && !n.read) { n.read = true; emit(); } }
export function markEpisodeRead(episodeId) {
  let changed = false;
  notifications.forEach(n => { if (n.episodeId === episodeId && !n.read && n.kind !== "confirm") { n.read = true; changed = true; } });
  if (changed) emit();
}
export function markAllRead() { notifications.forEach(n => { n.read = true; }); emit(); }

/** Close postpartum episodes past the 365-day window (AC10). Runs when the worklist loads. */
export function expirePostpartumWindow() {
  EPISODES.filter(e => e.status === "postpartum" && e.postpartum && daysBetween(e.postpartum.day0, TODAY) > POSTPARTUM_WINDOW_DAYS)
    .forEach(e => dischargeFromPostpartum(e.id, `Postpartum window ended (${POSTPARTUM_WINDOW_DAYS} days)`, "System"));
}

/** Postpartum values documented on or after Day 0, from completed visit results (AC5). */
export function postpartumReadings(ep) {
  if (!ep.postpartum) return {};
  const out = {};
  visitsForEpisode(ep.id)
    .filter(v => v.status === "completed" && v.date >= ep.postpartum.day0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(v => (v.results || []).forEach(r => {
      const label = r.label.replace(/^Postpartum\s+/i, "").toUpperCase();
      const value = parseFloat(r.value);
      if (label === "HGB") out.hgb = { value: String(value), status: value < 10 ? "critical" : value < 11 ? "high" : "normal" };
      if (label === "FERRITIN") out.ferritin = { value: String(value), status: value < 15 ? "critical" : value < 30 ? "high" : "normal" };
      if (label === "TSAT" || label === "TRANSFERRIN SAT") out.tsat = { value: String(value), status: value < 20 ? "high" : "normal" };
      if (label === "BP") out.bp = { value: r.value.split(" ")[0] };
    }));
  return out;
}

/* ── Seed: Linda Kowalski is already postpartum in the original data (vaginal delivery, Sep 9). ── */
(function seed() {
  const ep = EPISODES.find(e => e.id === "EP-006");
  if (ep && !ep.postpartum) {
    const p = patientOf(ep.patientId);
    ep.postpartum = {
      day0: ep.deliveryDate, outcome: "Vaginal", deliveryType: "Spontaneous", codes: ["10E0XZZ", "Z37.0"], encounterId: "E-6001",
      source: "Procedure", movedAt: ep.deliveryDate, endsOn: addDays(ep.deliveryDate, POSTPARTUM_WINDOW_DAYS),
      antepartum: { score: p._mhr.score, max: p._mhr.maxPossible, cat: p._mhr.cat }, conditions: conditionsFor(p, []),
    };
  }
})();

/*
 * DEMO ONLY: the prototype "receives" the feed a few seconds after it opens, as if Epic had just
 * sent the records. Nothing on screen triggers it; reloading the page replays it.
 */
export const DEMO_FEED_DELAY_MS = 4000;
let demoStarted = false;
export function startDemoFeed(onDone) {
  if (demoStarted) return;
  demoStarted = true;
  setTimeout(() => onDone?.(processFhirResources(DEMO_FHIR_FEED)), DEMO_FEED_DELAY_MS);
}

/*
 * DEMO ONLY: a batch of FHIR resources the prototype can "receive" from the EHR feed.
 * It exercises one move per encounter, multiple gestation, earliest Day 0, diagnosis-only,
 * non-live-birth outcome, an update to an existing entry, and a readmission.
 */
export const DEMO_FHIR_FEED = [
  { resourceType: "Procedure", patientId: "MR-7821", encounterId: "E-7101", code: "10D00Z1", date: "2026-10-18", note: "Twin A" },
  { resourceType: "Procedure", patientId: "MR-7821", encounterId: "E-7101", code: "10D00Z1", date: "2026-10-18", note: "Twin B" },
  { resourceType: "Condition", patientId: "MR-7821", encounterId: "E-7101", code: "Z37.2", date: "2026-10-18" },
  { resourceType: "Condition", patientId: "MR-7821", encounterId: "E-7101", code: "O72.1", date: "2026-10-18", note: "Postpartum hemorrhage" },
  { resourceType: "Procedure", patientId: "SM-9643", encounterId: "E-7102", code: "10D07Z6", date: "2026-10-16" },
  { resourceType: "Procedure", patientId: "SM-9643", encounterId: "E-7102", code: "10E0XZZ", date: "2026-10-15" },
  { resourceType: "Condition", patientId: "JW-3431", encounterId: "E-7103", code: "O80", date: "2026-10-17" },
  { resourceType: "Procedure", patientId: "NB-7742", encounterId: "E-7104", code: "10T24ZZ", date: "2026-10-17" },
  { resourceType: "Procedure", patientId: "LK-5509", encounterId: "E-6001", code: "10E0XZZ", date: "2026-09-08", note: "Corrected procedure date" },
  { resourceType: "Encounter", patientId: "LK-5509", encounterId: "E-7105", class: "inpatient", date: "2026-10-19", reason: "Postpartum preeclampsia" },
];
export const codeLabel = code => PROCEDURE_CODES[code]?.display || DIAGNOSIS_CODES[code] || (isPphCode(code) ? "Postpartum hemorrhage" : code);
