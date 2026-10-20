// Single source of truth for pregnancy episodes and visits.
// Shaped to mirror FHIR: future visits = Appointment, past visits = Encounter.

export const VISIT_TYPES = [
  "Routine prenatal",
  "Ultrasound",
  "Growth scan",
  "MFM consult",
  "Lab",
  "NST/BPP",
  "Delivery",
  "Postpartum",
];

// Fixed "today" for deterministic prototype behavior
export const TODAY = "2026-10-20";

// ── Date helpers ──────────────────────────────────────────────────
const parseDate = (str) => new Date(`${str}T00:00:00`);

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const formatDate = (iso) => {
  const d = parseDate(iso);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
};

// LMP = EDD - 280 days
const lmpFromEdd = (edd) => {
  const d = parseDate(edd);
  d.setDate(d.getDate() - 280);
  return d;
};

// Gestational age at a given reference date — { weeks, days, label }
// For postpartum/closed episodes this returns a postpartum week count instead.
export const gaAtVisit = (episode, dateStr) => {
  const isPostpartum = episode.status === "postpartum" || episode.status === "closed";
  if (isPostpartum) {
    const edd = parseDate(episode.edd);
    const target = parseDate(dateStr);
    const diffDays = Math.round((target - edd) / 86400000);
    if (diffDays < 0) {
      // Visit occurred before delivery — compute prenatal GA
      const lmp = lmpFromEdd(episode.edd);
      const totalDays = Math.round((target - lmp) / 86400000);
      const weeks = Math.floor(totalDays / 7);
      const days = totalDays % 7;
      return { weeks, days, label: `${weeks}w${days}d`, postpartum: false };
    }
    const ppWeeks = Math.floor(diffDays / 7);
    return { weeks: ppWeeks, days: diffDays % 7, label: `${ppWeeks}w PP`, postpartum: true };
  }
  const lmp = lmpFromEdd(episode.edd);
  const target = parseDate(dateStr);
  const totalDays = Math.round((target - lmp) / 86400000);
  if (totalDays < 0) return { weeks: 0, days: 0, label: "Pre-pregnancy", postpartum: false };
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, label: `${weeks}w${days}d`, postpartum: false };
};

// Current gestational age (or postpartum age) based on episode status + EDD vs TODAY
export const gestationalAge = (episode) => {
  const edd = typeof episode === "string" ? episode : episode.edd;
  const ep = typeof episode === "object" ? episode : { edd, status: "prenatal" };
  const result = gaAtVisit(ep, TODAY);
  return result;
};

// PLACEHOLDER risk-tier bands — pending clinical confirmation.
// Low 0–18, Moderate 19–36, High 37–55, Critical 56–74
export const RISK_TIERS = [
  { min: 0,  label: "Low",      color: "#388032" },
  { min: 19, label: "Moderate", color: "#92600A" },
  { min: 37, label: "High",     color: "#F58126" },
  { min: 56, label: "Critical", color: "#B00A2F" },
];

export const getMaternalRiskTier = (score) => {
  return RISK_TIERS.reduce((acc, t) => (score >= t.min ? t : acc), RISK_TIERS[0]);
};

// Next visit: earliest scheduled visit with date >= today — derived, never stored
export const nextVisit = (visits) => {
  return visits
    .filter(v => v.status === "scheduled" && v.date >= TODAY)
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
};

// Future visits: all scheduled with date >= today, soonest-first
export const futureVisits = (visits) => {
  return visits
    .filter(v => v.status === "scheduled" && v.date >= TODAY)
    .sort((a, b) => a.date.localeCompare(b.date));
};

// Past visits: all completed, most-recent-first
export const pastVisits = (visits) => {
  return visits
    .filter(v => v.status === "completed")
    .sort((a, b) => b.date.localeCompare(a.date));
};

// One-line summary for a visit row — derived from visit fields, not stored separately
export const visitOneLiner = (visit) => {
  if (visit.summary) return visit.summary;
  const parts = [visit.type];
  if (visit.status === "completed") {
    if (visit.orders && visit.orders.length > 0) {
      parts.push(visit.orders.map(o => o.label || o).join(", "));
    }
    if (visit.results && visit.results.length > 0) {
      parts.push(`${visit.results.length} result${visit.results.length > 1 ? "s" : ""}`);
    }
  } else {
    if (visit.reason) parts.push(visit.reason);
  }
  return parts.join(" — ");
};

