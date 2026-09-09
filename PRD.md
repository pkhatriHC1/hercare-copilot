# Product Requirements Document (PRD)
## HerCare Co-Pilot — Obstetric Anemia Clinical Decision Support

**Version:** 1.0  
**Date:** September 2, 2026  
**Status:** Prototype  
**Platform:** Web (React + Vite, responsive desktop-first)

---

## 1. Overview

HerCare Co-Pilot is a clinical decision support (CDS) application that helps obstetric care teams identify, risk-stratify, and treat iron deficiency anemia in pregnant patients. It surfaces lab values, calculates evidence-based risk scores (ACOG and TRS), generates AI-assisted diagnoses and care plans, and guides clinicians through a structured approval and prior-authorization workflow.

The tool is designed to reduce severe maternal morbidity (SMM) by ensuring timely IV iron intervention before delivery, aligning with ACOG Practice Bulletin #233 and the ACOG Safe Motherhood Initiative.

---

## 2. Problem Statement

- **Iron deficiency anemia** affects ~40% of pregnancies worldwide and is a leading modifiable risk factor for severe maternal morbidity.
- Untreated anemia increases postpartum hemorrhage risk 2–3x, transfusion requirement 4–5x, and preterm delivery 1.5–2x.
- Clinicians lack a unified view of lab trends, risk scores, and evidence-based treatment protocols at the point of care.
- Prior authorization for IV iron therapy is often delayed due to incomplete documentation and unclear criteria alignment.

---

## 3. Target Users

| Role | Use Case |
|------|----------|
| OB/GYN | Review risk-stratified patient list, approve AI-generated care plans, attest diagnoses |
| Maternal-Fetal Medicine (MFM) Specialist | Manage high-risk referrals, review ACOG/TRS scores for complex cases |
| Clinical Pharmacist | Review transmitted IV iron orders, verify prior auth criteria |
| Care Coordinator | Track care plan status across the patient panel, close HEDIS gaps |

---

## 4. Key Features

### 4.1 Patient Worklist
- Sortable, searchable table of OB anemia patients.
- Columns: Patient/GA, Lab Values (HGB + Ferritin), TRS Score, ACOG Risk Score, Active Order, Provider, Anemia Severity, Actions.
- Filters: Case Type (OB Surgical, OB Non-Surgical, Postpartum), Severity (Critical, High, Low).
- Search by patient name, MRN, or provider.
- FHIR R4 live sync indicator.

### 4.2 Clinical Decision Support (Overview Zone)
- **Risk Assessment panel** with five columns: HGB (with trend delta), Ferritin, ACOG Score, TRS gauge, Active Order.
- **AI Insight** card with gradient header summarizing patient condition, recommended protocol, drug regimen, and key numbered recommendations.
- **Evidence Base** panel citing ACOG PB #233, ACOG Safe Motherhood Initiative, NEJM studies, and WHO guidelines.
- CTA to navigate to Care Plan deployment.

### 4.3 ACOG Risk Score Modal
- Full 12-condition master list with ICD-10 codes and point values:
  Multiple Gestations (30), History Preterm Labor (20), Hypertension (15), Anemia (15), Cardiac Disease (15), Diabetes (12), Placenta Previa (12), Prior Cesarean (10), Obesity (10), Recent Pregnancy (10), Advanced Maternal Age (8), Thyroid Disease (8).
- Score breakdown: Baseline Risk (15) + Condition Points = Total ACOG Score.
- Four-tier severity classification: Critical (>=80), High (>=60), Moderate (>=40), Low (<40).
- Condition-specific SVG icons and earned/unearned point indicators.
- Clinical recommendations and expected outcome (60–70% SMM reduction).

### 4.4 Transfusion Risk Score (TRS) Drawer
- 10-point scoring system based on: Hemoglobin, Creatinine, Weight, Gender, Age, Surgery Timing, Redo Procedure, Non-Isolated Surgery, Comorbidities, Anticoagulant Use.
- Semi-circular gauge visualization with score and severity chip.
- Full score breakdown with earned/missed points per criterion.
- Tier-specific recommended actions (low through very-high).
- Evidence base citation (Karkouti et al., Anesthesiology 2006).

### 4.5 Care Plan Workflow (Two-Step)
- **Step 1 — Diagnose:** AI-generated diagnosis with confidence score, ICD-10 codes, ACOG clinical criteria met, evidence base, editable attested diagnosis field, optional clinical notes.
- **Step 2 — Care Plan:** Treatment goals, three interventions (Medication Order, Lab Monitoring, Specialist Consult), evidence base, clinical review warning, prior authorization assessment with LCD/NCD criteria check, AI probability of approval with progress bar, clinical evidence summary, and references.
- Final action: "Approve & Transmit to Pharmacy" with success confirmation screen.

