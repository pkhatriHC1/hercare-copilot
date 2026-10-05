# HerCare Co-Pilot — Prototype Documentation

**Obstetric Anemia Clinical Decision Support**
**Version:** 1.0 · **Date:** September 2026 · **Status:** Interactive Prototype

---

## What This Prototype Demonstrates

HerCare Co-Pilot is a clinical decision support (CDS) application for obstetric care teams. It helps clinicians identify, risk-stratify, and treat iron deficiency anemia in pregnant patients by surfacing lab values, calculating evidence-based risk scores, generating AI-assisted diagnoses and care plans, and guiding clinicians through a structured approval and prior-authorization workflow.

The goal: reduce severe maternal morbidity (SMM) by ensuring timely IV iron intervention before delivery, aligned with ACOG Practice Bulletin #233 and the ACOG Safe Motherhood Initiative.

All data is synthetic. No real PHI is used. No backend or authentication is required.

---

## How to Run

```bash
npm install
npm run dev      # Development server at http://localhost:5173
npm run build    # Production build to /dist
npm run preview  # Preview the production build
```

**Prerequisites:** Node.js 18+, npm.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 |
| Build tool | Vite 6 |
| Styling | Tailwind CSS 4 + inline styles |
| Icons | lucide-react + custom SVGs |
| Font | Source Sans Pro (Google Fonts) |
| Data | In-memory (hard-coded synthetic patients) |

---

## Project Structure

```
project/
├── index.html              # HTML entry, Google Fonts (Source Sans Pro)
├── vite.config.js           # Vite config (React + Tailwind + @ alias)
├── PRD.md                   # Product Requirements Document
├── README.md                # Project overview
├── PROTOTYPE.md             # This file
├── src/
│   ├── main.jsx             # React root mount
│   ├── index.css            # Tailwind import + global resets
│   ├── App.jsx              # Full application (~1460 lines)
│   └── components/
│       └── Button.jsx       # Reusable button (primary/secondary/cta)
└── package.json
```

All application logic, views, and synthetic patient data live in `src/App.jsx`.

---

## Screens & User Flows

### 1. Patient Worklist (Landing)

The main dashboard. A searchable, filterable table of OB anemia patients.

**Columns:**
- Patient / Gestational Age (name, MRN, age, parity, GA, case type badges)
- EDD (estimated delivery date)
- Lab Values (HGB + Ferritin with severity chips)
- TRS (Transfusion Risk Score gauge, click to open detail drawer)
- ACOG Risk (score /100 with severity chip and contributing factor count, click to open modal)
- Active Order (shows CR status indicator + order text; "CR Not Started" in red when care plan is pending)
- Provider (name + role)
- Anemia Severity (4-tier chip)
- Actions ("Review Optimization Recommendations" button → opens patient detail)

**Filters:** Case Type (OB Surgical, OB Non-Surgical, Postpartum), Severity (Critical, High, Low). Search by patient name, MRN, or provider.

**CR Status Indicators:**
- **CR Not Started** (red) — care plan pending, no active order shown
- **CR In Progress** (orange) — care plan being generated
- **CR Generated** (green) — care plan ready for review

### 2. Patient Detail View

Opened by clicking a patient row or the "Review Optimization Recommendations" button.

**Layout:**
- Top nav bar: hc1 ClinicalIQ branding, module switcher (Anemia Management / HerCare Co-Pilot), FHIR R4 live status
- Patient header: name, severity chip, provider, MRN, age/sex, NPI, obstetric history
- Mini worklist sidebar: quick patient switching
- Tab navigation: Clinical Decision Support (Overview), Care Plan

**Overview Zone — Risk Assessment Panel:**
Five-column panel: HGB (with trend delta), Ferritin, ACOG Score, TRS gauge, Active Order. When CR status is "Not Started," the Active Order section shows the red CR indicator instead of order text.