// ── Episodes (one per pregnancy) ──────────────────────────────────
export const EPISODES = [
  { id:"EP-001", patientId:"MR-7821", status:"prenatal",   edd:"2027-02-15", gravida:4, para:2, startDate:"2026-05-25", obType:"OB Surgical" },
  { id:"EP-002", patientId:"SM-9643", status:"prenatal",   edd:"2027-01-28", gravida:2, para:1, startDate:"2026-04-23", obType:"OB Non-Surgical" },
  { id:"EP-003", patientId:"PS-0081", status:"prenatal",   edd:"2027-02-10", gravida:1, para:0, startDate:"2026-05-06", obType:"OB Non-Surgical" },
  { id:"EP-004", patientId:"JW-3431", status:"prenatal",   edd:"2027-03-01", gravida:5, para:2, startDate:"2026-05-24", obType:"OB Surgical" },
  { id:"EP-005", patientId:"AT-9012", status:"prenatal",   edd:"2027-03-15", gravida:1, para:0, startDate:"2026-06-07", obType:"OB Non-Surgical" },
  { id:"EP-006", patientId:"LK-5509", status:"postpartum", edd:"2026-09-09", gravida:3, para:1, startDate:"2025-12-13", obType:"OB Non-Surgical" },
  { id:"EP-007", patientId:"NB-7742", status:"closed",     edd:"2026-06-23", gravida:2, para:1, startDate:"2025-09-06", obType:"OB Non-Surgical" },
  { id:"EP-008", patientId:"NB-7742", status:"prenatal",   edd:"2027-06-15", gravida:3, para:1, startDate:"2026-09-08", obType:"OB Non-Surgical" },
];