### 4.6 AI Chat (OB CDS Chat)
- Persistent chat panel with AI assistant.
- Pre-loaded ACOG risk assessment summary message.
- Quick-prompt buttons (ACOG guidelines, IV iron vs oral, delivery planning).
- Evidence study lookup (ACOG PB #233, SMM Prevention, ESAIC 2023).
- Copy-to-clipboard on AI messages.
- Expandable to fullscreen.

### 4.7 IQ Assistant Panel
- Slide-in side panel accessible from patient header.
- Patient-contextualized chat with quick prompts.
- Expandable/collapsible width.
- Live status indicator.

### 4.8 Patient Detail View
- Patient header with name, severity chip, provider, MRN, age/sex, NPI, obstetric history (parity).
- Mini worklist sidebar for quick patient switching within the workspace.
- Tab navigation: Clinical Decision Support, Care Plan.
- Top navigation bar with hc1 ClinicalIQ branding, module switcher (Anemia Management / HerCare Co-Pilot), FHIR R4 live status.

---

## 5. Data Model (Prototype)

All patient data is currently hard-coded in-memory (no backend). Six sample patients span Critical, High, and Low severity:

| Patient | Severity | HGB | Ferritin | ACOG Score | Case Type |
|---------|----------|-----|----------|------------|-----------|
| Maria Rodriguez | Critical | 7.2 | 6 | High | OB Surgical |
| Sarah Martinez | Critical | 7.8 | 9 | High | OB Non-Surgical |
| Priya Sharma | High | 9.2 | 11 | Moderate | OB Non-Surgical |
| Jennifer Washington | High | 10.1 | 22 | High | OB Surgical |
| Ashley Thompson | Low | 11.4 | 28 | Low | Postpartum |
| Linda Kowalski | Low | 11.8 | 32 | Moderate | OB Non-Surgical |

**Patient record fields:** id, name, age, dob, sex, weight, bmi, npi, domain, caseType, gestAge, parity, redoOrNonIsolated, significantComorbidities, anticoagulants, labs[] (with trend draws), comorbidities[], conditions[], order, provider, providerRole, unit, admitDate, severity, carePlanStatus, aiConfidence, diagnosis, icdCodes[], allergies[], medications[], hedis[], star, starP.

---

## 6. Risk Scoring Logic

### 6.1 ACOG Risk Score
- **Baseline:** 15 points.
- **Conditions:** 12 conditions with weighted point values (8–30 pts each).
- **Total:** Baseline + sum of earned condition points.
- **Tiers:** Critical (>=80), High (>=60), Moderate (>=40), Low (<40).

### 6.2 Transfusion Risk Score (TRS)
- **10 criteria** scored 0–2 points each, max 10.
- **Tiers:** Very High (>=4), High (3), Intermediate (2), Low (<=1).
- Based on Karkouti et al. validated cardiac surgery transfusion risk model.

### 6.3 Anemia Grade (4-Tier)
- **Severe:** HGB <= 8.0 g/dL
- **Moderate:** HGB 8.1–11.0 g/dL
- **Mild:** HGB 11.1–12.9 g/dL
- **No Anemia:** HGB > 13.0 g/dL

---

## 7. Design System

- **Font:** Source Sans Pro (400, 600, 700 weights).
- **Color palette:** Teal primary (#0D7782), teal secondary (#3CA6B0), orange accent (#F58126), yellow (#FFC432), error red (#B00A2F), success green (#388032), HC pink (#C2185B), 8-shade grey ramp.
- **Spacing:** 8px base grid.
- **Components:** Severity chips (4-tier: SEVERE/MODERATE/MILD/NORMAL), status chips (CRITICAL/HIGH/LOW), TRS gauge (SVG semicircular), condition icons (custom SVG per ACOG condition), gradient AI insight headers with radial dot texture.
- **Interactions:** Hover states on table rows, buttons, and quick prompts. Transition animations on gauge fills, progress bars, and panel width changes. Copy-to-clipboard feedback. Expand/collapse chat panel.

---

## 8. Non-Functional Requirements

- **Performance:** First contentful paint < 2s on standard hardware. No external API calls (all data in-memory).
- **Browser support:** Modern evergreen browsers (Chrome, Firefox, Safari, Edge). Desktop-first layout; responsive down to tablet width.
- **Accessibility:** Sufficient color contrast on all text/background combinations. Keyboard-navigable form inputs and buttons.
- **Security:** No PHI transmitted in prototype (synthetic data only). No authentication required for prototype demo.

---

## 9. Out of Scope (Prototype)

- Backend persistence (Supabase integration).
- User authentication and role-based access control.
- Real FHIR R4 API integration.
- Real-time lab feed updates.
- Electronic Health Record (EHR) integration (Epic InBasket, Cerner).
- Production pharmacy order transmission.
- Mobile-optimized layout (phone viewport).
- Multi-language support.

---

## 10. Future Roadmap

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

## 11. Success Metrics

- **Clinical adoption:** > 70% of OB/GYN users generate at least one care plan per week.
- **Time to treatment:** Median time from anemia identification to IV iron order < 24 hours for Critical patients.
- **Prior auth approval rate:** > 85% first-pass approval on IV iron orders submitted through the tool.
- **HEDIS gap closure:** PPC measure closure rate improvement > 15% vs baseline.
- **SMM reduction:** Target 60–70% reduction in peripartum transfusion for managed patients (per ACOG Safe Motherhood Initiative benchmarks).
