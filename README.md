# HerCare Co-Pilot

**Obstetric Anemia Clinical Decision Support — Prototype**

HerCare Co-Pilot is a clinical decision support (CDS) application that helps obstetric care teams identify, risk-stratify, and treat iron deficiency anemia in pregnant patients. It surfaces lab values, calculates evidence-based risk scores (ACOG and TRS), generates AI-assisted diagnoses and care plans, and guides clinicians through a structured approval and prior-authorization workflow.

The tool is designed to reduce severe maternal morbidity (SMM) by ensuring timely IV iron intervention before delivery, aligning with ACOG Practice Bulletin #233 and the ACOG Safe Motherhood Initiative.

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

No backend or authentication is required for the prototype. All patient data is synthetic and stored in component state.

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

### Production Build

```bash
npm run build
npm run preview
```

---

## Project Structure

```
project/
├── index.html              # HTML entry, Google Fonts (Source Sans Pro)
├── vite.config.js           # Vite config (React + Tailwind + @ alias)
├── PRD.md                   # Product Requirements Document
├── README.md                # This file
├── src/
│   ├── main.jsx             # React root mount
│   ├── index.css            # Tailwind import + global resets
│   ├── App.jsx              # Full application (all views, components, data)
│   └── components/
│       └── Button.jsx       # Local button component (primary/secondary/cta)
└── package.json
```

All application logic, views, and synthetic patient data live in `src/App.jsx` (~1450 lines). The `Button` component is extracted to `src/components/Button.jsx`.

---

## Key Features

### Patient Worklist
Sortable, searchable table of OB anemia patients with columns for lab values (HGB + Ferritin), TRS score, ACOG risk score, active order, provider, and severity. Filters by case type and severity. Search by patient name, MRN, or provider.

### Clinical Decision Support (Overview)
Risk assessment panel with five columns: HGB (with trend delta), Ferritin, ACOG Score, TRS gauge, and Active Order. Includes an AI Insight card with gradient header summarizing patient condition and recommended protocol, plus an evidence base panel citing ACOG, NEJM, and WHO guidelines.

### ACOG Risk Score Modal
Full 12-condition master list with ICD-10 codes and weighted point values. Score = baseline (15) + earned condition points. Four-tier severity classification: Critical (>=80), High (>=60), Moderate (>=40), Low (<40). Each condition has a custom SVG icon.

### Transfusion Risk Score (TRS) Drawer
10-point scoring system based on hemoglobin, creatinine, weight, gender, age, surgery timing, redo procedure, non-isolated surgery, comorbidities, and anticoagulant use. Semi-circular SVG gauge with score and severity chip. Tier-specific recommended actions.

### Care Plan Workflow (Two-Step)
- **Step 1 — Diagnose:** AI-generated diagnosis with confidence score, ICD-10 codes, ACOG clinical criteria, evidence base, editable attested diagnosis field, and clinical notes.
- **Step 2 — Care Plan:** Treatment goals, three interventions (medication order, lab monitoring, specialist consult), prior authorization assessment with LCD/NCD criteria check, AI probability of approval with progress bar, and references. Final action transmits the order to pharmacy.

### AI Chat (OB CDS Chat)
Persistent chat panel with AI assistant, pre-loaded ACOG risk assessment summary, quick-prompt buttons, evidence study lookup, and copy-to-clipboard. Expandable to fullscreen.

### IQ Assistant Panel
Slide-in side panel accessible from patient header with patient-contextualized chat and quick prompts. Expandable/collapsible width.

---

## Risk Scoring Logic

### ACOG Risk Score
- **Baseline:** 15 points
- **Conditions:** 12 conditions, 8–30 points each (Multiple Gestations 30, History Preterm Labor 20, Hypertension/Anemia/Cardiac 15, Diabetes/Placenta Previa 12, Prior Cesarean/Obesity/Recent Pregnancy 10, Advanced Maternal Age/Thyroid 8)
- **Tiers:** Critical (>=80), High (>=60), Moderate (>=40), Low (<40)

### Transfusion Risk Score (TRS)
- **10 criteria**, 0–2 points each, max 10
- **Tiers:** Very High (>=4), High (3), Intermediate (2), Low (<=1)
- Based on Karkouti et al. (Anesthesiology, 2006)

### Anemia Grade (4-Tier)
- Severe: HGB <= 8.0 g/dL
- Moderate: HGB 8.1–11.0 g/dL
- Mild: HGB 11.1–12.9 g/dL
- No Anemia: HGB > 13.0 g/dL

---

## Synthetic Patient Data

Six sample patients span Critical, High, and Low severity:

| Patient | Severity | HGB | Ferritin | ACOG | Case Type |
|---------|----------|-----|----------|------|-----------|
| Maria Rodriguez | Critical | 7.2 | 6 | High | OB Surgical |
| Sarah Martinez | Critical | 7.8 | 9 | High | OB Non-Surgical |
| Priya Sharma | High | 9.2 | 11 | Moderate | OB Non-Surgical |
| Jennifer Washington | High | 10.1 | 22 | High | OB Surgical |
| Ashley Thompson | Low | 11.4 | 28 | Low | Postpartum |
| Linda Kowalski | Low | 11.8 | 32 | Moderate | OB Non-Surgical |

No real PHI is used. All data is synthetic.

---

## Design System

- **Font:** Source Sans Pro (400, 600, 700)
- **Primary:** Teal (#0D7782 / #0B626B)
- **Secondary:** Teal-light (#3CA6B0 / #1D828C)
- **Accent:** Orange (#F58126)
- **Status colors:** Error red (#B00A2F), Success green (#388032), Warning yellow (#FFC432), HC pink (#C2185B)
- **Neutral:** 8-shade grey ramp (#FFFFFF → #273233)
- **Spacing:** 8px base grid
- **Border radius:** 8px (buttons), 10–16px (cards/panels)

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

See `PRD.md` for the full product requirements document and future roadmap.