**Overview Zone — AI Insight Card:**
Gradient header with radial dot texture. Summarizes patient condition, recommended protocol (ACOG PB #233), drug regimen, and numbered key recommendations. CTA navigates to Care Plan.

**Overview Zone — Evidence Base:**
Cites ACOG PB #233, ACOG Safe Motherhood Initiative, NEJM studies, WHO guidelines.

### 3. ACOG Risk Score Modal

Opened by clicking the ACOG Risk score in the worklist or overview.

- Full 12-condition master list with ICD-10 codes and weighted point values
- Score = Baseline (15) + earned condition points
- Four-tier severity: Critical (>=80), High (>=60), Moderate (>=40), Low (<40)
- Each condition has a custom SVG icon with earned/unearned indicators
- Clinical recommendations and expected outcome (60-70% SMM reduction)

**ACOG Conditions & Points:**

| Condition | Points | ICD-10 |
|-----------|--------|--------|
| Multiple Gestations | 30 | O30.C30 |
| History Preterm Labor | 20 | O09.21 |
| Hypertension | 15 | I10-I13 |
| Anemia | 15 | D50, O99.011 |
| Cardiac Disease | 15 | I00-I52 |
| Diabetes | 12 | O24, E11 |
| Placenta Previa | 12 | O44 |
| Prior Cesarean | 10 | O34.21 |
| Obesity | 10 | E66, O99.21 |
| Recent Pregnancy | 10 | Z33 |
| Advanced Maternal Age | 8 | O09.52 |
| Thyroid Disease | 8 | O99.28, E00-E07 |

### 4. Transfusion Risk Score (TRS) Drawer

Opened by clicking the TRS gauge in the worklist or overview.

- 10-point scoring system (10 criteria, 0-2 points each)
- Semi-circular SVG gauge with score and severity chip
- Full breakdown: earned/missed points per criterion
- Tier-specific recommended actions (Low through Very High)
- Evidence: Karkouti et al., Anesthesiology 2006

**TRS Criteria:** Hemoglobin, Creatinine, Weight, Gender, Age, Surgery Timing, Redo Procedure, Non-Isolated Surgery, Comorbidities, Anticoagulant Use.

**TRS Tiers:** Very High (>=4), High (3), Intermediate (2), Low (<=1).

### 5. Care Plan Workflow (Two-Step)

**Step 1 — Diagnose:**
- AI-generated diagnosis with confidence score
- ICD-10 codes
- ACOG clinical criteria met
- Evidence base
- Editable attested diagnosis field
- Optional clinical notes

**Step 2 — Care Plan:**
- Treatment goals
- Three interventions: Medication Order, Lab Monitoring, Specialist Consult
- Prior authorization assessment with LCD/NCD criteria check
- AI probability of approval with progress bar
- Clinical evidence summary and references
- Final action: "Approve & Transmit to Pharmacy" with success confirmation screen

### 6. AI Chat (OB CDS Chat)

- Persistent chat panel with AI assistant
- Pre-loaded ACOG risk assessment summary message
- Quick-prompt buttons (ACOG guidelines, IV iron vs oral, delivery planning)
- Evidence study lookup (ACOG PB #233, SMM Prevention, ESAIC 2023)
- Copy-to-clipboard on AI messages
- Expandable to fullscreen

### 7. IQ Assistant Panel

- Slide-in side panel accessible from patient header
- Patient-contextualized chat with quick prompts
- Expandable/collapsible width
- Live status indicator

---

## Synthetic Patient Data

Six sample patients span Critical, High, and Low severity:

| Patient | Severity | HGB | Ferritin | ACOG | Case Type | CR Status |
|---------|----------|-----|----------|------|-----------|-----------|
| Maria Rodriguez | Critical | 7.2 | 6 | High | OB Surgical | Not Started |
| Sarah Martinez | Critical | 7.8 | 9 | High | OB Non-Surgical | In Progress |
| Priya Sharma | High | 9.2 | 11 | Moderate | OB Non-Surgical | Generated |
| Jennifer Washington | High | 10.1 | 22 | High | OB Surgical | Not Started |
| Ashley Thompson | Low | 11.4 | 28 | Low | Postpartum | Generated |
| Linda Kowalski | Low | 11.8 | 32 | Moderate | OB Non-Surgical | In Progress |

**Patient record fields:** id, name, age, dob, sex, weight, bmi, npi, domain, caseType, gestAge, edd, parity, redoOrNonIsolated, significantComorbidities, anticoagulants, labs[] (with trend draws), comorbidities[], conditions[], order, provider, providerRole, unit, admitDate, severity, carePlanStatus, aiConfidence, diagnosis, icdCodes[], allergies[], medications[], hedis[], star, starP.

---

## Risk Scoring Logic

### ACOG Risk Score
- **Baseline:** 15 points
- **Conditions:** 12 conditions, 8-30 points each
- **Total:** Baseline + sum of earned condition points
- **Tiers:** Critical (>=80), High (>=60), Moderate (>=40), Low (<40)

### Transfusion Risk Score (TRS)
- **10 criteria**, 0-2 points each, max 10
- **Tiers:** Very High (>=4), High (3), Intermediate (2), Low (<=1)
- Based on Karkouti et al. (Anesthesiology, 2006)

### Anemia Grade (4-Tier)
- **Severe:** HGB <= 8.0 g/dL
- **Moderate:** HGB 8.1-11.0 g/dL
- **Mild:** HGB 11.1-12.9 g/dL
- **No Anemia:** HGB > 13.0 g/dL

---

## Design System

| Token | Value |
|-------|-------|
| Font | Source Sans Pro (400, 600, 700) |
| Primary | Teal (#0D7782 / #0B626B) |
| Secondary | Teal-light (#3CA6B0 / #1D828C) |
| Accent | Orange (#F58126) |
| Error | Red (#B00A2F) |
| Success | Green (#388032) |
| Warning | Yellow (#FFC432) |
| HC Pink | #C2185B |
| Neutral | 8-shade grey ramp (#FFFFFF to #273233) |
| Spacing | 8px base grid |
| Border radius | 8px (buttons), 10-16px (cards/panels) |

**Components:** Severity chips (4-tier: SEVERE/MODERATE/MILD/NORMAL), status chips (CRITICAL/HIGH/LOW), TRS gauge (SVG semicircular), condition icons (custom SVG per ACOG condition), gradient AI insight headers with radial dot texture.

**Interactions:** Hover states on table rows, buttons, and quick prompts. Transition animations on gauge fills, progress bars, and panel width changes. Copy-to-clipboard feedback. Expand/collapse chat panel.

---

## Out of Scope (Prototype)

- Backend persistence (Supabase integration)
- User authentication and role-based access control
- Real FHIR R4 API integration
- Real-time lab feed updates
- EHR integration (Epic, Cerner)
- Production pharmacy order transmission
- Mobile-optimized phone layout
- Multi-language support

---

## Target Users

| Role | Use Case |
|------|----------|
| OB/GYN | Review risk-stratified patient list, approve AI-generated care plans, attest diagnoses |
| Maternal-Fetal Medicine (MFM) Specialist | Manage high-risk referrals, review ACOG/TRS scores for complex cases |
| Clinical Pharmacist | Review transmitted IV iron orders, verify prior auth criteria |
| Care Coordinator | Track care plan status across the patient panel, close HEDIS gaps |

---

## Future Roadmap

| Phase | Feature |
|-------|---------|
| Phase 2 | Supabase backend for patient data persistence and care plan status tracking |
| Phase 2 | User authentication with role-based views (OB/GYN, MFM, Pharmacist, Coordinator) |
| Phase 3 | Real FHIR R4 integration for lab results and patient demographics |
| Phase 3 | EHR integration for order transmission (Epic InBasket, Cerner PowerChart) |
| Phase 4 | Real-time AI model integration for diagnosis generation and risk scoring |
| Phase 4 | HEDIS measure auto-closure workflow |
| Phase 5 | Mobile-responsive layout for bedside tablet use |
| Phase 5 | Multi-language support (Spanish, Portuguese) |

---

## Success Metrics

- **Clinical adoption:** > 70% of OB/GYN users generate at least one care plan per week
- **Time to treatment:** Median time from anemia identification to IV iron order < 24 hours for Critical patients
- **Prior auth approval rate:** > 85% first-pass approval on IV iron orders
- **HEDIS gap closure:** PPC measure closure rate improvement > 15% vs baseline
- **SMM reduction:** Target 60-70% reduction in peripartum transfusion for managed patients

---

*See `PRD.md` for the full product requirements document. See `README.md` for developer setup instructions.*
