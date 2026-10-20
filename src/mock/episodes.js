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
export const gaAtVisit = (edd, dateStr) => {
  const lmp = lmpFromEdd(edd);
  const target = parseDate(dateStr);
  const totalDays = Math.round((target - lmp) / 86400000);
  if (totalDays < 0) return { weeks: 0, days: 0, label: "Pre-pregnancy" };
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, label: `${weeks}w${days}d` };
};

// Current gestational age based on EDD vs TODAY
export const gestationalAge = (edd) => gaAtVisit(edd, TODAY);

// Next visit: earliest scheduled visit with date >= today — derived, never stored
export const nextVisit = (visits) => {
  return visits
    .filter(v => v.status === "scheduled" && v.date >= TODAY)
    .sort((a, b) => a.date.localeCompare(b.date))[0] || null;
};

// ── Episodes (one per pregnancy) ──────────────────────────────────
export const EPISODES = [
  { id:"EP-001", patientId:"MR-7821", status:"prenatal",   edd:"2027-02-15", gravida:4, para:2, startDate:"2026-05-25", obType:"OB Surgical" },
  { id:"EP-002", patientId:"SM-9643", status:"prenatal",   edd:"2027-01-28", gravida:2, para:1, startDate:"2026-04-23", obType:"OB Non-Surgical" },
  { id:"EP-003", patientId:"PS-0081", status:"prenatal",   edd:"2027-02-10", gravida:1, para:0, startDate:"2026-05-06", obType:"OB Non-Surgical" },
  { id:"EP-004", patientId:"JW-3431", status:"prenatal",   edd:"2027-03-01", gravida:5, para:2, startDate:"2026-05-24", obType:"OB Surgical" },
  { id:"EP-005", patientId:"AT-9012", status:"prenatal",   edd:"2027-03-15", gravida:1, para:0, startDate:"2026-06-07", obType:"OB Non-Surgical" },
  { id:"EP-006", patientId:"LK-5509", status:"postpartum", edd:"2026-09-09", gravida:3, para:1, startDate:"2025-12-13", obType:"Postpartum" },
  { id:"EP-007", patientId:"NB-7742", status:"closed",     edd:"2026-06-23", gravida:2, para:1, startDate:"2025-09-06", obType:"Postpartum" },
  { id:"EP-008", patientId:"NB-7742", status:"prenatal",   edd:"2027-06-15", gravida:3, para:1, startDate:"2026-09-08", obType:"OB Non-Surgical" },
];