// ── Visits ────────────────────────────────────────────────────────
// Each visit: { id, episodeId, date, type, provider, location, status,
//   reason, orders[], results[], followUpReason, summary }
export const VISITS = [
  // EP-001 — Maria Rodriguez (prenatal, 3 future visits — de-dupe proof)
  { id:"V-001", episodeId:"EP-001", date:"2026-10-15", type:"Routine prenatal", provider:"Dr. Chen", location:"North Aux Hospital · OB High Risk", status:"completed",
    reason:"32-week routine prenatal visit", orders:[{label:"CBC w/ differential"},{label:"Type & screen"}], results:[{label:"HGB",value:"7.2 g/dL",flag:"critical"},{label:"Ferritin",value:"6 ng/mL",flag:"critical"}], followUpReason:"HGB critical — IV iron therapy initiated, recheck in 1 week", summary:"Routine prenatal — BP & labs, Hgb 7.2 critical, IV iron ordered" },
  { id:"V-002", episodeId:"EP-001", date:"2026-10-22", type:"Routine prenatal", provider:"Dr. Chen", location:"North Aux Hospital · OB High Risk", status:"scheduled",
    reason:"33-week routine prenatal — anemia follow-up", orders:[], results:[], followUpReason:"", summary:"Routine prenatal — anemia response check, IV iron round 2" },
  { id:"V-003", episodeId:"EP-001", date:"2026-10-29", type:"Lab", provider:"Dr. Chen", location:"North Aux Hospital · Lab", status:"scheduled",
    reason:"Repeat CBC + iron panel post-IV iron", orders:[{label:"CBC"},{label:"Iron panel (Ferritin, TSAT, TIBC)"}], results:[], followUpReason:"", summary:"Lab — repeat CBC + iron panel to assess IV iron response" },
  { id:"V-004", episodeId:"EP-001", date:"2026-11-12", type:"Growth scan", provider:"Dr. Chen", location:"North Aux Hospital · US", status:"scheduled",
    reason:"36-week growth ultrasound — twins surveillance", orders:[{label:"Growth ultrasound"}], results:[], followUpReason:"", summary:"Growth scan — twin biometry & estimated fetal weight" },

  // EP-002 — Sarah Martinez (prenatal, 3 future visits)
  { id:"V-005", episodeId:"EP-002", date:"2026-10-14", type:"Routine prenatal", provider:"Dr. Patel", location:"North Aux Hospital · OB High Risk", status:"completed",
    reason:"30-week routine prenatal visit", orders:[{label:"CBC"},{label:"Anti-D antibody titer"}], results:[{label:"HGB",value:"7.8 g/dL",flag:"critical"},{label:"Ferritin",value:"9 ng/mL",flag:"critical"}], followUpReason:"Severe anemia + placenta accreta — MFM consult scheduled", summary:"Routine prenatal — Hgb 7.8 critical, accreta risk noted, MFM booked" },
  { id:"V-006", episodeId:"EP-002", date:"2026-10-21", type:"MFM consult", provider:"Dr. Patel", location:"North Aux Hospital · MFM Clinic", status:"scheduled",
    reason:"MFM consult — placenta accreta + severe anemia co-management", orders:[{label:"MFM consultation note"}], results:[], followUpReason:"", summary:"MFM consult — high-risk monitoring for accreta & anemia" },
  { id:"V-007", episodeId:"EP-002", date:"2026-11-04", type:"Ultrasound", provider:"Dr. Patel", location:"North Aux Hospital · US", status:"scheduled",
    reason:"Detailed anatomy + placental mapping ultrasound", orders:[{label:"Level 2 ultrasound"},{label:"Placental color Doppler"}], results:[], followUpReason:"", summary:"Ultrasound — placental mapping for accreta assessment" },
  { id:"V-008", episodeId:"EP-002", date:"2026-12-02", type:"NST/BPP", provider:"Dr. Patel", location:"North Aux Hospital · L&D", status:"scheduled",
    reason:"36-week antepartum fetal surveillance", orders:[{label:"Non-stress test"},{label:"Biophysical profile"}], results:[], followUpReason:"", summary:"NST/BPP — 36-week fetal well-being assessment" },

  // EP-003 — Priya Sharma (prenatal, 2 future visits)
  { id:"V-009", episodeId:"EP-003", date:"2026-10-12", type:"Routine prenatal", provider:"Dr. Nguyen", location:"North Aux Hospital · OB Outpatient", status:"completed",
    reason:"28-week routine prenatal visit", orders:[{label:"CBC"},{label:"TSH"}], results:[{label:"HGB",value:"9.2 g/dL",flag:"high"},{label:"Ferritin",value:"11 ng/mL",flag:"high"},{label:"TSH",value:"3.8 mIU/L",flag:"high"}], followUpReason:"Iron deficiency + hypothyroidism — IV iron booked, Levothyroxine adjusted", summary:"Routine prenatal — Hgb 9.2, iron deficiency, thyroid dose adjusted" },
  { id:"V-010", episodeId:"EP-003", date:"2026-10-25", type:"Routine prenatal", provider:"Dr. Nguyen", location:"North Aux Hospital · OB Outpatient", status:"scheduled",
    reason:"30-week routine prenatal — anemia follow-up", orders:[], results:[], followUpReason:"", summary:"Routine prenatal — post-IV iron response check" },
  { id:"V-011", episodeId:"EP-003", date:"2026-11-08", type:"Lab", provider:"Dr. Nguyen", location:"North Aux Hospital · Lab", status:"scheduled",
    reason:"Repeat CBC + iron panel + TSH", orders:[{label:"CBC"},{label:"Iron panel"},{label:"TSH"}], results:[], followUpReason:"", summary:"Lab — CBC, iron panel, thyroid recheck" },

  // EP-004 — Jennifer Washington (prenatal, 2 future visits)
  { id:"V-012", episodeId:"EP-004", date:"2026-10-10", type:"Routine prenatal", provider:"Dr. Kim", location:"North Aux Hospital · OB Outpatient", status:"completed",
    reason:"24-week routine prenatal visit", orders:[{label:"CBC"},{label:"1-hr glucose challenge"}], results:[{label:"HGB",value:"10.1 g/dL",flag:"high"},{label:"1-hr GCT",value:"142 mg/dL",flag:"high"}], followUpReason:"Anemia + elevated glucose — IV iron booked, 3-hr GTT ordered", summary:"Routine prenatal — Hgb 10.1, elevated glucose, IV iron + GTT ordered" },
  { id:"V-013", episodeId:"EP-004", date:"2026-10-23", type:"Routine prenatal", provider:"Dr. Kim", location:"North Aux Hospital · OB Outpatient", status:"scheduled",
    reason:"26-week routine prenatal + GDM follow-up", orders:[], results:[], followUpReason:"", summary:"Routine prenatal — GDM screening result review" },
  { id:"V-014", episodeId:"EP-004", date:"2026-11-20", type:"Growth scan", provider:"Dr. Kim", location:"North Aux Hospital · US", status:"scheduled",
    reason:"32-week growth ultrasound", orders:[{label:"Growth ultrasound"}], results:[], followUpReason:"", summary:"Growth scan — fetal biometry & amniotic fluid assessment" },

  // EP-005 — Ashley Thompson (prenatal, NO future visit — scheduling gap to chase)
  { id:"V-015", episodeId:"EP-005", date:"2026-10-15", type:"Routine prenatal", provider:"Dr. Williams", location:"North Aux Hospital · OB Outpatient", status:"completed",
    reason:"20-week routine prenatal visit", orders:[{label:"CBC"},{label:"Anatomy ultrasound"}], results:[{label:"HGB",value:"11.4 g/dL",flag:"low"},{label:"Ferritin",value:"28 ng/mL",flag:"low"}], followUpReason:"Mild anemia — oral iron started, next visit not yet scheduled", summary:"Routine prenatal — anatomy scan normal, oral iron started, no follow-up booked" },

  // EP-006 — Linda Kowalski (postpartum — delivery done, postpartum visit scheduled)
  { id:"V-016", episodeId:"EP-006", date:"2026-09-09", type:"Delivery", provider:"Dr. Osei", location:"North Aux Hospital · L&D", status:"completed",
    reason:"Spontaneous vaginal delivery at 39w2d", orders:[{label:"Postpartum CBC"},{label:"RhIG (if indicated)"}], results:[{label:"Delivery",value:"SVD at 39w2d, EBL 600mL",flag:"normal"},{label:"Postpartum HGB",value:"10.8 g/dL",flag:"high"}], followUpReason:"Postpartum visit scheduled at 6 weeks", summary:"Delivery — SVD at 39w2d, EBL 600mL, postpartum Hgb 10.8" },
  { id:"V-017", episodeId:"EP-006", date:"2026-10-28", type:"Postpartum", provider:"Dr. Osei", location:"North Aux Hospital · OB Outpatient", status:"scheduled",
    reason:"6-week postpartum visit", orders:[{label:"Postpartum CBC"},{label:"Depression screening"}], results:[], followUpReason:"", summary:"Postpartum — 6-week check, CBC, depression screening" },

  // EP-007 — Nora Bennett (closed — prior pregnancy fully completed)
  { id:"V-018", episodeId:"EP-007", date:"2026-06-23", type:"Delivery", provider:"Dr. Rivera", location:"Main Hospital · L&D", status:"completed",
    reason:"Scheduled repeat cesarean delivery at 39w", orders:[{label:"Postpartum CBC"},{label:"Tubes tie note"}], results:[{label:"Delivery",value:"Repeat C-section at 39w0d, EBL 750mL",flag:"normal"},{label:"Postpartum HGB",value:"11.2 g/dL",flag:"low"}], followUpReason:"Postpartum visit scheduled at 6 weeks", summary:"Delivery — repeat C-section at 39w, EBL 750mL, Hgb 11.2" },
  { id:"V-019", episodeId:"EP-007", date:"2026-07-10", type:"Postpartum", provider:"Dr. Rivera", location:"Main Hospital · OB Outpatient", status:"completed",
    reason:"6-week postpartum visit", orders:[{label:"Postpartum CBC"},{label:"Depression screening"},{label:"Contraception counseling"}], results:[{label:"HGB",value:"12.1 g/dL",flag:"normal"},{label:"Edinburgh PPD",value:"3 (negative)",flag:"normal"}], followUpReason:"Episode closed — pregnancy care complete", summary:"Postpartum — 6-week check, Hgb 12.1 normal, PPD screen negative, episode closed" },

  // EP-008 — Nora Bennett (new prenatal pregnancy after closed episode — AC7)
  { id:"V-020", episodeId:"EP-008", date:"2026-10-08", type:"Routine prenatal", provider:"Dr. Rivera", location:"Main Hospital · OB Outpatient", status:"completed",
    reason:"6-week new pregnancy intake visit", orders:[{label:"Initial prenatal panel"},{label:"Dating ultrasound"}], results:[{label:"HGB",value:"13.0 g/dL",flag:"normal"},{label:"Dating US",value:"6w2d",flag:"normal"}], followUpReason:"Routine follow-up at 10 weeks", summary:"New pregnancy intake — labs normal, dating US 6w2d" },
  { id:"V-021", episodeId:"EP-008", date:"2026-10-24", type:"Routine prenatal", provider:"Dr. Rivera", location:"Main Hospital · OB Outpatient", status:"scheduled",
    reason:"10-week routine prenatal visit", orders:[{label:"Cell-free DNA"},{label:"CBC"}], results:[], followUpReason:"", summary:"Routine prenatal — 10-week visit, NIPT ordering" },
  { id:"V-022", episodeId:"EP-008", date:"2026-11-21", type:"Ultrasound", provider:"Dr. Rivera", location:"Main Hospital · US", status:"scheduled",
    reason:"12-week nuchal translucency ultrasound", orders:[{label:"NT ultrasound"}], results:[], followUpReason:"", summary:"Ultrasound — 12-week NT scan for aneuploidy screening" },
];

// ── Derivation helpers (reused by worklist + patient detail) ──────
export const visitsForEpisode = (episodeId) => VISITS.filter(v => v.episodeId === episodeId);

export const getEpisode = (episodeId) => EPISODES.find(e => e.id === episodeId) || null;

// Active episodes (not closed) with computed nextVisit and GA
export const getActiveEpisodes = () => {
  return EPISODES
    .filter(e => e.status !== "closed")
    .map(e => {
      const visits = visitsForEpisode(e.id);
      const nv = nextVisit(visits);
      const ga = gestationalAge(e);
      return {
        ...e,
        visits,
        nextVisit: nv,
        ga,
        parityLabel: `G${e.gravida}P${e.para}`,
        hasNoUpcoming: nv === null,
        gaLabel: ga.postpartum ? `${ga.weeks}w PP` : `${ga.weeks}W`,
      };
    });
};