// ── Visits ────────────────────────────────────────────────────────
export const VISITS = [
  // EP-001 — Maria Rodriguez (prenatal, 3 future visits — de-dupe proof)
  { id:"V-001", episodeId:"EP-001", date:"2026-10-15", type:"Routine prenatal", provider:"Dr. Chen",  location:"North Aux Hospital · OB High Risk", status:"completed" },
  { id:"V-002", episodeId:"EP-001", date:"2026-10-22", type:"Routine prenatal", provider:"Dr. Chen",  location:"North Aux Hospital · OB High Risk", status:"scheduled" },
  { id:"V-003", episodeId:"EP-001", date:"2026-10-29", type:"Lab",              provider:"Dr. Chen",  location:"North Aux Hospital · Lab",          status:"scheduled" },
  { id:"V-004", episodeId:"EP-001", date:"2026-11-12", type:"Growth scan",      provider:"Dr. Chen",  location:"North Aux Hospital · US",           status:"scheduled" },

  // EP-002 — Sarah Martinez (prenatal, 3 future visits)
  { id:"V-005", episodeId:"EP-002", date:"2026-10-14", type:"Routine prenatal", provider:"Dr. Patel",  location:"North Aux Hospital · OB High Risk", status:"completed" },
  { id:"V-006", episodeId:"EP-002", date:"2026-10-21", type:"MFM consult",      provider:"Dr. Patel",  location:"North Aux Hospital · MFM Clinic",   status:"scheduled" },
  { id:"V-007", episodeId:"EP-002", date:"2026-11-04", type:"Ultrasound",       provider:"Dr. Patel",  location:"North Aux Hospital · US",           status:"scheduled" },
  { id:"V-008", episodeId:"EP-002", date:"2026-12-02", type:"NST/BPP",          provider:"Dr. Patel",  location:"North Aux Hospital · L&D",          status:"scheduled" },

  // EP-003 — Priya Sharma (prenatal, 2 future visits)
  { id:"V-009", episodeId:"EP-003", date:"2026-10-12", type:"Routine prenatal", provider:"Dr. Nguyen", location:"North Aux Hospital · OB Outpatient", status:"completed" },
  { id:"V-010", episodeId:"EP-003", date:"2026-10-25", type:"Routine prenatal", provider:"Dr. Nguyen", location:"North Aux Hospital · OB Outpatient", status:"scheduled" },
  { id:"V-011", episodeId:"EP-003", date:"2026-11-08", type:"Lab",              provider:"Dr. Nguyen", location:"North Aux Hospital · Lab",          status:"scheduled" },

  // EP-004 — Jennifer Washington (prenatal, 2 future visits)
  { id:"V-012", episodeId:"EP-004", date:"2026-10-10", type:"Routine prenatal", provider:"Dr. Kim",    location:"North Aux Hospital · OB Outpatient", status:"completed" },
  { id:"V-013", episodeId:"EP-004", date:"2026-10-23", type:"Routine prenatal", provider:"Dr. Kim",    location:"North Aux Hospital · OB Outpatient", status:"scheduled" },
  { id:"V-014", episodeId:"EP-004", date:"2026-11-20", type:"Growth scan",      provider:"Dr. Kim",    location:"North Aux Hospital · US",           status:"scheduled" },

  // EP-005 — Ashley Thompson (prenatal, NO future visit — scheduling gap to chase)
  { id:"V-015", episodeId:"EP-005", date:"2026-10-15", type:"Routine prenatal", provider:"Dr. Williams", location:"North Aux Hospital · OB Outpatient", status:"completed" },

  // EP-006 — Linda Kowalski (postpartum — delivery done, postpartum visit scheduled)
  { id:"V-016", episodeId:"EP-006", date:"2026-09-09", type:"Delivery",   provider:"Dr. Osei",   location:"North Aux Hospital · L&D",          status:"completed" },
  { id:"V-017", episodeId:"EP-006", date:"2026-10-28", type:"Postpartum", provider:"Dr. Osei",   location:"North Aux Hospital · OB Outpatient", status:"scheduled" },

  // EP-007 — Nora Bennett (closed — prior pregnancy fully completed)
  { id:"V-018", episodeId:"EP-007", date:"2026-06-23", type:"Delivery",   provider:"Dr. Rivera", location:"Main Hospital · L&D",          status:"completed" },
  { id:"V-019", episodeId:"EP-007", date:"2026-07-10", type:"Postpartum", provider:"Dr. Rivera", location:"Main Hospital · OB Outpatient", status:"completed" },

  // EP-008 — Nora Bennett (new prenatal pregnancy after closed episode — AC7)
  { id:"V-020", episodeId:"EP-008", date:"2026-10-08", type:"Routine prenatal", provider:"Dr. Rivera", location:"Main Hospital · OB Outpatient", status:"completed" },
  { id:"V-021", episodeId:"EP-008", date:"2026-10-24", type:"Routine prenatal", provider:"Dr. Rivera", location:"Main Hospital · OB Outpatient", status:"scheduled" },
  { id:"V-022", episodeId:"EP-008", date:"2026-11-21", type:"Ultrasound",       provider:"Dr. Rivera", location:"Main Hospital · US",           status:"scheduled" },
];

// ── Derivation helpers (reused by worklist + patient detail) ──────
export const visitsForEpisode = (episodeId) => VISITS.filter(v => v.episodeId === episodeId);

// Active episodes (not closed) with computed nextVisit and GA
export const getActiveEpisodes = () => {
  return EPISODES
    .filter(e => e.status !== "closed")
    .map(e => {
      const visits = visitsForEpisode(e.id);
      const nv = nextVisit(visits);
      return {
        ...e,
        visits,
        nextVisit: nv,
        ga: gestationalAge(e.edd),
        parityLabel: `G${e.gravida}P${e.para}`,
        hasNoUpcoming: nv === null,
      };
    });
};
