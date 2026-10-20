import { useState, useEffect } from "react";
import { EPISODES, VISITS, VISIT_TYPES, getActiveEpisodes, getEpisode, formatDate, nextVisit, futureVisits, pastVisits, visitsForEpisode, visitOneLiner, gestationalAge, gaAtVisit, getMaternalRiskTier } from "./mock/episodes.js";

const GlobalReset = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "html,body,#root{height:100%;margin:0;padding:0;overflow:hidden;}*{box-sizing:border-box;}";
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};
import { Search, Filter, ChevronDown, ArrowRight, ChevronLeft, MessageSquare, ClipboardList, User, Hash, Stethoscope, RotateCcw, CalendarDays, Clock, MapPin, ExternalLink, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "./components/Button";

// ── Design tokens (identical to BloodHealth) ──────────────────────
const C = {
  grey:      { 100:"#FFFFFF", 200:"#F7F7F7", 300:"#E7E7E7", 400:"#CFD1D1", 500:"#A8ADAD", 600:"#737E7F", 700:"#545D5E", 800:"#273233" },
  primary:   { 100:"#ECF4F5", 200:"#CFE4E6", 300:"#9EC9CD", 400:"#56A0A8", 500:"#0D7782", 600:"#0B626B" },
  secondary: { 100:"#E1F3F5", 200:"#CFEBEE", 300:"#AFDCE1", 400:"#75CAD3", 500:"#3CA6B0", 600:"#1D828C" },
  orange:    { 100:"#FFEFE0", 400:"#F58126" },
  yellow:    { 100:"#FFECC1", 400:"#FFC432" },
  error:     { 100:"#F4DFE4", 400:"#B00A2F" },
  success:   { 100:"#D7E7D6", 400:"#388032" },
  red:       { 100:"#EFB0AB", 400:"#C6473C" },
  hc:        { 100:"#FDF0F7", 400:"#C2185B", 500:"#880E4F" },
};
const font = "'Source Sans Pro',system-ui,sans-serif";
// Shared 4-tier severity chip — SEVERE / MODERATE / MILD / NORMAL — consistent across MHR and lab grades
const SEV4={severe:{c:C.error[400],bg:C.error[100],l:"SEVERE"},moderate:{c:C.orange[400],bg:C.orange[100],l:"MODERATE"},mild:{c:"#92600A",bg:C.yellow[100],l:"MILD"},normal:{c:C.success[400],bg:C.success[100],l:"NORMAL"}};
const SevChip=({tier})=>{const s=SEV4[tier]||SEV4.normal;return <span style={{fontSize:12,fontWeight:700,color:s.c,background:s.bg,borderRadius:4,padding:"2px 7px",fontFamily:font,letterSpacing:"0.06em",textTransform:"uppercase"}}>{s.l}</span>;};
// Map MHR tier → 4-tier SevChip: Very High → severe, High → moderate, Intermediate → mild, Low → normal
const mhrTier=(cat)=>cat==="Very High"?"severe":cat==="High"?"moderate":cat==="Intermediate"?"mild":"normal";
const CASE_TYPES = ["All Case Types","OB Surgical","OB Non-Surgical","Postpartum"];

// ── Icons ─────────────────────────────────────────────────────────
const BloodDrop  = ({size=15,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-13-7-13z"/></svg>;
const Pregnant   = ({size=15,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="4" r="2"/><path d="M9 8h3l1 4c1.5 0 3 1.5 3 3.5S14.5 19 13 19H9"/><path d="M9 8l-1 5"/><path d="M8 13l-1 6"/></svg>;
const CheckCircle= ({size=24,color}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>;

// ── Shared micro-components (same as BloodHealth) ─────────────────
// Severity scale: 3 values only — critical / high / low
const normSev=(s)=>s==="critical"?"critical":s==="high"||s==="borderline"?"high":"low";
const StatusChip = ({status}) => {
  const n = normSev(status);
  const m = { critical:{c:C.error[400],bg:C.error[100],l:"CRITICAL"}, high:{c:C.orange[400],bg:C.orange[100],l:"HIGH"}, low:{c:C.grey[800],bg:C.grey[200],l:"LOW"} };
  const s = m[n];
  return <span style={{fontSize:12,fontWeight:700,color:s.c,background:s.bg,borderRadius:4,padding:"2px 7px",fontFamily:font,letterSpacing:"0.06em",textTransform:"uppercase"}}>{s.l}</span>;
};
// Small right-aligned step action row: optional back button + primary/cta action on the right.
// nextOrange marks execute/irreversible steps ("Approve & Transmit to Pharmacy"). Nav-only steps stay primary.
const StepActions = ({onBack,backLabel="← Back",onNext,nextLabel,nextOrange=false}) => (
  <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:8,paddingTop:16,borderTop:`1px solid ${C.grey[300]}`,marginTop:16}}>
    {onBack && <Button variant="secondary" size="sm" onClick={onBack}>{backLabel}</Button>}
    <Button variant={nextOrange?"cta":"primary"} size="sm" onClick={onNext}>{nextLabel}</Button>
  </div>
);
const EvidenceBox = ({refs}) => (
  <div style={{background:C.success[100],border:"1px solid rgba(56,128,50,0.2)",borderRadius:8,padding:"14px 16px",marginBottom:16}}>
    <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:C.success[400],fontFamily:font,marginBottom:8}}>Evidence Base</div>
    {refs.map((r,i) => {
      const title = typeof r==="string" ? r : r.title;
      const desc  = typeof r==="object" ? r.description : null;
      return <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start",marginBottom:desc?6:4}}>
        <span style={{color:C.success[400],fontWeight:700,fontSize:10,flexShrink:0,marginTop:1}}>✓</span><div><div style={{fontSize:12,fontWeight:600,color:C.success[400],fontFamily:font}}>{title}</div>{desc&&<div style={{fontSize:10,color:C.grey[600],fontFamily:font,marginTop:1}}>{desc}</div>}</div>
      </div>;
    })}
  </div>
);
const StepHeader = ({eyebrow,title}) => (
  <div style={{marginBottom:16}}>
    <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.1em",color:C.secondary[500],fontFamily:font,marginBottom:4}}>{eyebrow}</div>
    <div style={{fontSize:18,fontWeight:700,color:C.grey[800],fontFamily:font}}>{title}</div>
  </div>
);
// ── Maternal Health Risk Score — 6-domain engine (max 74) ──────
const MHR_DOMAINS = [
  {id:"hematologic",  name:"Hematologic Reserve",              cap:16, icon:"🩸"},
  {id:"placental",   name:"Placental & Hemorrhage Risk",      cap:20, icon:"🩺"},
  {id:"delivery",    name:"Delivery & Obstetric History",      cap:10, icon:"📋"},
  {id:"demographics",name:"Maternal Demographics & Physiology",cap:6,  icon:"👤"},
  {id:"comorbidities",name:"Maternal Comorbidities",           cap:17, icon:"🏥"},
  {id:"medication",  name:"Medication & Treatment Factors",    cap:5,  icon:"💊"},
];
const MHR_TIERS = [
  {min:0,  label:"Low",         tier:"normal",   color:C.success[400], interp:"No major identified maternal health risk factors"},
  {min:10, label:"Intermediate", tier:"mild",     color:"#92600A",     interp:"One or more meaningful maternal health risk factors present"},
  {min:20, label:"High",         tier:"moderate", color:C.orange[400], interp:"Multiple or significant maternal health risk factors; pre-delivery optimization recommended"},
  {min:35, label:"Very High",    tier:"severe",   color:C.error[400],  interp:"Major maternal health risk; multidisciplinary planning and blood-bank preparedness recommended"},
];
const mhrTierInfo=(score)=>MHR_TIERS.reduce((a,t)=>score>=t.min?t:a,MHR_TIERS[0]);
const calcMHR = (p) => {
  const m = p.mhr || {};
  const domains = [];
  // ── Domain 1: Hematologic Reserve (cap 16) ──
  {const f=[];let r=0;
    const hgb=parseFloat(p.labs.find(l=>l.label==="HGB")?.value??99);
    let hp=0,hc="≥13.0 g/dL";
    if(hgb<8){hp=6;hc="<8.0 g/dL";}else if(hgb<10){hp=4;hc="8.0–9.9 g/dL";}else if(hgb<11){hp=2;hc="10.0–10.9 g/dL";}else if(hgb<13){hp=1;hc="11.0–12.9 g/dL";}
    r+=hp;f.push({label:"Hemoglobin",value:`${hgb} g/dL`,criteria:hc,points:hp,max:6});
    const pltLab=p.labs.find(l=>l.label==="Platelets");const plt=pltLab?parseFloat(pltLab.value):999;
    let pp=0,pc="≥150 ×10⁹/L";
    if(plt<50){pp=5;pc="<50 ×10⁹/L";}else if(plt<100){pp=4;pc="50–99 ×10⁹/L";}else if(plt<150){pp=2;pc="100–149 ×10⁹/L";}
    r+=pp;f.push({label:"Platelets",value:`${plt} ×10⁹/L`,criteria:pc,points:pp,max:5});
    const ferLab=p.labs.find(l=>l.label==="Ferritin");const fer=ferLab?parseFloat(ferLab.value):999;
    const tsatLab=p.labs.find(l=>l.label==="Transferrin Sat");const tsat=tsatLab?parseFloat(tsatLab.value):999;
    let ip=0,ic="Ferritin ≥100, TSAT ≥20%";
    if(fer<30||tsat<20){ip=2;ic=fer<30?`Ferritin ${fer} ng/mL (<30)`:`TSAT ${tsat}% (<20%)`;}else if(fer<=100){ip=1;ic=`Ferritin ${fer} ng/mL (30–100)`;}
    r+=ip;f.push({label:"Iron Deficiency",value:`Ferritin ${fer} ng/mL, TSAT ${tsat}%`,criteria:ic,points:ip,max:2});
    let cp=0,cc="No coagulopathy";
    if((m.pt!=null&&m.pt>3)||(m.inr!=null&&m.inr>1.5)||(m.fibrinogen!=null&&m.fibrinogen<200)){cp=3;const parts=[];if(m.pt!=null&&m.pt>3)parts.push(`PT ${m.pt}s (>3)`);if(m.inr!=null&&m.inr>1.5)parts.push(`INR ${m.inr} (>1.5)`);if(m.fibrinogen!=null&&m.fibrinogen<200)parts.push(`Fibrinogen ${m.fibrinogen} mg/dL (<200)`);cc=parts.join(", ");}
    r+=cp;f.push({label:"Significant Coagulopathy",value:cp>0?"Present":"None",criteria:cc,points:cp,max:3});
    domains.push({id:"hematologic",name:"Hematologic Reserve",cap:16,raw:r,clamped:Math.min(r,16),factors:f});
  }
  // ── Domain 2: Placental & Hemorrhage Risk (cap 20) ──
  {const f=[];let r=0;
    const pm={"percreta":{l:"Placenta Percreta",p:15,i:"O43.23"},"increta":{l:"Placenta Increta",p:12,i:"O43.22"},"accreta":{l:"Placenta Accreta",p:10,i:"O43.21"},"abruption":{l:"Placental Abruption",p:6,i:"O45.001–O45.93"},"previa":{l:"Placenta Previa",p:5,i:"O44.00–O44.33"},"low-lying":{l:"Low-lying Placenta",p:2,i:"O44.40–O44.53"}};
    if(m.placental&&pm[m.placental]){const d=pm[m.placental];r+=d.p;f.push({label:d.l,value:"Suspected/known",criteria:d.l,points:d.p,max:15,icd:d.i});}
    else{f.push({label:"Placental Diagnosis",value:"None",criteria:"No placental pathology",points:0,max:15});}
    if(m.priorPPH){r+=3;f.push({label:"Prior Postpartum Hemorrhage",value:"Yes",criteria:"Required intervention/transfusion",points:3,max:3,icd:"O09.291–O09.299"});}
    else{f.push({label:"Prior Postpartum Hemorrhage",value:"No",criteria:"No prior PPH",points:0,max:3,icd:"O09.291–O09.299"});}
    if(m.uterinePathology){r+=2;f.push({label:"Uterine Pathology",value:"Yes",criteria:"Significant fibroids/other",points:2,max:2,icd:"O34.00–O34.23"});}
    else{f.push({label:"Uterine Pathology",value:"No",criteria:"No uterine pathology",points:0,max:2,icd:"O34.00–O34.23"});}
    domains.push({id:"placental",name:"Placental & Hemorrhage Risk",cap:20,raw:r,clamped:Math.min(r,20),factors:f});
  }
  // ── Domain 3: Delivery & Obstetric History (cap 10) ──
  {const f=[];let r=0;
    const pc=m.priorCesareanCount||0;
    if(pc>=2){r+=2;f.push({label:"Prior Cesarean",value:`${pc} prior C-sections`,criteria:"2 prior C-sections",points:2,max:2,icd:"O34.211–O34.29"});}
    else{f.push({label:"Prior Cesarean",value:pc>0?`${pc} prior`:"None",criteria:"<2 prior C-sections",points:0,max:2,icd:"O34.211–O34.29"});}
    if(m.plannedCesarean){r+=1;f.push({label:"Planned Cesarean",value:"Yes",criteria:"Elective/planned C-section",points:1,max:1,icd:"O82"});}
    else{f.push({label:"Planned Cesarean",value:"No",criteria:"Not planned",points:0,max:1,icd:"O82"});}
    if(m.multipleGestation==="triples+"){r+=3;f.push({label:"Multiple Gestation",value:"≥3 fetuses",criteria:"≥3 fetuses",points:3,max:3,icd:"O30.1–O30.2"});}
    else if(m.multipleGestation==="twins"){r+=2;f.push({label:"Multiple Gestation",value:"Twins",criteria:"Twins",points:2,max:2,icd:"O30.0"});}
    else{f.push({label:"Multiple Gestation",value:"Singleton",criteria:"Singleton",points:0,max:3});}
    if(m.grandMultiparity){r+=2;f.push({label:"Grand Multiparity",value:"≥5 prior births",criteria:"≥5 prior births",points:2,max:2,icd:"O09.40–O09.43"});}
    else{f.push({label:"Grand Multiparity",value:"<5 prior births",criteria:"<5 prior births",points:0,max:2,icd:"O09.40–O09.43"});}
    if(m.priorUterineSurgery){r+=2;f.push({label:"Prior Uterine Surgery",value:"Yes",criteria:"Myomectomy, major D&C, etc.",points:2,max:2,icd:"Z98.891"});}
    else{f.push({label:"Prior Uterine Surgery",value:"No",criteria:"None",points:0,max:2,icd:"Z98.891"});}
    domains.push({id:"delivery",name:"Delivery & Obstetric History",cap:10,raw:r,clamped:Math.min(r,10),factors:f});
  }
  // ── Domain 4: Maternal Demographics & Physiology (cap 6) ──
  {const f=[];let r=0;
    if(p.age>=40){r+=2;f.push({label:"Maternal Age",value:`${p.age} years`,criteria:"≥40",points:2,max:2});}
    else if(p.age>=35){r+=1;f.push({label:"Maternal Age",value:`${p.age} years`,criteria:"35–39",points:1,max:2});}
    else{f.push({label:"Maternal Age",value:`${p.age} years`,criteria:"<35",points:0,max:2});}
    const bmi=parseFloat(p.bmi);
    if(bmi>=40){r+=2;f.push({label:"BMI",value:p.bmi,criteria:"≥40",points:2,max:2});}
    else if(bmi>=30){r+=1;f.push({label:"BMI",value:p.bmi,criteria:"30–39.9",points:1,max:2});}
    else if(bmi<18.5){r+=1;f.push({label:"BMI",value:p.bmi,criteria:"<18.5",points:1,max:2});}
    else{f.push({label:"BMI",value:p.bmi,criteria:"18.5–29.9",points:0,max:2});}
    const ga=parseInt(p.gestAge);
    if(ga<37){r+=2;f.push({label:"Gestational Age",value:p.gestAge,criteria:"<37 weeks",points:2,max:2});}
    else if(ga>41){r+=1;f.push({label:"Gestational Age",value:p.gestAge,criteria:">41 weeks",points:1,max:2});}
    else{f.push({label:"Gestational Age",value:p.gestAge,criteria:"37–41 weeks",points:0,max:2});}
    domains.push({id:"demographics",name:"Maternal Demographics & Physiology",cap:6,raw:r,clamped:Math.min(r,6),factors:f});
  }
  // ── Domain 5: Maternal Comorbidities (cap 17) ──
  {const f=[];let r=0;
    const ht=m.hypertensiveDisorder;
    if(ht==="severe-preeclampsia"){r+=3;f.push({label:"Severe Preeclampsia",value:"Severe features",criteria:"Severe features",points:3,max:3,icd:"O14.10, O14.12–O14.15"});}
    else if(ht==="preeclampsia"){r+=2;f.push({label:"Preeclampsia",value:"Present",criteria:"Preeclampsia",points:2,max:3,icd:"O14.0, O14.9, O11"});}
    else if(ht=="gestational"){r+=1;f.push({label:"Gestational Hypertension",value:"Present",criteria:"Gestational hypertension",points:1,max:3,icd:"O10, O12, O13"});}
    else{f.push({label:"Hypertensive Disorder",value:"None",criteria:"No hypertensive disorder",points:0,max:3});}
    if(m.cardiacDisease){r+=3;f.push({label:"Cardiac Disease",value:"Present",criteria:"Significant maternal cardiac disease",points:3,max:3,icd:"O99.41–O99.43"});}
    else{f.push({label:"Cardiac Disease",value:"None",criteria:"No cardiac disease",points:0,max:3,icd:"O99.41–O99.43"});}
    if(m.renalDisease){r+=2;f.push({label:"Renal Disease",value:"Present",criteria:"Significant chronic renal disease",points:2,max:2,icd:"O26.83–O26.839"});}
    else{f.push({label:"Renal Disease",value:"None",criteria:"No renal disease",points:0,max:2,icd:"O26.83–O26.839"});}
    if(m.liverDisease){r+=2;f.push({label:"Liver Disease",value:"Present",criteria:"Significant liver disease",points:2,max:2,icd:"O26.6, O98.4, O99.8"});}
    else{f.push({label:"Liver Disease",value:"None",criteria:"No liver disease",points:0,max:2,icd:"O26.6, O98.4, O99.8"});}
    if(m.hematologicDisease){r+=2;f.push({label:"Hematologic Disease",value:"Present",criteria:"Sickle cell/thalassemia/other",points:2,max:2,icd:"D57.00–D57.819, D56.0–D56.9"});}
    else{f.push({label:"Hematologic Disease",value:"None",criteria:"No hematologic disease",points:0,max:2,icd:"D57.00–D57.819, D56.0–D56.9"});}
    if(m.bleedingDisorder){r+=4;f.push({label:"Bleeding Disorder",value:"Present",criteria:"Known clinically significant",points:4,max:4,icd:"D68.00–D68.09, D66, D67"});}
    else{f.push({label:"Bleeding Disorder",value:"None",criteria:"No bleeding disorder",points:0,max:4,icd:"D68.00–D68.09, D66, D67"});}
    if(m.pregestationalDiabetes){r+=1;f.push({label:"Pregestational Diabetes",value:"Present",criteria:"Pregestational diabetes",points:1,max:1,icd:"O24.011–O24.319"});}
    else{f.push({label:"Pregestational Diabetes",value:"None",criteria:"No pregestational diabetes",points:0,max:1,icd:"O24.011–O24.319"});}
    if(m.gestationalDiabetes){r+=1;f.push({label:"Gestational Diabetes",value:"Present",criteria:"Gestational diabetes (A1 or A2)",points:1,max:1,icd:"O24.A1–O24.A2"});}
    else{f.push({label:"Gestational Diabetes",value:"None",criteria:"No gestational diabetes",points:0,max:1,icd:"O24.A1–O24.A2"});}
    domains.push({id:"comorbidities",name:"Maternal Comorbidities",cap:17,raw:r,clamped:Math.min(r,17),factors:f});
  }
  // ── Domain 6: Medication & Treatment Factors (cap 5) ──
  {const f=[];let r=0;
    if(m.anticoagulationStatus==="therapeutic"){r+=3;f.push({label:"Therapeutic Anticoagulation",value:"Therapeutic",criteria:"LMWH/UFH/warfarin/apixaban, etc.",points:3,max:3});}
    else if(m.anticoagulationStatus=="prophylactic"){r+=1;f.push({label:"Prophylactic Anticoagulation",value:"Prophylactic",criteria:"Prophylactic-dose anticoagulation",points:1,max:3});}
    else{f.push({label:"Anticoagulation",value:"None",criteria:"No anticoagulation",points:0,max:3});}
    if(m.antiplateletAgent==="low_dose_aspirin"){r+=1;f.push({label:"Antiplatelet Therapy",value:"Low-dose aspirin",criteria:"Aspirin/other antiplatelet",points:1,max:1});}
    else{f.push({label:"Antiplatelet Therapy",value:"None",criteria:"No antiplatelet",points:0,max:1});}
    domains.push({id:"medication",name:"Medication & Treatment Factors",cap:5,raw:r,clamped:Math.min(r,5),factors:f});
  }
  // ── Risk drivers: flatten all earned factors into a list with modifiable flag + severity ──
  const MODIFIABLE = new Set(["Hemoglobin","Iron Deficiency","Platelets","Significant Coagulopathy","BMI","Anticoagulation","Antiplatelet Therapy","Prophylactic Anticoagulation","Therapeutic Anticoagulation","Prior Postpartum Hemorrhage","Uterine Pathology","Severe Preeclampsia","Preeclampsia","Gestational Hypertension","Pregestational Diabetes","Gestational Diabetes"]);
  const drivers = [];
  domains.forEach(d => d.factors.forEach(f => {
    if(f.points > 0) {
      const sev = f.points >= f.max * 0.6 ? "high" : f.points >= f.max * 0.3 ? "moderate" : "mild";
      drivers.push({label:f.label, value:f.value, modifiable:MODIFIABLE.has(f.label), severity:sev, domain:d.name});
    }
  }));
  const modifiableDrivers = drivers.filter(d=>d.modifiable);
  const nonModifiableDrivers = drivers.filter(d=>!d.modifiable);

  // ── Missing inputs detection ──
  const missing = [];
  if(!p.labs.find(l=>l.label==="HGB")) missing.push("Hemoglobin");
  if(!p.labs.find(l=>l.label==="Platelets")) missing.push("Platelets");
  if(!p.labs.find(l=>l.label==="Ferritin")) missing.push("Ferritin");
  if(!p.labs.find(l=>l.label==="Transferrin Sat")) missing.push("Transferrin Saturation");
  if(m.pt==null) missing.push("PT");
  if(m.inr==null) missing.push("INR");
  if(m.fibrinogen==null) missing.push("Fibrinogen");
  if(m.placental===undefined) missing.push("Placental Diagnosis");
  if(m.priorPPH===undefined) missing.push("Prior PPH History");
  if(m.priorCesareanCount===undefined) missing.push("Prior Cesarean Count");
  if(m.hypertensiveDisorder===undefined) missing.push("Hypertensive Disorder Status");
  if(m.gestationalDiabetes===undefined) missing.push("Gestational Diabetes Status");
  if(m.anticoagulationStatus===undefined) missing.push("Anticoagulation Status");

  // ── Probability estimate (sigmoid mapping 0–74 → 1–95%) ──
  const score=domains.reduce((s,d)=>s+d.clamped,0);
  const ti=mhrTierInfo(score);
  const activeDomains=domains.filter(d=>d.clamped>0).length;
  return {score,color:ti.color,cat:ti.label,tier:ti.tier,interp:ti.interp,domains,maxPossible:74,activeDomains,drivers,modifiableDrivers,nonModifiableDrivers,missing,calcComplete:missing.length===0};
};

// ── Patient data — 7 patients covering Critical / High / Low severity ──
const FACILITIES = ["North Aux Hospital", "Main Hospital"];

const PATIENTS = [
  // CRITICAL — HGB < 8, many ACOG conditions
  { id:"MR-7821", name:"Maria Rodriguez", age:34, dob:"03/15/1992", sex:"Female", weight:"68 kg", bmi:"24.2", npi:"1122334455", domain:"OB Anemia", caseType:"OB Surgical",
    gestAge:"32 wks", edd:"06/01/2026", followUpDate:"04/23/2026", parity:"G4P2", redoOrNonIsolated:false, significantComorbidities:true, anticoagulants:false,
    labs:[{label:"HGB",value:"7.2",unit:"g/dL",status:"critical",draws:[{date:"Apr 5",value:9.6},{date:"Apr 7",value:8.4},{date:"Apr 9",value:7.2}]},{label:"Ferritin",value:"6",unit:"ng/mL",status:"critical"},{label:"TIBC",value:"480",unit:"mcg/dL",status:"high"},{label:"Transferrin Sat",value:"4",unit:"%",status:"critical"},{label:"Reticulocytes",value:"0.9",unit:"%",status:"low"},{label:"WBC",value:"10.2",unit:"K/uL",status:"high"},{label:"Platelets",value:"168",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.8",unit:"mg/dL",status:"low"}],
    mhr:{placental:"previa",priorPPH:true,uterinePathology:false,priorCesareanCount:0,plannedCesarean:true,multipleGestation:"twins",grandMultiparity:false,priorUterineSurgery:false,hypertensiveDisorder:"gestational",cardiacDisease:true,renalDisease:false,liverDisease:false,hematologicDisease:false,bleedingDisorder:false,pregestationalDiabetes:true,gestationalDiabetes:true,anticoagulationStatus:"none",antiplateletAgent:null,pt:14,inr:1.1,fibrinogen:280},
    comorbidities:["Multiple Gestations","History Preterm Labor","Hypertension","Anemia","Cardiac Disease","Diabetes"],
    conditions:["Multiple Gestations","Hypertension","Iron Deficiency Anemia","Gestational Diabetes"],
    bp:"142/91",
    order:"IV Iron – Ferric Carboxymaltose 1000mg STAT + MFM consult",
    provider:"Dr. Chen", facility:"North Aux Hospital", providerRole:"OB/GYN", unit:"OB High Risk", admitDate:"Apr 5, 2026",
    severity:"Critical", carePlanStatus:"pending", aiConfidence:94,
    diagnosis:"OB Iron Deficiency Anemia — Severe, ACOG PB #233",
    icdCodes:["O99.011","D50.0","O30.C30","I10"], allergies:["NKDA"],
    medications:["Prenatal vitamins","Labetalol 200mg BID","Insulin glargine 20u nightly"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Open",close:true},{name:"Comprehensive Diabetes Care (CDC)",st:"Open",close:true},{name:"Depression Screening & Follow-up (DSF)",st:"Closed",close:false}],
    star:3.5, starP:3.8 },

  // CRITICAL — HGB < 8, different condition mix
  { id:"SM-9643", name:"Sarah Martinez", age:31, dob:"07/22/1994", sex:"Female", weight:"72 kg", bmi:"25.8", npi:"1122334456", domain:"OB Anemia", caseType:"OB Non-Surgical",
    gestAge:"30 wks", edd:"06/16/2026", followUpDate:"04/21/2026", parity:"G2P1", redoOrNonIsolated:true, significantComorbidities:true, anticoagulants:false,
    labs:[{label:"HGB",value:"7.8",unit:"g/dL",status:"critical",draws:[{date:"Apr 8",value:9.1},{date:"Apr 9",value:7.8}]},{label:"Ferritin",value:"9",unit:"ng/mL",status:"critical"},{label:"TIBC",value:"398",unit:"mcg/dL",status:"high"},{label:"Transferrin Sat",value:"6",unit:"%",status:"critical"},{label:"Reticulocytes",value:"0.9",unit:"%",status:"low"},{label:"WBC",value:"8.3",unit:"K/uL",status:"low"},{label:"Platelets",value:"210",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.7",unit:"mg/dL",status:"low"}],
    mhr:{placental:"accreta",priorPPH:false,uterinePathology:false,priorCesareanCount:1,plannedCesarean:false,multipleGestation:null,grandMultiparity:false,priorUterineSurgery:false,hypertensiveDisorder:null,cardiacDisease:false,renalDisease:false,liverDisease:false,hematologicDisease:false,bleedingDisorder:false,pregestationalDiabetes:false,gestationalDiabetes:false,anticoagulationStatus:"none",antiplateletAgent:null,pt:13,inr:1.0,fibrinogen:300},
    comorbidities:["Multiple Gestations","History Preterm Labor","Anemia","Prior Cesarean","Placenta Previa"],
    conditions:["Multiple Gestations","Preterm Labor Risk","Placenta Previa","Severe Iron Deficiency"],
    bp:"118/76",
    order:"IV Iron – Ferumoxytol 510mg x2 + High-risk monitoring",
    provider:"Dr. Patel", facility:"North Aux Hospital", providerRole:"MFM", unit:"OB High Risk", admitDate:"Apr 7, 2026",
    severity:"Critical", carePlanStatus:"in-progress", aiConfidence:91,
    diagnosis:"OB Severe Iron Deficiency Anemia — Placenta Previa Risk",
    icdCodes:["O99.011","D50.0","O09.21","O44.0"], allergies:["Sulfa"],
    medications:["Prenatal vitamins","Progesterone 200mg"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Closed",close:false},{name:"Comprehensive Diabetes Care (CDC)",st:"Closed",close:false},{name:"Depression Screening & Follow-up (DSF)",st:"Open",close:true}],
    star:3.2, starP:3.6 },

  // HIGH — HGB 8–11, moderate ACOG conditions
  { id:"PS-0081", name:"Priya Sharma", age:29, dob:"11/08/1996", sex:"Female", weight:"63 kg", bmi:"22.4", npi:"1122334457", domain:"OB Anemia", caseType:"OB Non-Surgical",
    gestAge:"28 wks", edd:"07/01/2026", followUpDate:"04/24/2026", parity:"G1P0", redoOrNonIsolated:false, significantComorbidities:false, anticoagulants:false,
    labs:[{label:"HGB",value:"9.2",unit:"g/dL",status:"high",draws:[{date:"Apr 6",value:10.4},{date:"Apr 9",value:9.2}]},{label:"Ferritin",value:"11",unit:"ng/mL",status:"high"},{label:"TIBC",value:"380",unit:"mcg/dL",status:"high"},{label:"Transferrin Sat",value:"12",unit:"%",status:"high"},{label:"Reticulocytes",value:"1.4",unit:"%",status:"low"},{label:"WBC",value:"8.8",unit:"K/uL",status:"low"},{label:"Platelets",value:"228",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.6",unit:"mg/dL",status:"low"}],
    mhr:{placental:null,priorPPH:false,uterinePathology:false,priorCesareanCount:0,plannedCesarean:false,multipleGestation:null,grandMultiparity:false,priorUterineSurgery:false,hypertensiveDisorder:null,cardiacDisease:false,renalDisease:false,liverDisease:false,hematologicDisease:false,bleedingDisorder:false,pregestationalDiabetes:false,gestationalDiabetes:false,anticoagulationStatus:"none",antiplateletAgent:"low_dose_aspirin",pt:12,inr:1.0,fibrinogen:350},
    comorbidities:["Anemia","Thyroid Disease","Advanced Maternal Age"],
    conditions:["Gestational Iron Deficiency Anemia","Hypothyroidism"],
    bp:"115/72",
    order:"IV Iron – Ferric Carboxymaltose 750mg + Thyroid monitoring",
    provider:"Dr. Nguyen", facility:"North Aux Hospital", providerRole:"OB/GYN", unit:"OB Outpatient", admitDate:"Apr 8, 2026",
    severity:"High", carePlanStatus:"generated", aiConfidence:87,
    diagnosis:"Gestational Iron Deficiency Anemia — Thyroid Comorbidity",
    icdCodes:["O99.011","D50.9","O99.28"], allergies:["NKDA"],
    medications:["Prenatal vitamins","Levothyroxine 75mcg daily"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Closed",close:false},{name:"Comprehensive Diabetes Care (CDC)",st:"Closed",close:false},{name:"Depression Screening & Follow-up (DSF)",st:"Closed",close:false}],
    star:3.7, starP:3.9 },

  // HIGH — HGB 8–11, obesity + hypertension mix
  { id:"JW-3431", name:"Jennifer Washington", age:38, dob:"02/14/1988", sex:"Female", weight:"98 kg", bmi:"34.2", npi:"1122334458", domain:"OB Anemia", caseType:"OB Surgical",
    gestAge:"24 wks", edd:"07/27/2026", followUpDate:"04/20/2026", parity:"G5P2", redoOrNonIsolated:false, significantComorbidities:true, anticoagulants:false,
    labs:[{label:"HGB",value:"10.1",unit:"g/dL",status:"high",draws:[{date:"Apr 5",value:10.8},{date:"Apr 9",value:10.1}]},{label:"Ferritin",value:"22",unit:"ng/mL",status:"high"},{label:"TIBC",value:"342",unit:"mcg/dL",status:"high"},{label:"Transferrin Sat",value:"18",unit:"%",status:"high"},{label:"Reticulocytes",value:"1.6",unit:"%",status:"low"},{label:"WBC",value:"7.9",unit:"K/uL",status:"low"},{label:"Platelets",value:"244",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.9",unit:"mg/dL",status:"low"}],
    mhr:{placental:null,priorPPH:false,uterinePathology:true,priorCesareanCount:0,plannedCesarean:true,multipleGestation:null,grandMultiparity:true,priorUterineSurgery:false,hypertensiveDisorder:"gestational",cardiacDisease:false,renalDisease:false,liverDisease:false,hematologicDisease:false,bleedingDisorder:false,pregestationalDiabetes:false,gestationalDiabetes:false,anticoagulationStatus:"none",antiplateletAgent:null,pt:13,inr:1.1,fibrinogen:290},
    comorbidities:["Hypertension","Anemia","Obesity","Advanced Maternal Age","Recent Pregnancy"],
    conditions:["Hypertension","Anemia of Pregnancy","Obesity","Multiparity"],
    bp:"138/88",
    order:"IV Iron – Ferric Carboxymaltose 750mg + Nephrology consult",
    provider:"Dr. Kim", facility:"North Aux Hospital", providerRole:"MFM", unit:"OB Outpatient", admitDate:"Apr 6, 2026",
    severity:"High", carePlanStatus:"pending", aiConfidence:83,
    diagnosis:"OB Anemia — Mixed Iron Deficiency, Obesity & Hypertension",
    icdCodes:["O99.011","D63.1","O10.02","E66"], allergies:["Penicillin"],
    medications:["Prenatal vitamins","Methyldopa 250mg BID"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Open",close:true},{name:"Comprehensive Diabetes Care (CDC)",st:"Closed",close:false},{name:"Depression Screening & Follow-up (DSF)",st:"Closed",close:false}],
    star:3.1, starP:3.5 },

  // LOW — HGB ≥ 11, minimal conditions
  { id:"AT-9012", name:"Ashley Thompson", age:26, dob:"09/05/2000", sex:"Female", weight:"61 kg", bmi:"22.0", npi:"1122334459", domain:"OB Anemia", caseType:"Postpartum",
    gestAge:"20 wks", edd:"08/27/2026", followUpDate:"04/30/2026", parity:"G1P0", redoOrNonIsolated:false, significantComorbidities:false, anticoagulants:false,
    labs:[{label:"HGB",value:"11.4",unit:"g/dL",status:"low",draws:[{date:"Apr 7",value:11.8},{date:"Apr 9",value:11.4}]},{label:"Ferritin",value:"28",unit:"ng/mL",status:"low"},{label:"TIBC",value:"295",unit:"mcg/dL",status:"low"},{label:"Transferrin Sat",value:"22",unit:"%",status:"low"},{label:"Reticulocytes",value:"1.8",unit:"%",status:"low"},{label:"WBC",value:"8.2",unit:"K/uL",status:"low"},{label:"Platelets",value:"282",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.7",unit:"mg/dL",status:"low"}],
    mhr:{placental:undefined,priorPPH:undefined,uterinePathology:false,priorCesareanCount:0,plannedCesarean:false,multipleGestation:null,grandMultiparity:false,priorUterineSurgery:false,hypertensiveDisorder:undefined,cardiacDisease:false,renalDisease:false,liverDisease:false,hematologicDisease:false,bleedingDisorder:false,pregestationalDiabetes:false,gestationalDiabetes:undefined,anticoagulationStatus:undefined,antiplateletAgent:null,pt:12,inr:1.0,fibrinogen:320},
    comorbidities:["Anemia"],
    conditions:["Mild Gestational Anemia","Mental Health Support"],
    bp:"110/68",
    order:"Oral Iron – Ferrous Sulfate 325mg BID + Mental health referral",
    provider:"Dr. Williams", facility:"North Aux Hospital", providerRole:"OB/GYN", unit:"OB Outpatient", admitDate:"Apr 9, 2026",
    severity:"Low", carePlanStatus:"generated", aiConfidence:82,
    diagnosis:"Mild Gestational Anemia — Iron Supplementation",
    icdCodes:["O99.011","D50.9"], allergies:["NKDA"],
    medications:["Prenatal vitamins","Ferrous Sulfate 325mg BID"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Closed",close:false},{name:"Comprehensive Diabetes Care (CDC)",st:"Closed",close:false},{name:"Depression Screening & Follow-up (DSF)",st:"Open",close:true}],
    star:3.9, starP:4.1 },

  // LOW — HGB ≥ 11, cardiac + thyroid
  { id:"LK-5509", name:"Linda Kowalski", age:41, dob:"06/18/1984", sex:"Female", weight:"74 kg", bmi:"26.1", npi:"1122334460", domain:"OB Anemia", caseType:"OB Non-Surgical",
    gestAge:"18 wks", edd:"09/09/2026", followUpDate:"04/29/2026", parity:"G3P1", redoOrNonIsolated:false, significantComorbidities:true, anticoagulants:true,
    labs:[{label:"HGB",value:"11.8",unit:"g/dL",status:"low",draws:[{date:"Apr 4",value:12.1},{date:"Apr 9",value:11.8}]},{label:"Ferritin",value:"32",unit:"ng/mL",status:"low"},{label:"TIBC",value:"280",unit:"mcg/dL",status:"low"},{label:"Transferrin Sat",value:"24",unit:"%",status:"low"},{label:"Reticulocytes",value:"2.1",unit:"%",status:"low"},{label:"WBC",value:"7.4",unit:"K/uL",status:"low"},{label:"Platelets",value:"201",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.8",unit:"mg/dL",status:"low"}],
    mhr:{placental:null,priorPPH:false,uterinePathology:false,priorCesareanCount:1,plannedCesarean:false,multipleGestation:null,grandMultiparity:false,priorUterineSurgery:false,hypertensiveDisorder:null,cardiacDisease:true,renalDisease:false,liverDisease:false,hematologicDisease:false,bleedingDisorder:false,pregestationalDiabetes:false,gestationalDiabetes:false,anticoagulationStatus:"prophylactic",antiplateletAgent:null,pt:13,inr:1.1,fibrinogen:310},
    comorbidities:["Cardiac Disease","Thyroid Disease","Advanced Maternal Age","Prior Cesarean"],
    conditions:["Cardiac Disease","Hypothyroidism","Advanced Maternal Age"],
    bp:"128/82",
    order:"Oral Iron – Ferrous Gluconate 300mg + Cardiology co-management",
    provider:"Dr. Osei", facility:"North Aux Hospital", providerRole:"MFM", unit:"OB Cardiac Clinic", admitDate:"Apr 8, 2026",
    severity:"Low", carePlanStatus:"in-progress", aiConfidence:78,
    diagnosis:"Borderline Anemia — Cardiac Co-management Required",
    icdCodes:["O99.011","D50.9","O99.41","O99.28"], allergies:["Aspirin"],
    medications:["Prenatal vitamins","Levothyroxine 100mcg daily","Heparin 5000u SQ BID"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Closed",close:false},{name:"Comprehensive Diabetes Care (CDC)",st:"Closed",close:false},{name:"Depression Screening & Follow-up (DSF)",st:"Closed",close:false}],
    star:3.6, starP:3.8 },

  // LOW — no active care recommendation generated
  { id:"NB-7742", name:"Nora Bennett", age:30, dob:"12/02/1995", sex:"Female", weight:"66 kg", bmi:"23.7", npi:"1122334461", domain:"OB Anemia", caseType:"Postpartum",
    gestAge:"16 wks", edd:"09/23/2026", followUpDate:"05/01/2026", parity:"G2P1", redoOrNonIsolated:false, significantComorbidities:false, anticoagulants:false,
    labs:[{label:"HGB",value:"13",unit:"g/dL",status:"normal",draws:[{date:"Apr 8",value:13},{date:"Apr 10",value:13}]},{label:"Ferritin",value:"Missing",unit:"ng/mL",status:"missing"},{label:"TIBC",value:"292",unit:"mcg/dL",status:"low"},{label:"Transferrin Sat",value:"26",unit:"%",status:"low"},{label:"Reticulocytes",value:"1.7",unit:"%",status:"low"},{label:"WBC",value:"7.8",unit:"K/uL",status:"low"},{label:"Platelets",value:"248",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.7",unit:"mg/dL",status:"low"}],
    mhr:{placental:null,priorPPH:false,uterinePathology:false,priorCesareanCount:0,plannedCesarean:false,multipleGestation:null,grandMultiparity:false,priorUterineSurgery:false,hypertensiveDisorder:null,cardiacDisease:false,renalDisease:false,liverDisease:false,hematologicDisease:false,bleedingDisorder:false,pregestationalDiabetes:false,gestationalDiabetes:false,anticoagulationStatus:"none",antiplateletAgent:null,pt:12,inr:1.0,fibrinogen:330},
    comorbidities:[], conditions:["Routine Prenatal Monitoring"], bp:"116/72",
    order:"", activeRecommendation:null, provider:"Dr. Rivera", facility:"Main Hospital", providerRole:"OB/GYN", unit:"OB Outpatient", admitDate:"Apr 10, 2026",
    severity:"Low", carePlanStatus:"generated", aiConfidence:80,
    diagnosis:"No Active Care Recommendation — Routine Monitoring", icdCodes:["Z34.82"], allergies:["NKDA"], medications:["Prenatal vitamins"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Closed",close:false},{name:"Comprehensive Diabetes Care (CDC)",st:"Closed",close:false},{name:"Depression Screening & Follow-up (DSF)",st:"Open",close:true}],
    star:4.0, starP:4.2 },
];
PATIENTS.forEach(p => { p._mhr = calcMHR(p); });

// ── Anemia grade helper — 4-tier per surgical consensus ──────────
// Severe ≤8.0 · Moderate 8.1–11.0 · Mild 11.1–12.9 · No Anemia >13.0
const getAnemiaGrade = (hgb) => {
  const h = parseFloat(hgb);
  if(h > 13.0) return {label:"No Anemia", tier:"normal",   color:C.success[400], bg:C.success[100]};
  if(h >= 11.1) return {label:"Mild",     tier:"mild",     color:"#92600A",       bg:C.yellow[100]};
  if(h >= 8.1)  return {label:"Moderate", tier:"moderate", color:C.orange[400],   bg:C.orange[100]};
  return               {label:"Severe",   tier:"severe",   color:C.error[400],    bg:C.error[100]};
};

const gaugePoint = (angle, radius = 90, center = 110) => {
  const radians = (angle * Math.PI) / 180;
  return {x: center + radius * Math.cos(radians), y: 106 - radius * Math.sin(radians)};
};

const gaugeArc = (startValue, endValue, maxValue = 74, gap = 1.2) => {
  const startAngle = 180 - (startValue / maxValue) * 180 + gap;
  const endAngle = 180 - (endValue / maxValue) * 180 - gap;
  const start = gaugePoint(startAngle);
  const end = gaugePoint(endAngle);
  return `M ${start.x} ${start.y} A 90 90 0 0 1 ${end.x} ${end.y}`;
};

const MHRGauge = ({score, maxPossible, color, compact = false}) => {
  const ranges = [
    {min:0, max:10, color:C.success[400], label:"Low"},
    {min:10, max:20, color:"#92600A", label:"Intermediate"},
    {min:20, max:35, color:C.orange[400], label:"High"},
    {min:35, max:74, color:C.error[400], label:"Very High"},
  ];
  const marker = gaugePoint(180 - (Math.min(score, maxPossible) / maxPossible) * 180);

  return (
    <div style={{width:compact?118:260,flexShrink:0,textAlign:"center",fontFamily:font}}>
      <svg viewBox="0 0 220 132" width="100%" role="img" aria-label={`Maternal health risk score ${score} of ${maxPossible}`}>
        <path d={gaugeArc(0,maxPossible,maxPossible)} fill="none" stroke={C.grey[400]} strokeWidth="14" strokeLinecap="round"/>
        {score > 0 && <path d={gaugeArc(0,Math.min(score,maxPossible),maxPossible,1.2)} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" style={{transition:"stroke-dashoffset 0.4s ease"}}/>}
        <circle cx={marker.x} cy={marker.y} r="6" fill="#fff" stroke={color} strokeWidth="3"/>
        <text x="110" y="88" textAnchor="middle" fill={color} fontSize="34" fontWeight="700" fontFamily={font}>{score}<tspan fill={C.grey[500]} fontSize="14" fontWeight="600"> / {maxPossible}</tspan></text>
        <text x="110" y="106" textAnchor="middle" fill={C.grey[500]} fontSize="10" fontWeight="600" letterSpacing="1.2" fontFamily={font}>TOTAL RISK SCORE</text>
        {!compact && [{value:0,label:"0"},{value:10,label:"10"},{value:20,label:"20"},{value:35,label:"35"},{value:74,label:"74"}].map(tick => {
          const point = gaugePoint(180 - (tick.value / maxPossible) * 180, 106);
          return <text key={tick.value} x={point.x} y={point.y + 14} textAnchor="middle" fill={C.grey[500]} fontSize="9" fontWeight="600" fontFamily={font}>{tick.label}</text>;
        })}
      </svg>
      {!compact && <div style={{display:"flex",justifyContent:"center",gap:8,marginTop:-3,flexWrap:"wrap"}}>
        {ranges.map(range => <span key={range.label} style={{display:"inline-flex",alignItems:"center",gap:4,fontSize:10,color:C.grey[600]}}><span style={{width:7,height:7,borderRadius:"50%",background:range.color}}/>{range.label}</span>)}
      </div>}
    </div>
  );
};

// ── Maternal Health Risk Score Modal — full Jira AC implementation ──
const MHRModal = ({p, onClose}) => {
  const mhr = p._mhr;
  const ac = mhr.color;
  const [showTransparency, setShowTransparency] = useState(false);
  const calcDate = "Oct 2, 2026 · 14:32";

  const actions = mhr.score >= 35
    ? ["Multidisciplinary planning — MFM, anesthesia, hematology","Blood-bank preparedness — type & crossmatch ≥4 units","Initiate IV iron therapy — Ferric Carboxymaltose STAT","Consider delaying elective procedure if unstable","CBC recheck in 24–48h"]
    : mhr.score >= 20
    ? ["Pre-delivery optimization recommended","IV iron therapy — Ferric Carboxymaltose 750mg within 14 days","MFM consultation recommended","Recheck Hgb + Ferritin in 7–10 days","Target Hgb ≥11 g/dL by 34 weeks gestation"]
    : mhr.score >= 10
    ? ["Enhanced anemia monitoring — CBC every 4 weeks","Consider IV iron if Hgb <11 g/dL","Obstetric follow-up with risk reassessment"]
    : ["Routine prenatal monitoring","Oral iron supplementation if Hgb <11 g/dL","Standard CBC schedule per OB protocol"];

  // Severity dot color for risk drivers
  const dotColor = (sev) => sev==="high" ? C.error[400] : sev==="moderate" ? C.orange[400] : "#92600A";

  // Data transparency inputs
  const transparencyInputs = [
    ...p.labs.map(l => ({name:l.label, value:`${l.value} ${l.unit||""}`, date:"Apr 9, 2026", source:"Lab (EHR)", used:true})),
    {name:"PT", value:`${p.mhr.pt??"—"} s`, date:"Apr 9, 2026", source:"Lab (EHR)", used:p.mhr.pt!=null},
    {name:"INR", value:`${p.mhr.inr??"—"}`, date:"Apr 9, 2026", source:"Lab (EHR)", used:p.mhr.inr!=null},
    {name:"Fibrinogen", value:`${p.mhr.fibrinogen??"—"} mg/dL`, date:"Apr 9, 2026", source:"Lab (EHR)", used:p.mhr.fibrinogen!=null},
    {name:"Placental Diagnosis", value: p.mhr.placental||"Not documented", date:"—", source:"Ultrasound", used:p.mhr.placental!=null},
    {name:"Prior PPH", value: p.mhr.priorPPH===undefined?"Not documented":p.mhr.priorPPH?"Yes":"No", date:"—", source:"OB History", used:p.mhr.priorPPH!==undefined},
    {name:"Hypertensive Disorder", value: p.mhr.hypertensiveDisorder||"None", date:"—", source:"OB History", used:p.mhr.hypertensiveDisorder!==undefined},
    {name:"Gestational Diabetes", value: p.mhr.gestationalDiabetes===undefined?"Not documented":p.mhr.gestationalDiabetes?"Yes":"No", date:"—", source:"OB History", used:p.mhr.gestationalDiabetes!==undefined},
    {name:"Anticoagulation Status", value: p.mhr.anticoagulationStatus||"None", date:"—", source:"Medication List", used:p.mhr.anticoagulationStatus!==undefined},
  ];

  const DriverRow = ({d}) => (
    <div style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderBottom:"none"}}>
      <div style={{width:10,height:10,borderRadius:"50%",background:dotColor(d.severity),flexShrink:0,boxShadow:d.severity==="high"?`0 0 4px ${C.error[400]}`:"none"}}/>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:C.grey[800],fontFamily:font}}>{d.label}</div>
        <div style={{fontSize:11,color:C.grey[500],fontFamily:font,marginTop:1}}>{d.value}</div>
      </div>
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{width:640,maxHeight:"88vh",background:C.grey[100],borderRadius:16,display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>

        {/* ── Header ── */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",gap:12,flexShrink:0,background:"#fff"}}>
          <div style={{width:36,height:36,borderRadius:10,background:C.grey[200],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.grey[700]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,color:C.grey[800],fontFamily:font,lineHeight:1.2}}>Maternal Health Risk Score</div>
            <div style={{fontSize:12,color:C.grey[600],fontFamily:font,marginTop:2}}>{p.name} · MRN {p.id}</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:C.grey[200],border:"none",color:C.grey[600],fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:font,lineHeight:1}}>✕</button>
        </div>

        {/* ── AC1: Risk Summary Card with 0–74 severity gauge ── */}
        <div style={{padding:"18px 24px 20px",borderBottom:`1px solid ${C.grey[300]}`,flexShrink:0,background:"#fff"}}>
          <div style={{display:"flex",alignItems:"center",gap:18,flexWrap:"wrap"}}>
            <MHRGauge score={mhr.score} maxPossible={mhr.maxPossible} color={ac}/>
            <div style={{flex:1,minWidth:220}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <SevChip tier={mhr.tier}/>
                <span style={{fontSize:14,fontWeight:700,color:ac,fontFamily:font}}>{mhr.cat}</span>
              </div>
              <p style={{fontSize:13,color:C.grey[700],fontFamily:font,lineHeight:1.5,margin:"0 0 8px"}}>{mhr.interp}</p>
              <div style={{fontSize:11,color:C.grey[500],fontFamily:font}}>Calculated {calcDate}</div>
            </div>
          </div>
          {/* Domain summary bar */}
          <div style={{display:"flex",gap:4,marginTop:14}}>
            {mhr.domains.map(d => (
              <div key={d.id} style={{flex:1,display:"flex",flexDirection:"column",gap:2}}>
                <div style={{height:6,background:C.grey[300],borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${d.cap>0?Math.min(d.clamped/d.cap*100,100):0}%`,background:d.clamped>0?ac:C.grey[400],borderRadius:3,transition:"width 0.4s ease"}}/>
                </div>
                <span style={{fontSize:9,fontWeight:600,color:C.grey[600],fontFamily:font,textAlign:"center"}}>{d.clamped}/{d.cap}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── AC7: Missing Data Banner ── */}
        {mhr.missing.length > 0 && (
          <div style={{padding:"10px 20px",background:C.yellow[100],borderBottom:`1px solid ${C.grey[300]}`,flexShrink:0,display:"flex",alignItems:"flex-start",gap:8}}>
            <span style={{fontSize:14,flexShrink:0,marginTop:1}}>⚠️</span>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:700,color:"#92600A",fontFamily:font,marginBottom:2}}>Missing Input Data</div>
              <div style={{fontSize:12,color:C.grey[700],fontFamily:font,lineHeight:1.5}}>
                {mhr.missing.join(", ")} — {mhr.calcComplete ? "Complete risk calculation performed." : "Risk calculation may be incomplete due to missing inputs. Results should be interpreted with caution."}
              </div>
            </div>
          </div>
        )}

        {/* ── Scrollable body ── */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:14,background:"#fff"}}>

          {/* ── AC3: Risk Drivers Panel — Modifiable vs Non-Modifiable ── */}
          <div>
            <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:C.grey[600],fontFamily:font,marginBottom:8}}>Risk Drivers</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {/* Potentially Modifiable */}
              <div style={{border:`1px solid ${C.grey[300]}`,borderRadius:10,overflow:"hidden"}}>
                <div style={{padding:"8px 12px",background:C.grey[200],borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13}}>🔄</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.grey[700],fontFamily:font}}>Potentially Modifiable</span>
                  <span style={{fontSize:11,color:C.grey[500],fontFamily:font,marginLeft:"auto"}}>{mhr.modifiableDrivers.length}</span>
                </div>
                {mhr.modifiableDrivers.length===0
                  ? <div style={{padding:"10px 12px",fontSize:12,color:C.grey[500],fontFamily:font}}>No modifiable drivers identified</div>
                  : mhr.modifiableDrivers.map((d,i) => <DriverRow key={i} d={d}/>)}
              </div>
              {/* Obstetric / Non-Modifiable */}
              <div style={{border:`1px solid ${C.grey[300]}`,borderRadius:10,overflow:"hidden"}}>
                <div style={{padding:"8px 12px",background:C.grey[200],borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",gap:6}}>
                  <span style={{fontSize:13}}>📋</span>
                  <span style={{fontSize:12,fontWeight:700,color:C.grey[700],fontFamily:font}}>Obstetric / Non-Modifiable</span>
                  <span style={{fontSize:11,color:C.grey[500],fontFamily:font,marginLeft:"auto"}}>{mhr.nonModifiableDrivers.length}</span>
                </div>
                {mhr.nonModifiableDrivers.length===0
                  ? <div style={{padding:"10px 12px",fontSize:12,color:C.grey[500],fontFamily:font}}>No non-modifiable drivers identified</div>
                  : mhr.nonModifiableDrivers.map((d,i) => <DriverRow key={i} d={d}/>)}
              </div>
            </div>
          </div>

          {/* ── AC4: Recommended Preparation Card ── */}
          <div style={{background:"#fff",border:`1px solid ${C.grey[300]}`,borderRadius:10,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:16}}>🎯</span>
              <span style={{fontSize:14,fontWeight:700,color:C.grey[800],fontFamily:font}}>Recommended Preparation</span>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {actions.map((a,i) => (
                <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",fontSize:13,color:C.grey[700],fontFamily:font,lineHeight:1.5}}>
                  <span style={{color:ac,flexShrink:0,marginTop:1,fontWeight:700}}>•</span>{a}
                </div>
              ))}
            </div>
          </div>

          {/* ── AC5: Data Transparency Drawer ── */}
          <div style={{border:`1px solid ${C.grey[300]}`,borderRadius:10,overflow:"hidden"}}>
            <button onClick={()=>setShowTransparency(s=>!s)} style={{width:"100%",padding:"10px 14px",background:C.grey[200],border:"none",display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontFamily:font}}>
              <span style={{fontSize:13}}>📊</span>
              <span style={{fontSize:13,fontWeight:700,color:C.grey[700],fontFamily:font,flex:1,textAlign:"left"}}>Data Transparency</span>
              <span style={{fontSize:11,color:C.grey[500],fontFamily:font,marginRight:6}}>{transparencyInputs.filter(t=>t.used).length} of {transparencyInputs.length} inputs used</span>
              <span style={{fontSize:12,color:C.grey[500]}}>{showTransparency ? "▲" : "▼"}</span>
            </button>
            {showTransparency && (
              <div style={{overflowY:"auto",maxHeight:280}}>
                {transparencyInputs.map((inp,i) => (
                  <div key={i} style={{display:"grid",gridTemplateColumns:"1.3fr 1fr 0.8fr 0.8fr 0.5fr",gap:8,padding:"7px 14px",borderBottom:i<transparencyInputs.length-1?`1px solid ${C.grey[300]}`:"none",alignItems:"center",background:inp.used?"#fff":C.yellow[100]}}>
                    <span style={{fontSize:12,fontWeight:600,color:C.grey[800],fontFamily:font}}>{inp.name}</span>
                    <span style={{fontSize:12,color:C.grey[700],fontFamily:font}}>{inp.value}</span>
                    <span style={{fontSize:11,color:C.grey[500],fontFamily:font}}>{inp.date}</span>
                    <span style={{fontSize:11,color:C.grey[500],fontFamily:font}}>{inp.source}</span>
                    <span style={{fontSize:11,fontWeight:700,color:inp.used?C.success[400]:C.orange[400],fontFamily:font,textAlign:"right"}}>{inp.used?"Used":"Missing"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Domain breakdowns (collapsible detail) ── */}
          {mhr.domains.map((dom,di) => (
            <div key={dom.id}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:14}}>{MHR_DOMAINS[di].icon}</span>
                <span style={{fontSize:13,fontWeight:700,color:C.grey[800],fontFamily:font,flex:1}}>{dom.name}</span>
                <span style={{fontSize:14,fontWeight:700,color:dom.clamped>0?ac:C.grey[400],fontFamily:font}}>{dom.clamped}</span>
                <span style={{fontSize:12,color:C.grey[400],fontFamily:font}}>/{dom.cap}</span>
              </div>
              <div style={{background:"#fff",borderRadius:10,overflow:"hidden",border:`1px solid ${C.grey[300]}`}}>
                {dom.factors.map((f,i) => {
                  const earned = f.points > 0;
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderBottom:i<dom.factors.length-1?`1px solid ${C.grey[300]}`:"none",background:earned?"#fff":C.grey[200]}}>
                      <div style={{width:18,height:18,borderRadius:6,background:earned?ac:C.grey[300],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                        <span style={{fontSize:10,fontWeight:700,color:"#fff"}}>{earned?"✓":"–"}</span>
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13,fontWeight:earned?600:400,color:earned?C.grey[800]:C.grey[500],fontFamily:font}}>{f.label}</div>
                        <div style={{fontSize:11,color:C.grey[500],fontFamily:font,marginTop:1}}>{f.value} · {f.criteria}{f.icd?` · ICD-10: ${f.icd}`:""}</div>
                      </div>
                      <div style={{flexShrink:0,textAlign:"right"}}>
                        <span style={{fontSize:13,fontWeight:700,color:earned?ac:C.grey[400],fontFamily:font}}>{earned?`+${f.points}`:"+0"}</span>
                        <span style={{fontSize:11,color:C.grey[400],fontFamily:font,marginLeft:2}}>/{f.max}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {dom.raw > dom.cap && (
                <div style={{fontSize:11,color:C.orange[400],fontFamily:font,marginTop:4,fontStyle:"italic"}}>Raw sum {dom.raw} clamped to cap {dom.cap}</div>
              )}
            </div>
          ))}

        </div>

        {/* ── AC9: Clinical Safety Disclaimer (persistent, non-dismissible) ── */}
        <div style={{padding:"10px 20px",background:C.grey[200],borderTop:`1px solid ${C.grey[300]}`,flexShrink:0,display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:C.grey[600],flexShrink:0}}>ℹ️</span>
          <span style={{fontSize:11,color:C.grey[600],fontFamily:font,lineHeight:1.4}}>This assessment supports but does not replace clinical judgment. All clinical decisions should be made by the treating provider.</span>
        </div>
      </div>
    </div>
  );
};

// ── Overview Zone (identical structure to BloodHealth, OB data) ────
const OverviewZone = ({p, onNavigate}) => {
  const [mhrOpen, setMhrOpen] = useState(false);
  const hgbLab = p.labs[0];
  const draws = hgbLab.draws||[]; const hasDelta = draws.length>=2;
  const currentHgb = parseFloat(hgbLab.value);
  const baselineHgb = hasDelta ? draws[0].value : currentHgb;
  const delta = hasDelta ? Math.abs(draws[draws.length-1].value - draws[0].value).toFixed(1) : null;
  const isDown = hasDelta && draws[draws.length-1].value < draws[0].value;
  const deltaHbPct = hasDelta&&isDown ? Math.round(((baselineHgb-currentHgb)/baselineHgb)*100) : null;
  const isDeltaRisk = deltaHbPct!==null && deltaHbPct>=50;
  const mhr = p._mhr;
  const hgbColor = getAnemiaGrade(currentHgb).color;
  const ferColor = p.labs[1].status==="critical"?C.error[400]:p.labs[1].status==="high"||p.labs[1].status==="borderline"?C.orange[400]:C.grey[600];
  const protocol = p.severity==="Critical"?"Urgent: IV Iron + MFM Consultation":p.severity==="High"?"IV Iron Therapy Protocol – ACOG PB #233":"Monitoring + IV Iron Supplementation";
  const drug     = p.severity==="Critical"?"Ferric Carboxymaltose 1000mg IV — initiate within 24h":p.severity==="High"?"Ferric Carboxymaltose 750mg IV — week 1 & 3":"Ferric Carboxymaltose 500mg IV — reassess in 4 weeks";
  const recs = p.severity==="Critical"
    ?["Approve IV Iron per ACOG PB #233 — urgent","MFM consultation for high-risk monitoring","Target Hgb ≥11 g/dL before delivery"]
    :p.severity==="High"
    ?["Initiate IV Iron within 14 days","Recheck Hgb & Ferritin in 7–10 days","Coordinate with OB team on delivery Hgb target"]
    :["Continue monitoring — CBC weekly","IV Iron supplementation if Hgb <11","OB follow-up in 2 weeks"];
  return (
    <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:14}}>
      {/* Risk Assessment + Clinical Impression — Image 5 */}
      <div style={{background:"#fff",border:`1px solid ${C.grey[300]}`,borderRadius:12,overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
        <div style={{padding:"11px 18px",borderBottom:`1px solid ${C.grey[200]}`,display:"flex",alignItems:"center",gap:7}}>
          <span style={{fontSize:14}}>⚠️</span>
          <span style={{fontSize:14,fontWeight:700,color:C.grey[800],fontFamily:font}}>Risk Assessment</span>
        </div>
        {/* Six value columns: HGB · Ferritin · BP · Maternal Health · EDD · Active Order */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1.4fr",borderBottom:`1px solid ${C.grey[200]}`}}>
          <div style={{padding:"14px 18px",borderRight:`1px solid ${C.grey[200]}`}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>HGB</div>
            <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:4}}>
              <span style={{fontSize:32,fontWeight:700,color:hgbColor,fontFamily:font,lineHeight:1,letterSpacing:"-0.02em"}}>{hgbLab.value}</span>
              <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>g/dL</span>
            </div>
            {hasDelta && <div style={{display:"inline-flex",alignItems:"center",gap:3,background:isDown?C.error[100]:C.success[100],borderRadius:4,padding:"2px 7px",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:700,color:isDown?C.error[400]:C.success[400]}}>{isDown?"↓":"↑"}</span>
              <span style={{fontSize:12,fontWeight:600,color:isDown?C.error[400]:C.success[400],fontFamily:font}}>{delta} g/dL</span>
            </div>}
          </div>
          <div style={{padding:"14px 18px",borderRight:`1px solid ${C.grey[200]}`}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>Ferritin</div>
            <div style={{display:"flex",alignItems:"baseline",gap:3}}>
              <span style={{fontSize:32,fontWeight:700,color:ferColor,fontFamily:font,lineHeight:1,letterSpacing:"-0.02em"}}>{p.labs[1].value}</span>
              <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>ng/mL</span>
            </div>
          </div>
          <div style={{padding:"14px 18px",borderRight:`1px solid ${C.grey[200]}`}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>Blood Pressure</div>
            {(() => {
              const [s,d] = p.bp.split("/").map(Number);
              const elevated = s>=140||d>=90;
              const bpColor = elevated ? C.error[400] : s>=130||d>=80 ? C.orange[400] : C.success[400];
              return (
                <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                  <span style={{fontSize:32,fontWeight:700,color:bpColor,fontFamily:font,lineHeight:1,letterSpacing:"-0.02em"}}>{p.bp}</span>
                  <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>mmHg</span>
                </div>
              );
            })()}
          </div>
          <div style={{padding:"14px 18px",borderRight:`1px solid ${C.grey[200]}`}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>Maternal Health Score</div>
            <div onClick={()=>setMhrOpen(true)} style={{cursor:"pointer"}} title={mhr.cat}>
              <MHRGauge score={mhr.score} maxPossible={mhr.maxPossible} color={mhr.color} compact/>
            </div>
          </div>
          <div style={{padding:"14px 18px",borderRight:`1px solid ${C.grey[200]}`}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>Visit Date</div>
            <div style={{fontSize:18,fontWeight:600,color:C.grey[800],fontFamily:font,lineHeight:1.3}}>{p.followUpDate}</div>
          </div>
          <div style={{padding:"14px 18px",borderRight:`1px solid ${C.grey[200]}`}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>EDD</div>
            <div style={{fontSize:18,fontWeight:600,color:C.grey[800],fontFamily:font,lineHeight:1.3}}>{p.edd}</div>
          </div>
          <div style={{padding:"14px 18px"}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>Active Order</div>
            {p.activeRecommendation===null
              ? <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:C.grey[500],flexShrink:0}}/><span style={{fontSize:14,color:C.grey[600],fontFamily:font,fontWeight:600}}>No Active Recommendation</span></div>
              : p.carePlanStatus==="pending"
                ? <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:C.error[400],flexShrink:0}}/><span style={{fontSize:14,color:C.error[400],fontFamily:font,fontWeight:600}}>Care Recommendation Not Started</span></div>
                : <div style={{fontSize:14,fontWeight:600,color:C.grey[800],fontFamily:font,lineHeight:1.5}}>{p.order}</div>}
          </div>
        </div>
      </div>

      {/* AI Insight + Care Plan — merged */}
      {p.activeRecommendation===null ? (
        <div style={{borderRadius:12,overflow:"hidden",background:"#fff",border:`1px solid ${C.grey[300]}`,boxShadow:"0 1px 4px rgba(0,0,0,0.04)"}}>
          <div style={{padding:"13px 18px",borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:14,color:C.grey[500]}}>AI Insight</span>
          </div>
          <div style={{padding:"20px 18px",fontSize:14,color:C.grey[600],fontFamily:font}}>No AI Insight Recommendations</div>
        </div>
      ) : (
      <div style={{borderRadius:12,overflow:"hidden",background:"#fff",boxShadow:"0 2px 12px rgba(0,0,0,0.08)"}}>
        {/* Gradient header */}
        <div style={{background:`linear-gradient(135deg,${C.primary[600]},${C.primary[500]},${C.secondary[600]})`,padding:"13px 18px",display:"flex",alignItems:"center",gap:10,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,opacity:0.06,backgroundImage:"radial-gradient(rgba(255,255,255,0.9) 1px,transparent 1px)",backgroundSize:"22px 22px",pointerEvents:"none"}}/>
          <span style={{fontSize:14,color:C.secondary[400],position:"relative"}}>✦</span>
          <span style={{fontSize:14,fontWeight:700,color:"rgba(255,255,255,0.85)",fontFamily:font,position:"relative"}}>AI Insight</span>
        </div>
        <div style={{padding:"16px 18px",display:"flex",flexDirection:"column",gap:12}}>
          {/* AI summary sentence */}
          <div style={{fontSize:14,color:C.grey[700],fontFamily:font,lineHeight:1.6}}>
            {p.severity==="Critical"
              ?`Patient has hemoglobin of ${p.labs[0].value} g/dL at ${p.gestAge} gestation with ${p.comorbidities.length} active comorbidities, indicating critical OB anemia requiring immediate IV iron intervention.`
              :`Patient has hemoglobin of ${p.labs[0].value} g/dL with ferritin ${p.labs[1].value} ng/mL at ${p.gestAge} gestation. ACOG PB #233 criteria met for IV iron therapy.`}
          </div>
          {/* Side-by-side: Protocol left, Recommendations right */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,border:`1px solid ${C.grey[300]}`,borderRadius:8,overflow:"hidden"}}>
            {/* Recommended Protocol */}
            <div style={{padding:"14px 16px",borderRight:`1px solid ${C.grey[300]}`}}>
              <div style={{fontSize:12,fontWeight:700,color:C.primary[500],fontFamily:font,marginBottom:6}}>Recommended Protocol</div>
              <div style={{fontSize:14,fontWeight:700,color:C.grey[800],fontFamily:font,marginBottom:4}}>OB Iron Deficiency Anemia – ACOG PB #233</div>
              <div style={{fontSize:14,color:C.grey[700],fontFamily:font,marginBottom:4}}>{drug}</div>
            </div>
            {/* Key Recommendations */}
            <div style={{padding:"14px 16px",background:C.grey[200]}}>
              <div style={{fontSize:12,fontWeight:700,color:C.grey[800],fontFamily:font,marginBottom:10}}>Key Recommendations:</div>
              {recs.map((r,i) => (
                <div key={i} style={{display:"flex",gap:8,fontSize:12,color:C.grey[700],fontFamily:font,marginBottom:i<recs.length-1?7:0,lineHeight:1.4,alignItems:"flex-start"}}>
                  <div style={{width:17,height:17,borderRadius:"50%",background:C.primary[100],border:`1.5px solid ${C.primary[500]}`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                    <span style={{fontSize:8,fontWeight:700,color:C.primary[500]}}>{i+1}</span>
                  </div>
                  {r}
                </div>
              ))}
            </div>
          </div>
          {/* CTA */}
          <div style={{display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>onNavigate("cp")} style={{background:C.primary[600],color:"#fff",border:"none",borderRadius:8,padding:"9px 18px",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",gap:6}}>
              Review Optimization Recommendations <ArrowRight size={13}/>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Evidence Base */}
      <div style={{background:C.success[100],border:"1px solid rgba(56,128,50,0.2)",borderRadius:12,padding:"14px 18px"}}>
        <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:C.success[400],fontFamily:font,marginBottom:10}}>Evidence Base</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[{t:"ACOG Practice Bulletin #233 (2021)",d:"Anemia in Pregnancy — IV iron preferred for moderate-severe"},{t:"ACOG Safe Motherhood Initiative",d:"Optimizing Hgb before delivery reduces transfusion 60–70%"},{t:"NEJM 2015 — Breymann et al.",d:"IV ferric carboxymaltose superior to oral iron in pregnancy"},{t:"WHO Maternal Nutrition Guidelines",d:"Iron deficiency affects 40% of pregnancies worldwide"}].map(({t,d},i) => (
            <div key={i} style={{display:"flex",gap:6,alignItems:"flex-start"}}>
              <span style={{fontSize:10,color:C.success[400],flexShrink:0,marginTop:1,fontWeight:700}}>✓</span>
              <div><div style={{fontSize:12,fontWeight:600,color:C.success[400],fontFamily:font}}>{t}</div><div style={{fontSize:10,color:C.grey[600],fontFamily:font,marginTop:1}}>{d}</div></div>
            </div>
          ))}
        </div>
      </div>
      {mhrOpen && <MHRModal p={p} onClose={()=>setMhrOpen(false)}/>}
    </div>
  );
};

// ── AI Summary Zone (same layout as BloodHealth, OB prompts) ──────
const AISummaryZone = ({p}) => {
  const [msg, setMsg] = useState("");
  const hgbDrop = p.labs[0].draws&&p.labs[0].draws.length>=2 ? Math.abs(p.labs[0].draws[p.labs[0].draws.length-1].value-p.labs[0].draws[0].value).toFixed(1) : null;
  const evidenceStudies = {
    "ACOG PB #233":"ACOG Practice Bulletin #233 (2021) defines anemia in pregnancy as Hgb <11 g/dL in first/third trimester and <10.5 g/dL in second trimester. IV iron (ferric carboxymaltose or ferumoxytol) is preferred over oral iron for moderate-severe cases due to faster response and better tolerability. Target Hgb ≥11 g/dL before delivery to reduce transfusion risk by 60–70%.",
    "SMM Prevention":"ACOG Safe Motherhood Initiative recommends proactive anemia screening and treatment as a key modifiable risk factor for severe maternal morbidity (SMM). Optimizing hemoglobin before delivery is associated with a 60–70% reduction in peripartum transfusion requirement and 2–3× reduction in postpartum hemorrhage risk.",
    "ESAIC 2023":"ESAIC 2023 Patient Blood Management guidelines recommend IV iron pre-delivery when Hgb <13 g/dL. Ferric carboxymaltose is preferred for speed of response, particularly when delivery is within 6 weeks.",
  };
  const initMsgs = [
    {role:"user", text:"Generate the initial ACOG risk assessment for this patient."},
    {role:"ai", text:`🗒️ MATERNAL HEALTH RISK ASSESSMENT SUMMARY

**Obstetric Patient**: Hgb ${p.labs[0].value} g/dL during pregnancy
**Risk Category**: ${p._mhr.score>=35?"VERY HIGH RISK":p._mhr.score>=20?"HIGH RISK":p._mhr.score>=10?"INTERMEDIATE RISK":"LOW RISK"} — ${p._mhr.cat}
**Total Score**: ${p._mhr.score} of ${p._mhr.maxPossible} (${p._mhr.activeDomains} of 6 domains active)

${p._mhr.interp}

🔑 DOMAIN BREAKDOWN

**ACOG Practice Bulletin #233 (2021) - Anemia in Pregnancy:**
• Anemia defined as Hgb <11 g/dL in 1st/3rd trimester, <10.5 g/dL in 2nd trimester
• Associated with increased risk of:
  - Postpartum hemorrhage (PPH) - 2-3x increased risk
  - Need for blood transfusion at delivery - 4-5x increased risk
  - Preterm delivery - 1.5-2x increased risk
  - Low birth weight infants
  - Maternal fatigue and decreased quality of life
  - Postpartum depression (2x risk)

**ACOG Safe Motherhood Initiative - Severe Maternal Morbidity:**
• Anemia is a key modifiable risk factor for severe complications
• Optimizing hemoglobin before delivery reduces transfusion by 60-70%
• Additional risk factors present: ${p.comorbidities.join(", ")}

**WHO Guidelines - Maternal Anemia:**
• Pregnant women should maintain Hgb ≥11 g/dL
• Hgb <10 g/dL requires urgent intervention
• Iron deficiency most common cause (affects 40% of pregnancies worldwide)

💡 RECOMMENDED INTERVENTIONS

**Immediate Actions:**
1. **IV Iron Therapy - PREFERRED for moderate-severe anemia**
  - Ferric Carboxymaltose (Injectafer) 750mg IV, may repeat in 7 days
  - Ferumoxytol (Feraheme) 510mg IV x 2 doses (24h apart)
  - Superior to oral iron: faster response, better tolerance, higher compliance
  - NEJM 2015 study: IV iron achieves target Hgb 2-3 weeks faster than oral

2. **Laboratory Monitoring**
  - Complete iron panel: serum iron, TIBC, ferritin, TSAT
  - CBC with reticulocyte count at 2-4 weeks post-treatment
  - Goal: Hgb ≥11 g/dL by 34 weeks gestation
  - Ferritin goal: >30 ng/mL (>100 ng/mL optimal)

3. **Nutritional Support**
  - Continue prenatal vitamins with 27-30mg elemental iron daily
  - Dietary counseling: iron-rich foods (red meat, beans, spinach)
  - Vitamin C supplementation to enhance iron absorption
  - Avoid calcium/antacids within 2h of iron intake

4. **Multidisciplinary Coordination**
  - OB/GYN primary management with high-risk consultation if needed
  - Maternal-fetal medicine referral if Hgb <8 g/dL or poor response
  - Anesthesia pre-assessment for delivery planning
  - Blood bank notification if Hgb remains <10 g/dL near term

5. **Delivery Planning - Risk Mitigation**
  - Type and screen in 3rd trimester
  - Active management of third stage (oxytocin) to prevent PPH
  - Consider prophylactic tranexamic acid (TXA) if high PPH risk
  - Blood products on standby if Hgb <9 g/dL at delivery
  - Postpartum Hgb check before discharge

⚠️ RISKS IF UNTREATED

**Maternal Risks:**
• **Postpartum hemorrhage**: 15-25% incidence vs 5-10% in non-anemic women
• **Transfusion requirement**: 8-12% vs 2-3% baseline
• **Severe maternal morbidity**: ICU admission, hysterectomy, multi-organ dysfunction
• **Postpartum depression**: 2x increased risk
• **Prolonged recovery**: Fatigue, decreased functional status, impaired bonding

**Fetal/Neonatal Risks:**
• **Preterm birth**: <37 weeks gestation
• **Low birth weight**: <2500g at term
• **NICU admission**: Respiratory distress, hyperbilirubinemia
• **Neurodevelopmental delays**: Iron critical for fetal brain development
• **Neonatal iron deficiency**: Increased risk in offspring

**Delivery Complications:**
• **Operative delivery risk**: Increased cesarean section rate
• **Anesthesia complications**: Hypotension with neuraxial anesthesia
• **Blood product shortages**: If multiple patients require transfusion simultaneously

📊 EVIDENCE-BASED IMPACT

**Treatment Efficacy:**
• **IV iron**: 85-90% achieve Hgb >11 g/dL by 4 weeks (vs 60-70% with oral)
• **Transfusion reduction**: Treating prenatal anemia reduces delivery transfusion by 60-70%
• **Cost-effectiveness**: $500 IV iron prevents $2,500 transfusion (5x ROI)
• **Patient satisfaction**: Higher tolerance and adherence vs oral iron

**Quality Metrics:**
• Aligns with ACOG Safe Motherhood Initiative
• Supports Joint Commission Perinatal Care core measures
• Reduces severe maternal morbidity index (CDC indicator)
• Improves patient safety outcomes

**Key Literature:**
• **ACOG Practice Bulletin #233 (2021)**: Anemia in pregnancy management
• **ACOG Practice Bulletin #183 (2017)**: Postpartum hemorrhage prevention
• **Breymann et al (BMC Pregnancy 2017)**: IV iron superiority in pregnancy
• **Naqvi et al (NEJM 2015)**: Iron deficiency anemia treatment outcomes
• **WHO Guideline (2016)**: Daily iron supplementation in pregnant women

🔄 NEXT STEPS

**Week 1:**
✓ Initiate IV iron therapy today
✓ Complete iron panel and CBC
✓ Schedule 2-week follow-up for response assessment
✓ Patient education on warning signs (dyspnea, chest pain, severe fatigue)

**Week 2-3:**
✓ Repeat CBC to assess Hgb response
✓ Second IV iron dose if initial Hgb <9 g/dL or suboptimal response
✓ Continue prenatal vitamins

**Week 4-6:**
✓ Target Hgb >11 g/dL achieved - continue maintenance
✓ If Hgb still <11 g/dL, consider:
  - Additional IV iron dose
  - Evaluate for other causes (hemoglobinopathy, chronic disease)
  - MFM referral

**Third Trimester:**
✓ Repeat CBC at 32-36 weeks
✓ Delivery planning with anesthesia/blood bank if Hgb <10 g/dL
✓ Active management of third stage at delivery
✓ Postpartum Hgb check and continued iron therapy if needed

**IMMEDIATE ACTION REQUIRED**: Approve IV iron order, complete iron studies, schedule close follow-up.`},
  ];
  const [msgs, setMsgs] = useState(initMsgs);
  const [copied, setCopied] = useState(null);
  const send = (q) => {
    const t=(q||msg).trim(); if(!t) return; setMsg("");
    const studyKey = Object.keys(evidenceStudies).find(k=>t.includes(k));
    setMsgs(m=>[...m,{role:"user",text:t}]);
    setTimeout(()=>{
      const reply = studyKey ? evidenceStudies[studyKey] : `Based on ${p.name}'s OB profile and ACOG PB #233 — recommended: ${p.order}. ${p.severity==="Critical"?"Immediate IV iron intervention warranted.":"Optimization window remains open — act within 14 days."}`;
      setMsgs(m=>[...m,{role:"ai",text:reply}]);
    }, 500);
  };
  const copyMsg = (text) => { try{navigator.clipboard&&navigator.clipboard.writeText(text);}catch(e){} setCopied(text); setTimeout(()=>setCopied(null),1800); };
  const statActions = p.severity==="Critical"
    ?["Initiate IV iron — Ferric Carboxymaltose 1000mg STAT","MFM consultation — high-risk pregnancy monitoring","Type & screen — peripartum transfusion risk","Recheck CBC in 24h, target Hgb ≥11 g/dL"]
    :["IV Iron Ferric Carboxymaltose 750mg — initiate within 14 days","Recheck Hgb + Ferritin in 7–10 days","Coordinate with OB team on Hgb target before delivery","HEDIS gap documentation — close PPC metric"];
  const thresholds = p.severity==="Critical"
    ?[["Peripartum","Hgb < 8 g/dL"],["PPH threshold","Hgb < 7 g/dL"],["Recheck","24h post-iron"]]
    :[["IV iron trigger","Hgb < 11 g/dL"],["Delivery target","Hgb ≥ 11 g/dL"],["Recheck","7–10 days"]];
  const [chatFullscreen, setChatFullscreen] = useState(false);
  return (
    <div style={{display:"grid",gridTemplateColumns:chatFullscreen?"1fr":"1fr 360px",gap:10,padding:"14px 16px",flex:1,overflow:"hidden",minHeight:0,transition:"grid-template-columns 0.2s ease"}}>
      {!chatFullscreen && (
        <div style={{overflowY:"auto",display:"flex",flexDirection:"column",gap:10,minHeight:0}}>
          <div style={{background:`linear-gradient(135deg,${C.primary[600]},${C.primary[500]},${C.secondary[600]})`,borderRadius:12,overflow:"hidden",position:"relative"}}>
            <div style={{position:"absolute",inset:0,opacity:0.06,backgroundImage:"radial-gradient(rgba(255,255,255,0.9) 1px,transparent 1px)",backgroundSize:"22px 22px",pointerEvents:"none"}}/>
            <div style={{position:"relative",padding:"14px 18px"}}>
              <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:10}}>
                <span style={{fontSize:14,color:C.secondary[400]}}>✦</span>
                <span style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"rgba(255,255,255,0.5)",fontFamily:font}}>AI OB Diagnosis & Immediate Plan</span>
              </div>
              <div style={{fontSize:16,fontWeight:700,color:"#fff",fontFamily:font,marginBottom:4}}>{p.diagnosis}</div>
              {hgbDrop && <div style={{fontSize:12,color:C.secondary[400],fontFamily:font,marginBottom:10}}>Hgb drop {hgbDrop} g/dL · {p.gestAge}</div>}
              <div style={{display:"flex",gap:4,marginBottom:14}}>{p.icdCodes.map(c=><span key={c} style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.8)",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:4,padding:"2px 7px",fontFamily:font}}>{c}</span>)}</div>
              <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:12,marginBottom:12}}>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"rgba(255,255,255,0.6)",fontFamily:font,marginBottom:8}}>STAT Actions (Next 30 min)</div>
                {statActions.map((a,i) => (
                  <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
                    <div style={{width:18,height:18,borderRadius:"50%",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
                      <span style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.7)",fontFamily:font}}>{i+1}</span>
                    </div>
                    <span style={{fontSize:12,color:"rgba(255,255,255,0.8)",fontFamily:font,lineHeight:1.5}}>{a}</span>
                  </div>
                ))}
              </div>
              <div style={{borderTop:"1px solid rgba(255,255,255,0.1)",paddingTop:12}}>
                <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"rgba(255,255,255,0.6)",fontFamily:font,marginBottom:8}}>OB Transfusion Thresholds</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                  {thresholds.map(([label,val]) => (
                    <div key={label} style={{background:"rgba(0,0,0,0.2)",borderRadius:6,padding:"8px 10px"}}>
                      <div style={{fontSize:10,color:"rgba(255,255,255,0.6)",fontFamily:font,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:3}}>{label}</div>
                      <div style={{fontSize:12,fontWeight:700,color:"#fff",fontFamily:font}}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{background:C.success[100],border:"1px solid rgba(56,128,50,0.25)",borderRadius:10,padding:"12px 14px"}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:C.success[400],fontFamily:font,marginBottom:8}}>Evidence Base</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {Object.keys(evidenceStudies).map(e => (
                <button key={e} onClick={()=>send(`Summarize ${e}`)} style={{fontSize:12,fontWeight:600,color:C.success[400],background:"#fff",border:"1px solid rgba(56,128,50,0.3)",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontFamily:font}}>{e}</button>
              ))}
            </div>
          </div>
        </div>
      )}
      <div style={{background:"#fff",border:`1px solid ${C.grey[300]}`,borderRadius:12,display:"flex",flexDirection:"column",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)",minHeight:0}}>
        <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",gap:8,flexShrink:0,background:"#fff"}}>
          <div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${C.primary[600]},${C.secondary[500]})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><Pregnant size={14} color="#fff"/></div>
          <div>
            <div style={{fontSize:14,fontWeight:600,color:C.grey[800],fontFamily:font,lineHeight:1.2}}>OB CDS Chat</div>
            <div style={{display:"flex",alignItems:"center",gap:4,marginTop:1}}>
              <div style={{width:5,height:5,borderRadius:"50%",background:C.success[400]}}/>
              <span style={{fontSize:10,color:C.grey[500],fontFamily:font}}>HerCare Co-Pilot · Live</span>
            </div>
          </div>
          <div style={{marginLeft:"auto"}}>
            <button onClick={()=>setChatFullscreen(f=>!f)} style={{display:"flex",alignItems:"center",gap:4,background:"transparent",border:`1px solid ${C.grey[300]}`,borderRadius:6,padding:"4px 8px",cursor:"pointer",fontFamily:font,fontSize:10,color:C.grey[600],fontWeight:500}}>
              {chatFullscreen
                ? <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>Exit</>
                : <><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>Expand</>
              }
            </button>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 14px",display:"flex",flexDirection:"column",gap:16,background:C.grey[200]}}>
          {msgs.map((m,i) => (
            <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="ai"?"flex-start":"flex-end",gap:4}}>
              {m.role==="user" && <div style={{background:C.primary[600],color:"#fff",borderRadius:"18px 18px 4px 18px",padding:"9px 14px",fontSize:12,fontFamily:font,maxWidth:"88%",lineHeight:1.5,boxShadow:"0 1px 2px rgba(0,0,0,0.08)"}}>{m.text}</div>}
              {m.role==="ai" && (
                <div style={{display:"flex",gap:8,alignItems:"flex-start",width:"100%"}}>
                  <div style={{width:24,height:24,borderRadius:6,background:`linear-gradient(135deg,${C.primary[600]},${C.secondary[500]})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}><Pregnant size={11} color="#fff"/></div>
                  <div style={{flex:1,position:"relative"}}>
                    <div style={{background:"#fff",border:`1px solid ${C.grey[300]}`,borderRadius:"4px 18px 18px 18px",padding:"10px 14px",fontSize:12,lineHeight:1.7,fontFamily:font,color:C.grey[800],boxShadow:"0 1px 2px rgba(0,0,0,0.04)"}}>
                      {m.text.split('\n').map((line,li) => {
                        if(line===''){return <div key={li} style={{height:6}}/>;}
                        const parts = line.split(/(\*\*[^*]+\*\*)/g);
                        const rendered = parts.map((part,pi) => part.startsWith('**')&&part.endsWith('**') ? <strong key={pi} style={{fontWeight:600,color:C.grey[800]}}>{part.slice(2,-2)}</strong> : <span key={pi}>{part}</span>);
                        const isHeader = /^[🗒️🔑💡⚠️📊]/.test(line);
                        if(isHeader){return <div key={li} style={{fontSize:10,fontWeight:700,color:C.grey[500],textTransform:"uppercase",letterSpacing:"0.07em",marginTop:li>0?12:0,marginBottom:4,display:"flex",alignItems:"center",gap:4}}>{rendered}</div>;}
                        return <div key={li} style={{paddingRight:18}}>{rendered}</div>;
                      })}
                    </div>
                    <button onClick={()=>copyMsg(m.text)} title="Copy" style={{position:"absolute",bottom:8,right:8,background:"transparent",border:"none",cursor:"pointer",padding:3,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"center"}}>
                      {copied===m.text ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.success[400]} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg> : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.grey[500]} strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div style={{padding:"8px 14px 4px",display:"flex",flexWrap:"wrap",gap:6,background:"#fff",borderTop:`1px solid ${C.grey[300]}`}}>
          {["ACOG guidelines?","IV iron vs oral?","Delivery planning?"].map(q => (
            <button key={q} onClick={()=>send(q)} style={{fontSize:12,color:C.grey[700],background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:999,padding:"4px 12px",cursor:"pointer",fontFamily:font,fontWeight:500}}
              onMouseEnter={e=>{e.currentTarget.style.background=C.grey[300];}}
              onMouseLeave={e=>{e.currentTarget.style.background=C.grey[200];}}>
              {q}
            </button>
          ))}
        </div>
        <div style={{padding:"8px 14px 12px",background:"#fff",display:"flex",gap:8,alignItems:"flex-end"}}>
          <div style={{flex:1,display:"flex",alignItems:"center",background:C.grey[200],borderRadius:10,border:`1px solid ${C.grey[300]}`,overflow:"hidden",padding:"2px 4px 2px 12px"}}>
            <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()} placeholder="Ask about ACOG guidelines..." style={{flex:1,border:"none",background:"transparent",padding:"7px 4px",fontSize:12,outline:"none",fontFamily:font,color:C.grey[800]}}/>
          </div>
          <button onClick={()=>send()} style={{width:34,height:34,borderRadius:8,background:msg.trim()?C.primary[500]:C.grey[300],color:"#fff",border:"none",cursor:msg.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"background 0.15s"}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Care Plan Zone — BloodHealth styles, HerCare OB content ─────────
const CarePlanZone = ({p}) => {
  const [step, setStep]             = useState(0);
  const [approved, setApproved]     = useState(p.carePlanStatus==="generated");
  const [attestedDx, setAttestedDx] = useState(p.diagnosis);
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [paChecked, setPaChecked]   = useState(false);

  const steps = ["Diagnose","Care Recommendations"];
  const s = p.severity;

  const criteriaResults = [
    parseFloat(p.labs[0].value)<11,
    parseFloat(p.labs[1]?.value||99)<30,
    s==="Critical",
    true,
  ];
  const metCount = criteriaResults.filter(Boolean).length;
  const authPct  = Math.round((metCount/4)*100);

  // Step circle — exact BloodHealth style
  const SC = ({i}) => {
    const d=i<step, a=i===step;
    return <div style={{width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,flexShrink:0,fontFamily:font,border:`2px solid ${d?C.success[400]:a?C.primary[500]:C.grey[300]}`,background:d?C.success[400]:a?C.primary[500]:"#fff",color:d||a?"#fff":C.grey[500]}}>{d?"✓":i+1}</div>;
  };

  const drug = s==="Critical" ? "Ferric Carboxymaltose 1000mg IV — initiate within 24h, repeat in 7 days" : "Ferric Carboxymaltose 750mg IV — week 1 & 3";

  return (
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* ── Full-page success screen ── */}
      {approved && (
        <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#fff",padding:"40px 20px",textAlign:"center"}}>
          <div style={{width:80,height:80,borderRadius:"50%",background:C.success[100],border:`2px solid ${C.success[400]}`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:32}}><CheckCircle size={38} color={C.success[400]}/></div>
          <div style={{fontSize:32,fontWeight:700,color:C.grey[800],fontFamily:font,marginBottom:14}}>Care Recommendations Approved Successfully</div>
          <div style={{fontSize:16,color:C.grey[500],fontFamily:font,maxWidth:480,lineHeight:1.6}}>IV Iron order transmitted to pharmacy. Care team notified via Epic InBasket.</div>
        </div>
      )}

      {!approved && <>
      {/* ── Stepper — flat, full-width, no card wrapper ── */}
      <div style={{padding:"14px 20px 0",flexShrink:0,background:"#fff",borderBottom:`1px solid ${C.grey[300]}`}}>
        <div style={{display:"flex",alignItems:"center",paddingBottom:14}}>
          {steps.map((lbl,i) => (
            <div key={lbl} style={{display:"flex",alignItems:"center",flex:i<steps.length-1?1:0}}>
              <div style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer"}} onClick={()=>i<=step&&setStep(i)}>
                <SC i={i}/>
                <span style={{fontSize:12,fontWeight:600,fontFamily:font,whiteSpace:"nowrap",color:i<step?C.success[400]:i===step?C.grey[800]:C.grey[400]}}>{lbl}</span>
              </div>
              {i<steps.length-1 && <div style={{flex:1,height:2,background:i<step?C.success[400]:C.grey[300],margin:"0 10px"}}/>}
            </div>
          ))}
        </div>
      </div>

      {/* ── Step content — white, padded, scrollable ── */}
      <div style={{flex:1,overflowY:"auto",padding:"20px 24px 32px",background:"#fff"}}>

        {/* ══ STEP 0: DIAGNOSE ══ */}
        {step===0 && <div>
          <StepHeader eyebrow="AI Diagnosis & Recommendation" title="Review AI Diagnosis & Treatment"/>

          {/* AI gradient block — dark teal, exact BloodHealth style */}
          <div style={{background:`linear-gradient(135deg,${C.primary[600]},${C.primary[500]},${C.secondary[600]})`,borderRadius:10,padding:"16px 20px",marginBottom:20,position:"relative",overflow:"hidden"}}>
            <div style={{position:"absolute",inset:0,opacity:0.06,backgroundImage:"radial-gradient(rgba(255,255,255,0.9) 1px,transparent 1px)",backgroundSize:"22px 22px",pointerEvents:"none"}}/>
            <div style={{position:"relative"}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"rgba(255,255,255,0.5)",fontFamily:font,marginBottom:8}}>AI Diagnosis & Recommendation</div>
              <div style={{fontSize:16,fontWeight:700,color:"#fff",fontFamily:font,marginBottom:8}}>{p.diagnosis}</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,0.7)",fontFamily:font,lineHeight:1.6,marginBottom:14}}>
                Patient meets ACOG criteria: Hgb {p.labs[0].value} g/dL at {p.gestAge}, Ferritin {p.labs[1].value} ng/mL. Evidence-based protocol per ACOG Practice Bulletin #233 (2021) – Anemia in Pregnancy.
              </div>
              <div style={{display:"flex",gap:6}}>
                {p.icdCodes.map(c=>(
                  <span key={c} style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.85)",background:"rgba(255,255,255,0.12)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:4,padding:"2px 8px",fontFamily:font}}>{c}</span>
                ))}
              </div>
            </div>
          </div>

          {/* Clinical Criteria Met */}
          <div style={{marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:600,color:C.grey[800],fontFamily:font,marginBottom:8}}>ACOG Clinical Criteria Met</div>
            <div style={{background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:8,padding:"10px 14px",fontSize:14,color:C.grey[700],fontFamily:font,lineHeight:1.6}}>
              Pregnant patient, Hgb &lt;11 g/dL (1st/3rd trimester) or &lt;10.5 g/dL (2nd trimester), Ferritin &lt;30 ng/mL
            </div>
          </div>

          <EvidenceBox refs={[
            {title:"ACOG Practice Bulletin #233 (2021)",description:"Anemia in Pregnancy — IV iron preferred for moderate-severe"},
            {title:"ACOG Safe Motherhood Initiative",description:"Severe Maternal Morbidity Prevention"},
            {title:"WHO Anemia Guidelines for Pregnancy",description:"Hgb ≥11 g/dL target for pregnant women"},
            {title:"NEJM 2015 – Breymann et al.",description:"IV iron achieves target Hgb 2–3 weeks faster than oral"},
          ]}/>

          {/* Attested Diagnosis */}
          <div style={{marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:700,color:C.grey[800],fontFamily:font,marginBottom:6}}>
              Attested Diagnosis <span style={{fontSize:12,fontWeight:400,color:C.secondary[500],marginLeft:4}}>(editable)</span>
            </div>
            <input value={attestedDx} onChange={e=>setAttestedDx(e.target.value)} style={{width:"100%",boxSizing:"border-box",border:`1px solid ${C.grey[300]}`,borderRadius:8,padding:"10px 14px",fontSize:14,fontFamily:font,color:C.grey[800],outline:"none",background:"#fff"}}/>
          </div>

          {/* Clinical Notes */}
          <div style={{marginBottom:20}}>
            <div style={{fontSize:14,fontWeight:700,color:C.grey[800],fontFamily:font,marginBottom:6}}>
              Clinical Notes <span style={{fontSize:12,fontWeight:400,color:C.grey[500],marginLeft:4}}>(optional)</span>
            </div>
            <textarea value={clinicalNotes} onChange={e=>setClinicalNotes(e.target.value)} placeholder="Add any modifications or clinical reasoning..." rows={3} style={{width:"100%",boxSizing:"border-box",border:`1px solid ${C.grey[300]}`,borderRadius:8,padding:"9px 12px",fontSize:14,fontFamily:font,color:C.grey[800],resize:"vertical",outline:"none"}}/>
          </div>

          <StepActions onNext={()=>setStep(1)} nextLabel="Attest →"/>
        </div>}

        {/* ══ STEP 1: CARE PLAN ══ */}
        {step===1 && <div>
          <StepHeader eyebrow="Evidence-Based Care Recommendations" title="ACOG Evidence-Based Care Recommendations"/>

          {/* Treatment Goals — grey-200 box, same as BloodHealth */}
          <div style={{background:C.grey[200],borderRadius:8,padding:"10px 14px",marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.07em",color:C.grey[500],fontFamily:font,marginBottom:6}}>Treatment Goals</div>
            <div style={{fontSize:14,color:C.grey[800],fontFamily:font,lineHeight:1.5}}>
              {s==="Critical" ? "Achieve Hgb ≥11 g/dL before delivery, reduce SMM risk, prevent PPH" : "Optimize Hgb ≥11 g/dL by 34 weeks, Ferritin >30 ng/mL, prevent peripartum transfusion"}
            </div>
          </div>

          {/* Interventions — accent-bar cards, BloodHealth style */}
          <div style={{fontSize:14,fontWeight:700,color:C.grey[800],fontFamily:font,marginBottom:12}}>Interventions</div>
          <div style={{border:`1px solid ${C.grey[300]}`,borderRadius:12,overflow:"hidden",marginBottom:20}}>
            {[
              {num:"1. Medication Order", title:s==="Critical"?"IV Iron — Ferric Carboxymaltose 1000mg STAT":"IV Iron — Ferric Carboxymaltose 750mg × 2", detail:drug},
              {num:"2. Monitoring",       title:"Lab Monitoring", detail:"CBC at 2–4 weeks, Ferritin at 6 weeks, Target Hgb >11 g/dL by 34 weeks"},
              {num:"3. Specialist",       title:s==="Critical"?"MFM Consultation — STAT":"MFM Consultation — within 2 weeks", detail:`Maternal Health Risk Score ${p._mhr.score} — ${p._mhr.cat}`},
            ].map(({num,title,detail},i,arr) => (
              <div key={num} style={{display:"flex",borderBottom:i<arr.length-1?`1px solid ${C.grey[300]}`:"none"}}>
                <div style={{width:3,background:C.primary[500],flexShrink:0}}/>
                <div style={{flex:1,padding:"12px 16px"}}>
                  <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:C.grey[500],fontFamily:font,marginBottom:4}}>{num}</div>
                  <div style={{fontSize:14,fontWeight:600,color:C.grey[800],fontFamily:font,marginBottom:3}}>{title}</div>
                  <div style={{fontSize:14,color:C.grey[600],fontFamily:font}}>{detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Evidence Base — EvidenceBox component */}
          <EvidenceBox refs={[
            {title:"ACOG Practice Bulletin #233 (2021)",description:"Anemia in Pregnancy — IV iron preferred for moderate-severe"},
            {title:"ACOG Safe Motherhood Initiative",description:"Optimizing Hgb before delivery reduces transfusion 60–70%"},
            {title:"WHO Anemia Guidelines for Pregnancy",description:"Hgb ≥11 g/dL target for pregnant women"},
            {title:"NEJM 2015 – Breymann et al.",description:"IV iron achieves target Hgb 2–3 weeks faster than oral"},
          ]}/>

          {/* Clinical Review Required — yellow box */}
          <div style={{background:C.yellow[100],border:`1px solid ${C.yellow[400]}55`,borderRadius:8,padding:"10px 14px",marginBottom:20}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:"#92600A",fontFamily:font,marginBottom:3}}>Clinical Review Required</div>
            <div style={{fontSize:12,color:"#92600A",fontFamily:font,lineHeight:1.5}}>Please review for patient-specific contraindications, gestational age considerations, and drug interactions before approval.</div>
          </div>

          {/* Prior Authorization Assessment */}
          <div style={{background:"#fff",border:`1px solid ${C.grey[300]}`,borderRadius:12,padding:"14px 16px",marginBottom:20}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:paChecked?16:8}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <span style={{fontSize:14}}>📋</span>
                <div>
                  <span style={{fontSize:12,fontWeight:700,color:C.grey[700],fontFamily:font,textTransform:"uppercase",letterSpacing:"0.04em"}}>Prior Authorization Assessment</span>
                  <div style={{fontSize:12,color:C.grey[700],fontFamily:font,marginTop:2}}>LCD Criteria Met: {metCount}/4</div>
                </div>
              </div>
              {!paChecked && <button onClick={()=>setPaChecked(true)} style={{background:C.orange[400],color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:font}}>Run PA Check</button>}
            </div>
            {!paChecked && <div style={{fontSize:12,color:C.grey[500],fontFamily:font,textAlign:"center"}}>Click "Run PA Check" to assess prior authorization probability based on LCD criteria</div>}
            {paChecked && (
              <div>
                {/* Green hero — Image 2 style */}
                <div style={{background:C.success[100],border:`1px solid rgba(56,128,50,0.2)`,borderRadius:8,padding:"24px 20px",marginBottom:14,textAlign:"center"}}>
                  <div style={{fontSize:30,fontWeight:500,color:C.success[400],fontFamily:font,lineHeight:1,marginBottom:6}}>{authPct}%</div>
                  <div style={{fontSize:14,fontWeight:700,color:C.success[400],fontFamily:font,marginBottom:4}}>AI Probability of Approval</div>
                  <div style={{fontSize:12,color:C.success[400],fontFamily:font,marginBottom:14}}>High likelihood — documentation is strong.</div>
                  <div style={{background:"rgba(56,128,50,0.2)",borderRadius:999,height:6,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${authPct}%`,background:C.success[400],borderRadius:999}}/>
                  </div>
                </div>
                {/* Clinical Evidence — white box, bold labels, Image 1 & 3 style */}
                <div style={{background:"#fff",border:`1px solid ${C.grey[300]}`,borderRadius:8,padding:"14px 16px",marginBottom:14}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.grey[800],fontFamily:font,marginBottom:12}}>Clinical Evidence</div>
                  {[
                    ["Hemoglobin",`${p.labs[0].value} g/dL at ${p.gestAge} – Meets ACOG threshold`],
                    ["Ferritin",`${p.labs[1].value} ng/mL – Meets threshold`],
                    ["Pregnancy",`Gestational age ${p.gestAge}, ${p.parity}`],
                    ["Indication",`${attestedDx.split("–")[0].trim()} per ACOG Practice Bulletin #233`],
                  ].map(([k,v])=>(
                    <div key={k} style={{fontSize:14,color:C.grey[700],fontFamily:font,marginBottom:8,lineHeight:1.5}}>
                      <strong style={{color:C.grey[800]}}>{k}:</strong> {v}
                    </div>
                  ))}
                </div>
                {/* References — EvidenceBox green */}
                <EvidenceBox refs={[{title:"NCD 110.21 – Treatment of Iron Deficiency Anemia"},{title:"LCD L35012 – Intravenous Iron Therapy / ACOG Practice Bulletin #233"}]}/>
              </div>
            )}
          </div>

          <StepActions onBack={()=>setStep(0)} onNext={()=>setApproved(true)} nextLabel="Approve & Transmit to Pharmacy →"/>
        </div>}

      </div>
      </>}
    </div>
  );
};

// ── IQ Assistant chat panel — slides in from right ────────────────
const IQAssistantPanel = ({p, onClose, expanded, onToggleExpand}) => {
  const [msg, setMsg]   = useState("");
  const [msgs, setMsgs] = useState([{role:"ai", text:`IQ Assistant ready for ${p.name} (${p.parity}, ${p.gestAge}). Ask about ACOG guidelines, IV iron therapy, or delivery planning.`}]);
  const send = (q) => {
    const t=(q||msg).trim(); if(!t) return; setMsg("");
    setMsgs(m=>[...m,{role:"user",text:t}]);
    setTimeout(()=>{
      setMsgs(m=>[...m,{role:"ai",text:`Based on ACOG PB #233 and ${p.name}'s profile — recommended: ${p.order}. ${p.severity==="Critical"?"Immediate IV iron intervention warranted.":"Optimization window remains open — act within 14 days."}`}]);
    },500);
  };
  const w = expanded ? 520 : 340;
  return (
    <div style={{width:w,flexShrink:0,background:"#fff",borderLeft:`1px solid ${C.grey[300]}`,display:"flex",flexDirection:"column",overflow:"hidden",transition:"width 0.2s ease",zIndex:10}}>
      {/* Header */}
      <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",gap:8,flexShrink:0,background:"#fff"}}>
        <div style={{width:28,height:28,borderRadius:8,background:`linear-gradient(135deg,${C.primary[600]},${C.secondary[600]})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <span style={{fontSize:12,color:"#fff",fontWeight:700}}>✦</span>
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:14,fontWeight:700,color:C.grey[800],fontFamily:font}}>IQ Assistant</div>
          <div style={{display:"flex",alignItems:"center",gap:4}}>
            <div style={{width:5,height:5,borderRadius:"50%",background:C.success[400]}}/>
            <span style={{fontSize:10,color:C.grey[500],fontFamily:font}}>HerCare Co-Pilot · Live</span>
          </div>
        </div>
        <button onClick={onToggleExpand} title={expanded?"Collapse":"Expand"} style={{width:26,height:26,borderRadius:6,background:C.grey[200],border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.grey[600]} strokeWidth="2.5" strokeLinecap="round">
            {expanded
              ? <><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></>
              : <><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></>}
          </svg>
        </button>
        <button onClick={onClose} style={{width:26,height:26,borderRadius:6,background:C.grey[200],border:"none",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:14,color:C.grey[600],fontFamily:font}}>✕</button>
      </div>
      {/* Messages */}
      <div style={{flex:1,overflowY:"auto",padding:"12px 14px",display:"flex",flexDirection:"column",gap:12,background:C.grey[200]}}>
        {msgs.map((m,i) => (
          <div key={i} style={{display:"flex",flexDirection:"column",alignItems:m.role==="ai"?"flex-start":"flex-end"}}>
            {m.role==="user"
              ? <div style={{background:C.primary[600],color:"#fff",borderRadius:"14px 14px 3px 14px",padding:"8px 12px",fontSize:12,fontFamily:font,maxWidth:"88%",lineHeight:1.5}}>{m.text}</div>
              : <div style={{display:"flex",gap:7,alignItems:"flex-start",width:"100%"}}>
                  <div style={{width:22,height:22,borderRadius:6,background:`linear-gradient(135deg,${C.primary[600]},${C.secondary[600]})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2}}>
                    <span style={{fontSize:10,color:"#fff",fontWeight:700}}>✦</span>
                  </div>
                  <div style={{background:"#fff",border:`1px solid ${C.grey[300]}`,borderRadius:"3px 14px 14px 14px",padding:"9px 12px",fontSize:12,lineHeight:1.7,fontFamily:font,color:C.grey[800],flex:1}}>{m.text}</div>
                </div>}
          </div>
        ))}
      </div>
      {/* Quick prompts */}
      <div style={{padding:"7px 14px 5px",display:"flex",flexWrap:"wrap",gap:5,background:"#fff",borderTop:`1px solid ${C.grey[300]}`}}>
        {["ACOG guidelines?","IV iron vs oral?","Delivery planning?","Transfusion risk?"].map(q => (
          <button key={q} onClick={()=>send(q)} style={{fontSize:10,color:C.grey[700],background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:999,padding:"3px 10px",cursor:"pointer",fontFamily:font,fontWeight:500}}
            onMouseEnter={e=>{e.currentTarget.style.background=C.grey[300];}} onMouseLeave={e=>{e.currentTarget.style.background=C.grey[200];}}>{q}</button>
        ))}
      </div>
      {/* Input */}
      <div style={{padding:"7px 14px 10px",background:"#fff",display:"flex",gap:7,alignItems:"flex-end"}}>
        <div style={{flex:1,display:"flex",alignItems:"center",background:C.grey[200],borderRadius:10,border:`1px solid ${C.grey[300]}`,overflow:"hidden",padding:"2px 4px 2px 12px"}}>
          <input value={msg} onChange={e=>setMsg(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
            placeholder="Ask about this patient…"
            style={{flex:1,border:"none",background:"transparent",padding:"6px 4px",fontSize:12,outline:"none",fontFamily:font,color:C.grey[800]}}/>
        </div>
        <button onClick={()=>send()} style={{width:32,height:32,borderRadius:8,background:msg.trim()?C.primary[600]:C.grey[300],color:"#fff",border:"none",cursor:msg.trim()?"pointer":"default",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:msg.trim()?"0 2px 6px rgba(23,79,98,0.4),inset 0 1px 0 rgba(255,255,255,0.12)":"none",transition:"background 0.15s,box-shadow 0.15s"}}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  );
};

// ── Patient Header — episode-scoped, shown across all tabs ───────
const PatientHeader = ({p, episode, onOpenIQ}) => {
  const ep = episode || getEpisode(null);
  const mhr = p._mhr;
  const tier = getMaternalRiskTier(mhr.score);
  const ga = episode ? gestationalAge(episode) : null;
  const gaLabel = ga ? (ga.postpartum ? `${ga.weeks} weeks postpartum` : `${ga.weeks}w${ga.days}d`) : p.gestAge;
  return (
    <div style={{background:"#fff",borderBottom:`1px solid ${C.grey[300]}`,flexShrink:0,padding:"12px 20px",display:"flex",alignItems:"center",gap:16}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
          <span style={{fontSize:18,fontWeight:700,color:C.grey[800],fontFamily:font}}>{p.name}</span>
          {episode && episode.status==="postpartum" && <span style={{fontSize:10,fontWeight:600,color:C.secondary[500],background:C.secondary[100],border:`1px solid ${C.secondary[300]}`,borderRadius:4,padding:"2px 7px",fontFamily:font}}>Postpartum</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:0,flexWrap:"wrap"}}>
          <Stethoscope size={11} color={C.grey[500]}/><span style={{fontSize:12,fontWeight:600,color:C.grey[700],fontFamily:font}}>{p.provider}</span>
          <span style={{fontSize:12,color:C.grey[400],margin:"0 2px"}}>·</span>
          <Hash size={11} color={C.grey[500]}/><span style={{fontSize:12,color:C.grey[700],fontFamily:font}}>MRN {p.id}</span>
          <span style={{fontSize:12,color:C.grey[400],margin:"0 2px"}}>·</span>
          <User size={11} color={C.grey[500]}/><span style={{fontSize:12,color:C.grey[700],fontFamily:font}}>Age {p.age}</span>
          <span style={{fontSize:12,color:C.grey[400],margin:"0 2px"}}>·</span>
          <span style={{fontSize:12,fontWeight:700,color:C.grey[700],fontFamily:font}}>GA</span><span style={{fontSize:12,color:C.grey[700],fontFamily:font,marginLeft:3}}>{gaLabel}</span>
          <span style={{fontSize:12,color:C.grey[400],margin:"0 2px"}}>·</span>
          <span style={{fontSize:12,fontWeight:700,color:C.grey[700],fontFamily:font}}>EDD</span><span style={{fontSize:12,color:C.grey[700],fontFamily:font,marginLeft:3}}>{episode?formatDate(episode.edd):p.edd}</span>
          <span style={{fontSize:12,color:C.grey[400],margin:"0 2px"}}>·</span>
          <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>Obstetric History</span><span style={{fontSize:12,fontWeight:600,color:C.grey[700],fontFamily:font,marginLeft:3}}>{episode?`G${episode.gravida}P${episode.para}`:p.parity}</span>
          <span style={{fontSize:12,color:C.grey[400],margin:"0 2px"}}>·</span>
          <span style={{fontSize:12,fontWeight:700,color:tier.color,fontFamily:font}}>Risk {mhr.score}/74</span><span style={{fontSize:11,fontWeight:600,color:tier.color,background:tier.color+"22",borderRadius:4,padding:"1px 6px",fontFamily:font,marginLeft:4}}>{tier.label}</span>
        </div>
      </div>
      {/* IQ Assistant button — matches screenshot: flat teal, pill radius */}
      <button onClick={onOpenIQ}
        style={{display:"flex",alignItems:"center",gap:8,background:`linear-gradient(135deg,${C.primary[600]},${C.primary[500]},${C.secondary[600]})`,border:"none",borderRadius:12,padding:"10px 20px",cursor:"pointer",flexShrink:0,boxShadow:"0 3px 10px rgba(23,79,98,0.4)",transition:"box-shadow 0.15s,transform 0.1s"}}
        onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 5px 16px rgba(23,79,98,0.5)";e.currentTarget.style.transform="translateY(-1px)";}}
        onMouseLeave={e=>{e.currentTarget.style.boxShadow="0 3px 10px rgba(23,79,98,0.4)";e.currentTarget.style.transform="translateY(0)";}}
      >
        <span style={{fontSize:14,color:"#fff",lineHeight:1}}>✦</span>
        <span style={{fontSize:14,fontWeight:600,color:"#fff",fontFamily:font,whiteSpace:"nowrap",letterSpacing:"0.01em"}}>IQ Assistant</span>
      </button>
    </div>
  );
};

// ── Zone Tabs (AI Summary tab removed — chat is now global) ──────
const ZoneTabs = ({active,onChange}) => (
  <div style={{background:C.grey[100],borderBottom:`1px solid ${C.grey[300]}`,display:"flex",padding:"0 20px",flexShrink:0}}>
    {[{id:"overview",label:"Clinical Decision Support",Icon:User},{id:"cp",label:"Optimization Recommendations",Icon:ClipboardList},{id:"visits",label:"Visits",Icon:CalendarDays}].map(({id,label,Icon}) => {
      const a = active===id;
      return <div key={id} onClick={()=>onChange(id)} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px 9px",borderBottom:a?`2px solid ${C.primary[500]}`:"2px solid transparent",cursor:"pointer",fontSize:14,fontWeight:a?600:400,color:a?C.grey[800]:C.grey[500],fontFamily:font,marginBottom:-1,transition:"all 0.12s",whiteSpace:"nowrap"}}><Icon size={14} strokeWidth={1.5} color={a?C.primary[500]:C.grey[500]}/>{label}</div>;
    })}
  </div>
);



// ── Patient Workspace (same structure as BloodHealth) ─────────────
const PatientWorkspace = ({patient,allPatients,episodeId,onBack,onSelectPatient,defaultZone="overview"}) => {
  const [zone, setZone]         = useState(defaultZone==="ai"?"overview":defaultZone);
  const [iqOpen, setIqOpen]     = useState(false);
  const [iqExpanded, setIqExpanded] = useState(false);
  const episode = episodeId ? getEpisode(episodeId) : null;
  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0,fontFamily:font,background:C.grey[200]}}>
      {/* Top nav */}
      <div style={{height:56,flexShrink:0,background:C.grey[100],borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",padding:"0 24px"}}>
        <button onClick={onBack} style={{display:"flex",alignItems:"center",gap:4,background:"transparent",border:"none",cursor:"pointer",fontFamily:font,fontSize:12,fontWeight:600,color:C.grey[600],marginRight:16}}>
          <ChevronLeft size={14} strokeWidth={2.5} color={C.grey[500]}/>
          Worklist
        </button>
        <div style={{width:"0.5px",height:20,background:C.grey[300],marginRight:16}}/>
        <div style={{display:"flex",alignItems:"center",gap:4,background:C.grey[200],borderRadius:8,padding:4}}>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,opacity:0.5,cursor:"default"}}>
            <BloodDrop size={13} color={C.grey[500]}/>
            <span style={{fontSize:12,fontWeight:400,color:C.grey[500],fontFamily:font}}>Anemia Management</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,background:C.grey[100],boxShadow:"0 1px 4px rgba(0,0,0,0.08)",border:`1px solid ${C.grey[300]}`}}>
            <Pregnant size={13} color={C.hc[400]}/>
            <span style={{fontSize:12,fontWeight:600,color:C.grey[800],fontFamily:font}}>HerCare Co-Pilot</span>
          </div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:C.success[400],boxShadow:`0 0 6px ${C.success[400]}`}}/><span style={{fontSize:12,color:C.success[400],fontFamily:font}}>FHIR R4 Live</span></div>
      </div>
      <div style={{display:"flex",flex:1,overflow:"hidden"}}>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <PatientHeader p={patient} episode={episode} onOpenIQ={()=>setIqOpen(o=>!o)}/>
          <ZoneTabs active={zone} onChange={setZone}/>
          <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
              {zone==="overview" && <OverviewZone p={patient} onNavigate={setZone}/>}
              {zone==="cp"       && <CarePlanZone p={patient}/>}
              {zone==="visits"   && <VisitsZone p={patient} episode={episode}/>}
            </div>
            {iqOpen && <IQAssistantPanel p={patient} onClose={()=>setIqOpen(false)} expanded={iqExpanded} onToggleExpand={()=>setIqExpanded(e=>!e)}/>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Visit Detail Modal (opens from Visits tab; returns without losing place) ──
const VisitDetailModal = ({visit, episode, onClose}) => {
  if (!visit) return null;
  const isFuture = visit.status === "scheduled";
  const isPast = visit.status === "completed";
  const ga = episode ? gaAtVisit(episode, visit.date) : null;
  const gaText = ga ? (ga.postpartum ? `${ga.weeks}w postpartum` : ga.label) : "—";

  const Section = ({label, children}) => (
    <div style={{marginBottom:14}}>
      <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>{label}</div>
      {children}
    </div>
  );

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{width:560,maxHeight:"88vh",background:C.grey[100],borderRadius:16,display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>

        {/* Header */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",gap:12,flexShrink:0,background:"#fff"}}>
          <div style={{width:36,height:36,borderRadius:10,background:isFuture?C.primary[100]:C.grey[200],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            {isFuture ? <CalendarDays size={18} color={C.primary[500]}/> : <CheckCircle2 size={18} color={C.success[400]}/>}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,color:C.grey[800],fontFamily:font,lineHeight:1.2}}>{visit.type}</div>
            <div style={{fontSize:12,color:C.grey[600],fontFamily:font,marginTop:2}}>{formatDate(visit.date)} · {gaText} · {visit.provider}</div>
          </div>
          <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:isFuture?C.primary[500]:C.success[400],background:isFuture?C.primary[100]:C.success[100],borderRadius:4,padding:"3px 8px",fontFamily:font}}>{isFuture?"Scheduled":"Completed"}</span>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:C.grey[200],border:"none",color:C.grey[600],fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:font,lineHeight:1}}><X size={16}/></button>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"18px 20px",background:"#fff"}}>
          <Section label="Location">
            <div style={{display:"flex",alignItems:"center",gap:6,fontSize:13,color:C.grey[700],fontFamily:font}}>
              <MapPin size={13} color={C.grey[500]}/>{visit.location}
            </div>
          </Section>

          {visit.reason && (
            <Section label="Reason / Purpose">
              <div style={{fontSize:13,color:C.grey[700],fontFamily:font,lineHeight:1.5}}>{visit.reason}</div>
            </Section>
          )}

          {visit.orders && visit.orders.length > 0 && (
            <Section label={`Orders Requested (${visit.orders.length})`}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {visit.orders.map((o,i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:13,color:C.grey[700],fontFamily:font,padding:"6px 10px",background:C.grey[200],borderRadius:6}}>
                    <ClipboardList size={13} color={C.primary[500]} style={{flexShrink:0}}/>{o.label || o}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {isPast && visit.results && visit.results.length > 0 && (
            <Section label={`Results (${visit.results.length})`}>
              <div style={{display:"flex",flexDirection:"column",gap:5}}>
                {visit.results.map((r,i) => {
                  const flagColor = r.flag==="critical"?C.error[400]:r.flag==="high"?C.orange[400]:r.flag==="low"?C.grey[600]:C.success[400];
                  return (
                    <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:13,fontFamily:font,padding:"6px 10px",background:C.grey[200],borderRadius:6}}>
                      <span style={{color:C.grey[700]}}>{r.label}</span>
                      <span style={{fontWeight:600,color:flagColor}}>{r.value} <span style={{fontSize:10,textTransform:"uppercase",fontWeight:700}}>{r.flag}</span></span>
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          {visit.followUpReason && (
            <Section label="Follow-up Reason">
              <div style={{fontSize:13,color:C.grey[700],fontFamily:font,lineHeight:1.5}}>{visit.followUpReason}</div>
            </Section>
          )}

          {visit.summary && (
            <Section label="Summary">
              <div style={{fontSize:13,color:C.grey[700],fontFamily:font,lineHeight:1.5,background:C.grey[200],borderRadius:8,padding:"10px 12px"}}>{visit.summary}</div>
            </Section>
          )}

          {/* Stubbed Epic link */}
          <div style={{marginTop:8}}>
            <a href="#" onClick={e=>e.preventDefault()} style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:12,fontWeight:600,color:C.primary[500],fontFamily:font,textDecoration:"none"}}>
              <ExternalLink size={13}/> View in Epic
            </a>
          </div>

          {/* Future visit stubbed actions */}
          {isFuture && (
            <div style={{marginTop:18,padding:"14px",background:C.grey[200],borderRadius:10,border:`1px dashed ${C.grey[400]}`}}>
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:C.grey[500],fontFamily:font,marginBottom:10}}>Visit Actions</div>
              <div style={{display:"flex",gap:8}}>
                {["Reschedule","Cancel","Confirm"].map(action => (
                  <button key={action} disabled style={{display:"flex",alignItems:"center",gap:5,background:C.grey[300],color:C.grey[500],border:"none",borderRadius:6,padding:"7px 14px",fontSize:12,fontWeight:600,cursor:"not-allowed",fontFamily:font,opacity:0.7}}>
                    {action}
                    <span style={{fontSize:9,fontWeight:400,fontStyle:"italic"}}>soon</span>
                  </button>
                ))}
              </div>
              <div style={{fontSize:11,color:C.grey[500],fontFamily:font,marginTop:8,fontStyle:"italic"}}>Write-back to Epic is coming soon — actions are not yet active in this prototype.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Visits Zone — Next / Future / Past for the selected episode ────
const VisitsZone = ({p, episode}) => {
  const [selectedVisit, setSelectedVisit] = useState(null);
  const ep = episode;
  const allVisits = ep ? visitsForEpisode(ep.id) : [];
  const nv = nextVisit(allVisits);
  const future = futureVisits(allVisits);
  const past = pastVisits(allVisits);

  const SectionHeader = ({label, count, icon}) => (
    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:10}}>
      {icon}
      <span style={{fontSize:14,fontWeight:700,color:C.grey[800],fontFamily:font}}>{label}</span>
      {count != null && <span style={{fontSize:11,color:C.grey[500],fontFamily:font,fontWeight:600}}>{count}</span>}
    </div>
  );

  const VisitRow = ({v, isNext=false}) => {
    const ga = ep ? gaAtVisit(ep, v.date) : null;
    const gaText = ga ? (ga.postpartum ? `${ga.weeks}w PP` : ga.label) : "";
    const isPastVisit = v.status === "completed";
    return (
      <div onClick={()=>setSelectedVisit(v)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:isNext?C.primary[100]:"#fff",border:`1px solid ${isNext?C.primary[300]:C.grey[300]}`,borderRadius:isNext?10:8,cursor:"pointer",transition:"box-shadow 0.12s",marginBottom:isNext?0:6}}
        onMouseEnter={e=>{e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)";}}
        onMouseLeave={e=>{e.currentTarget.style.boxShadow="none";}}>
        {isNext && <div style={{width:4,alignSelf:"stretch",background:C.primary[500],borderRadius:2,flexShrink:0}}/>}
        <div style={{flexShrink:0,minWidth:110}}>
          <div style={{fontSize:13,fontWeight:700,color:isNext?C.primary[600]:C.grey[800],fontFamily:font}}>{formatDate(v.date)}</div>
          {isPastVisit && gaText && <div style={{fontSize:11,color:C.grey[500],fontFamily:font,marginTop:2}}>{gaText}</div>}
        </div>
        <div style={{width:"1px",alignSelf:"stretch",background:C.grey[300],flexShrink:0}}/>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
            <span style={{fontSize:13,fontWeight:600,color:C.secondary[500],fontFamily:font}}>{v.type}</span>
            {isNext && <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:C.primary[500],background:C.primary[100],borderRadius:3,padding:"1px 5px",fontFamily:font}}>Next</span>}
          </div>
          <div style={{fontSize:12,color:C.grey[600],fontFamily:font,lineHeight:1.4,marginBottom:2}}>{visitOneLiner(v)}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,fontSize:11,color:C.grey[500],fontFamily:font}}>
            <span style={{display:"flex",alignItems:"center",gap:3}}><User size={10}/>{v.provider}</span>
            <span style={{display:"flex",alignItems:"center",gap:3}}><MapPin size={10}/>{v.location}</span>
          </div>
        </div>
        <ChevronDown size={14} color={C.grey[400]} style={{transform:"rotate(-90deg)",flexShrink:0}}/>
      </div>
    );
  };

  return (
    <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:18}}>

      {/* NEXT VISIT */}
      <div>
        <SectionHeader label="Next Visit" icon={<Clock size={15} color={C.primary[500]}/>}/>
        {nv ? (
          <VisitRow v={nv} isNext={true}/>
        ) : (
          <div style={{padding:"14px 16px",background:C.orange[100],border:`1px solid ${C.orange[400]}55`,borderRadius:8,display:"flex",alignItems:"center",gap:8}}>
            <AlertCircle size={15} color={C.orange[400]}/>
            <span style={{fontSize:13,fontWeight:600,color:C.orange[400],fontFamily:font}}>No upcoming visit — scheduling gap to chase</span>
          </div>
        )}
      </div>

      {/* FUTURE VISITS */}
      <div>
        <SectionHeader label="Future Visits" count={future.length} icon={<CalendarDays size={15} color={C.secondary[500]}/>}/>
        {future.length === 0 ? (
          <div style={{padding:"14px 16px",background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:8,fontSize:13,color:C.grey[500],fontFamily:font}}>No upcoming visits</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {future.map(v => <VisitRow key={v.id} v={v}/>)}
          </div>
        )}
      </div>

      {/* PAST VISITS */}
      <div>
        <SectionHeader label="Past Visits" count={past.length} icon={<CheckCircle2 size={15} color={C.success[400]}/>}/>
        {past.length === 0 ? (
          <div style={{padding:"14px 16px",background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:8,fontSize:13,color:C.grey[500],fontFamily:font}}>No past visits</div>
        ) : (
          <div style={{display:"flex",flexDirection:"column",gap:6}}>
            {past.map(v => <VisitRow key={v.id} v={v}/>)}
          </div>
        )}
      </div>

      {selectedVisit && <VisitDetailModal visit={selectedVisit} episode={ep} onClose={()=>setSelectedVisit(null)}/>}
    </div>
  );
};

// ── Worklist Row (same columns as BloodHealth, OB data) ───────────
const PatientRow = ({p, onOpen, onOpenACOG}) => {
  const ferC = p.labs[1].status==="critical"?C.error[400]:p.labs[1].status==="high"||p.labs[1].status==="borderline"?C.orange[400]:C.grey[600];
  const ep = p._ep;
  const nv = ep ? ep.nextVisit : null;
  const noUpcoming = ep && ep.hasNoUpcoming;
  return (
    <>
      <tr style={{borderBottom:`1px solid ${C.grey[300]}`,cursor:"pointer",background:noUpcoming?C.orange[100]:"transparent"}} onMouseEnter={e=>e.currentTarget.style.background=noUpcoming?C.orange[100]:C.grey[200]} onMouseLeave={e=>e.currentTarget.style.background=noUpcoming?C.orange[100]:"transparent"} onClick={()=>onOpen(p,"overview",ep?.id)}>

        {/* PATIENT */}
        <td style={{padding:"12px 16px",minWidth:190}}>
          <span style={{fontSize:14,fontWeight:600,color:C.grey[800],fontFamily:font,display:"block",marginBottom:2}}>{p.name}</span>
          <span style={{fontSize:12,color:C.grey[500],fontFamily:font,display:"block",marginBottom:3}}>MRN {p.id} · Age {p.age}</span>
          <span style={{fontSize:12,color:C.grey[700],fontFamily:font,display:"block",marginBottom:2}}><strong style={{fontWeight:700}}>EDD</strong> {formatDate(ep?ep.edd:p.edd)}</span>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontWeight:600,color:C.grey[700],background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:4,padding:"2px 6px",fontFamily:font}}>{ep?ep.parityLabel:p.parity}</span>
            <span style={{fontSize:10,fontWeight:600,color:C.grey[700],background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:4,padding:"2px 6px",fontFamily:font}}>{ep?ep.gaLabel:p.gestAge.replace(" wks","W")}</span>
            <span style={{fontSize:10,fontWeight:600,color:C.grey[700],background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:4,padding:"2px 6px",fontFamily:font}}>{ep?ep.obType:p.caseType}</span>
            {ep && ep.status==="postpartum" && ep.obType!=="Postpartum" && <span style={{fontSize:10,fontWeight:600,color:C.secondary[500],background:C.secondary[100],border:`1px solid ${C.secondary[300]}`,borderRadius:4,padding:"2px 6px",fontFamily:font}}>Postpartum</span>}
          </div>
        </td>

        {/* NEXT VISIT */}
        <td style={{padding:"12px 16px",minWidth:200}}>
          {noUpcoming ? (
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:C.orange[400],flexShrink:0,boxShadow:`0 0 5px ${C.orange[400]}`}}/>
              <span style={{fontSize:13,fontWeight:600,color:C.orange[400],fontFamily:font}}>No upcoming visit</span>
            </div>
          ) : nv ? (
            <div>
              <div style={{fontSize:13,fontWeight:600,color:C.grey[800],fontFamily:font,marginBottom:2}}>{formatDate(nv.date)}</div>
              <div style={{fontSize:12,color:C.secondary[500],fontFamily:font,fontWeight:600,marginBottom:1}}>{nv.type}</div>
              <div style={{fontSize:11,color:C.grey[600],fontFamily:font}}>{nv.provider}</div>
              <div style={{fontSize:11,color:C.grey[500],fontFamily:font}}>{nv.location}</div>
            </div>
          ) : <span style={{fontSize:13,color:C.grey[400],fontFamily:font}}>—</span>}
        </td>

        {/* LAB VALUES */}
        <td style={{padding:"12px 16px",minWidth:190}}>
          <div style={{display:"flex",gap:14}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:C.grey[600],textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:font,marginBottom:3}}>HGB</div>
              <div style={{display:"flex",alignItems:"baseline",gap:2}}><span style={{fontSize:20,fontWeight:700,color:getAnemiaGrade(p.labs[0].value).color,fontFamily:font,letterSpacing:"-0.01em"}}>{p.labs[0].value}</span><span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>g/dL</span></div>
            </div>
            <div style={{width:"0.5px",background:C.grey[300],alignSelf:"stretch"}}/>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:C.grey[600],textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:font,marginBottom:3}}>Ferritin</div>
              <div style={{display:"flex",alignItems:"baseline",gap:2}}><span style={{fontSize:20,fontWeight:700,color:ferC,fontFamily:font,letterSpacing:"-0.01em"}}>{p.labs[1].value}</span><span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>ng/mL</span></div>
            </div>
          </div>
        </td>

        {/* BLOOD PRESSURE */}
        <td style={{padding:"12px 16px",minWidth:120}}>
          {(() => {
            const [s,d] = p.bp.split("/").map(Number);
            const elevated = s>=140||d>=90;
            const color = elevated ? C.error[400] : s>=130||d>=80 ? C.orange[400] : C.success[400];
            return (
              <div>
                <div style={{fontSize:12,fontWeight:700,color:C.grey[600],textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:font,marginBottom:3}}>BP</div>
                <div style={{display:"flex",alignItems:"baseline",gap:2}}><span style={{fontSize:20,fontWeight:700,color,fontFamily:font,letterSpacing:"-0.01em"}}>{p.bp}</span><span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>mmHg</span></div>
              </div>
            );
          })()}
        </td>

        {/* MATERNAL HEALTH RISK SCORE — AC6: tier-colored chip with hover tooltip */}
        <td style={{padding:"12px 16px",minWidth:110,textAlign:"center"}} onClick={e=>{e.stopPropagation();onOpenACOG(p);}}>
          <div style={{cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",position:"relative"}} title={p._mhr.cat}>
            <MHRGauge score={p._mhr.score} maxPossible={p._mhr.maxPossible} color={p._mhr.color} compact/>
          </div>
        </td>

        {/* ACTIVE ORDER */}
        <td style={{padding:"12px 16px",minWidth:180}}>
          {(() => {const cpC=p.activeRecommendation===null?C.grey[500]:p.carePlanStatus==="generated"?C.success[400]:p.carePlanStatus==="in-progress"?C.orange[400]:p.carePlanStatus==="pending"?C.error[400]:C.grey[400];const cpL=p.activeRecommendation===null?"No Active Recommendation":p.carePlanStatus==="generated"?"Care Recommendation Generated":p.carePlanStatus==="in-progress"?"Care Recommendation In Progress":p.carePlanStatus==="pending"?"Care Recommendation Not Started":"";return cpL? <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:4}}><div style={{width:5,height:5,borderRadius:"50%",background:cpC,flexShrink:0}}/><span style={{fontSize:14,color:cpC,fontFamily:font,fontWeight:600}}>{cpL}</span></div>:null;})()}
          {p.activeRecommendation!==null && p.carePlanStatus!=="pending" && <span style={{fontSize:12,color:C.grey[700],fontFamily:font,lineHeight:1.4}}>{p.order}</span>}
        </td>

        {/* PROVIDER */}
        <td style={{padding:"12px 16px",minWidth:120}}>
          <div style={{fontSize:14,fontWeight:600,color:C.grey[800],fontFamily:font}}>{p.provider}</div>
        </td>

      </tr>
    </>
  );
};

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]        = useState("worklist");
  const [activePatient, setActivePatient] = useState(null);
  const [defaultZone, setDefaultZone]     = useState("overview");
  const [activeEpisodeId, setActiveEpisodeId] = useState(null);
  const [acogPatient, setAcogPatient]     = useState(null);
  const [facilityFilter, setFacilityFilter] = useState([...FACILITIES]);
  const [search, setSearch]        = useState("");
  const [ctFilter, setCtFilter]    = useState("All Case Types");
  const [sevFilter, setSevFilter]  = useState("All Severity");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [sortFilter, setSortFilter] = useState("All Severity");
  const [dateFilter, setDateFilter] = useState("Visit Date");
  const [sortBy, setSortBy] = useState("Next Visit Date");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [facilityMenuOpen, setFacilityMenuOpen] = useState(false);
  const [vtFilter, setVtFilter] = useState("All Visit Types");
  const SORT_OPTIONS = ["All Severity","Low","Intermediate","High","Very High"];
  const DATE_FILTER_OPTIONS = ["Visit Date","EDD","Custom Date Range"];
  const SORT_BY_OPTIONS = ["Next Visit Date","Severity"];
  const SEVERITY_RANK = {"Low":1,"Intermediate":2,"High":3,"Very High":4};
  const STATUS_OPTIONS = ["ALL","Active","In Progress","Not Started","Generated","Follow Up","Complete","Inactive","Cancelled"];
  const statusMap = {"Active":"active","In Progress":"in-progress","Not Started":"pending","Generated":"generated","Follow Up":"follow-up","Complete":"complete","Inactive":"inactive","Cancelled":"cancelled"};
  const parseDate = (value) => value.includes("-")
    ? new Date(`${value}T00:00:00`)
    : (() => { const [month, day, year] = value.split("/").map(Number); return new Date(year, month - 1, day); })();

  if(screen==="workspace" && activePatient)
    return (
      <><GlobalReset/><div style={{height:"100dvh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <PatientWorkspace patient={activePatient} allPatients={PATIENTS} episodeId={activeEpisodeId} onBack={()=>setScreen("worklist")} onSelectPatient={p=>setActivePatient(p)} defaultZone={defaultZone}/>
      </div></>
    );

  const COLS = ["PATIENT / GA","NEXT VISIT","LAB VALUES","BLOOD PRESSURE","MATERNAL HEALTH RISK","ACTIVE ORDER","PROVIDER"];

  // Build one row per active episode from the mock episodes module
  const activeEpisodes = getActiveEpisodes();
  const episodeRows = activeEpisodes.map(ep => {
    const patient = PATIENTS.find(p => p.id === ep.patientId);
    return { ...patient, _ep: ep };
  }).filter(p => p && p.id);

  const filtered = episodeRows.filter(p => {
    const ep = p._ep;
    const nv = ep.nextVisit;
    return facilityFilter.includes(p.facility)
      && (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()) || p.provider.toLowerCase().includes(search.toLowerCase()))
      && (ctFilter==="All Case Types" || p.caseType===ctFilter)
      && (statusFilter==="ALL" || p.carePlanStatus===statusMap[statusFilter] || (statusFilter==="Active" && (p.carePlanStatus==="in-progress"||p.carePlanStatus==="generated")))
      && (!["Low","Intermediate","High","Very High"].includes(sortFilter) || p._mhr.cat===sortFilter)
      && (vtFilter==="All Visit Types" || (nv && nv.type===vtFilter))
      && (dateFilter==="EDD" || dateFilter==="Visit Date" || (!customStart || (!nv || nv.date >= customStart)) && (!customEnd || (!nv || nv.date <= customEnd)));
  });
  const displayedPatients = sortBy==="Severity"
    ? [...filtered].sort((a,b) => (SEVERITY_RANK[b._mhr.cat]||0) - (SEVERITY_RANK[a._mhr.cat]||0))
    : [...filtered].sort((a,b) => {
        const aD = a._ep.nextVisit ? a._ep.nextVisit.date : "9999-12-31";
        const bD = b._ep.nextVisit ? b._ep.nextVisit.date : "9999-12-31";
        return aD.localeCompare(bD);
      });

  return (
    <><GlobalReset/><div style={{display:"flex",flexDirection:"column",height:"100dvh",overflow:"hidden",fontFamily:font,background:C.grey[200]}}>
      {/* Top nav */}
      <div style={{height:56,flexShrink:0,background:C.grey[100],borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",padding:"0 24px"}}>
        <span style={{fontSize:14,fontWeight:700,fontFamily:font,marginRight:16}}><span style={{color:C.grey[800]}}>hc</span><span style={{color:C.orange[400]}}>1</span><span style={{color:C.grey[800]}}> ClinicalIQ</span></span>
        <div style={{width:"0.5px",height:20,background:C.grey[300],marginRight:16}}/>
        <div style={{display:"flex",alignItems:"center",gap:4,background:C.grey[200],borderRadius:8,padding:4}}>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,opacity:0.5,cursor:"default"}}>
            <BloodDrop size={13} color={C.grey[500]}/>
            <span style={{fontSize:12,fontWeight:400,color:C.grey[500],fontFamily:font}}>Anemia Management</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:5,padding:"5px 12px",borderRadius:6,background:C.grey[100],boxShadow:"0 1px 4px rgba(0,0,0,0.08)",border:`1px solid ${C.grey[300]}`}}>
            <Pregnant size={13} color={C.hc[400]}/>
            <span style={{fontSize:12,fontWeight:600,color:C.grey[800],fontFamily:font}}>HerCare Co-Pilot</span>
          </div>
        </div>
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:C.success[400],boxShadow:`0 0 6px ${C.success[400]}`}}/><span style={{fontSize:12,color:C.success[400],fontFamily:font}}>FHIR R4 Live</span></div>
      </div>

      <div style={{flex:1,overflow:"hidden",padding:"12px 16px",display:"flex",flexDirection:"column",minHeight:0}}>
        {/* Table card */}
        <div style={{background:C.grey[100],borderRadius:12,border:`1px solid ${C.grey[300]}`,boxShadow:"0 1px 8px rgba(0,0,0,0.06)",overflow:"hidden",display:"flex",flexDirection:"column",flex:1,minHeight:0}}>
          {/* Search + filters */}
          <div style={{padding:"12px 20px",borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",gap:10,flexShrink:0}}>
            <div style={{position:"relative",display:"flex",alignItems:"center"}}>
              <label style={{position:"absolute",top:-7,left:9,padding:"0 4px",background:C.grey[100],fontSize:10,color:C.grey[600],fontFamily:font,lineHeight:1,zIndex:2}}>Facility *</label>
              <button type="button" onClick={()=>setFacilityMenuOpen(open=>!open)} aria-expanded={facilityMenuOpen} aria-haspopup="listbox" style={{appearance:"none",textAlign:"left",padding:"8px 30px 8px 12px",border:`1px solid ${C.grey[400]}`,borderRadius:4,fontSize:12,color:C.grey[800],background:C.grey[100],cursor:"pointer",outline:"none",fontFamily:font,minWidth:190,position:"relative",maxWidth:240,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
                {facilityFilter.length===FACILITIES.length ? "ALL" : facilityFilter.length===0 ? "No Facilities" : facilityFilter.join(", ")}
                <ChevronDown size={10} color={C.grey[500]} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              </button>
              {facilityMenuOpen && <div role="listbox" aria-label="Facility options" style={{position:"absolute",top:"calc(100% + 4px)",left:0,zIndex:20,width:220,padding:"6px 0",background:C.grey[100],border:`1px solid ${C.grey[300]}`,borderRadius:6,boxShadow:"0 8px 24px rgba(0,0,0,0.14)"}}>
                <button type="button" onClick={()=>setFacilityFilter(facilityFilter.length===FACILITIES.length ? [] : [...FACILITIES])} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",border:0,background:"transparent",color:C.grey[700],fontSize:12,textAlign:"left",cursor:"pointer",fontFamily:font}}>
                  <span style={{width:16,height:16,display:"inline-flex",alignItems:"center",justifyContent:"center",border:`1px solid ${facilityFilter.length===FACILITIES.length ? C.primary[500] : C.grey[400]}`,borderRadius:3,background:facilityFilter.length===FACILITIES.length ? C.primary[500] : C.grey[100],color:"#fff",fontSize:11,fontWeight:700}}>{facilityFilter.length===FACILITIES.length ? "✓" : ""}</span>
                  Select All
                </button>
                <div style={{height:1,background:C.grey[300],margin:"2px 0"}}/>
                {FACILITIES.map(f=><button key={f} type="button" role="option" aria-selected={facilityFilter.includes(f)} onClick={()=>setFacilityFilter(current=>current.includes(f) ? current.filter(selected=>selected!==f) : [...current,f])} style={{width:"100%",display:"flex",alignItems:"center",gap:8,padding:"8px 12px",border:0,background:"transparent",color:C.grey[800],fontSize:12,textAlign:"left",cursor:"pointer",fontFamily:font}}>
                  <span style={{width:16,height:16,display:"inline-flex",alignItems:"center",justifyContent:"center",border:`1px solid ${facilityFilter.includes(f) ? C.primary[500] : C.grey[400]}`,borderRadius:3,background:facilityFilter.includes(f) ? C.primary[500] : C.grey[100],color:"#fff",fontSize:11,fontWeight:700}}>{facilityFilter.includes(f) ? "✓" : ""}</span>
                  {f}
                </button>)}
              </div>}
            </div>
            <div style={{position:"relative",width:260}}>
              <label style={{position:"absolute",top:-7,left:9,padding:"0 4px",background:C.grey[100],fontSize:10,color:C.grey[600],fontFamily:font,lineHeight:1,zIndex:1}}>Search *</label>
              <Search size={13} color={C.grey[500]} style={{position:"absolute",left:10,bottom:9,pointerEvents:"none"}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patients, MRN, provider..." style={{width:"100%",boxSizing:"border-box",padding:"7px 10px 7px 30px",border:`1px solid ${C.grey[400]}`,borderRadius:4,fontSize:12,color:C.grey[800],background:C.grey[100],outline:"none",fontFamily:font}}/>
            </div>
            <div style={{flex:1}}/>
            <Filter size={13} color={C.grey[500]}/><span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>Filter by:</span>
            {[{v:ctFilter,s:setCtFilter,o:CASE_TYPES},{v:vtFilter,s:setVtFilter,o:["All Visit Types",...VISIT_TYPES]}].map((dd,i) => (
              <div key={i} style={{position:"relative",display:"flex",alignItems:"center"}}>
                <label style={{position:"absolute",top:-7,left:9,padding:"0 4px",background:C.grey[100],fontSize:10,color:C.grey[600],fontFamily:font,lineHeight:1}}>{i===0?"Case Type *":"Visit Type *"}</label>
                <select value={dd.v} onChange={e=>dd.s(e.target.value)} style={{appearance:"none",padding:"8px 28px 8px 12px",border:`1px solid ${C.grey[400]}`,borderRadius:4,fontSize:12,color:C.grey[800],background:C.grey[100],cursor:"pointer",outline:"none",fontFamily:font,minWidth:150}}>
                  {dd.o.map(o=><option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={10} color={C.grey[500]} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              </div>
            ))}
            <div style={{position:"relative",display:"flex",alignItems:"center"}}>
              <label style={{position:"absolute",top:-7,left:9,padding:"0 4px",background:C.grey[100],fontSize:10,color:C.grey[600],fontFamily:font,lineHeight:1}}>Select Status *</label>
              <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{appearance:"none",padding:"8px 28px 8px 12px",border:`1px solid ${C.grey[400]}`,borderRadius:4,fontSize:12,color:C.grey[800],background:C.grey[100],cursor:"pointer",outline:"none",fontFamily:font,minWidth:150}}>
                {STATUS_OPTIONS.map(o=><option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={10} color={C.grey[500]} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            </div>
            <div style={{position:"relative",display:"flex",alignItems:"center"}}>
              <label style={{position:"absolute",top:-7,left:9,padding:"0 4px",background:C.grey[100],fontSize:10,color:C.grey[600],fontFamily:font,lineHeight:1}}>Severity *</label>
              <select value={sortFilter} onChange={e=>setSortFilter(e.target.value)} style={{appearance:"none",padding:"8px 28px 8px 12px",border:`1px solid ${C.grey[400]}`,borderRadius:4,fontSize:12,color:C.grey[800],background:C.grey[100],cursor:"pointer",outline:"none",fontFamily:font,minWidth:150}}>
                {SORT_OPTIONS.map(o=><option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={10} color={C.grey[500]} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            </div>
            <div style={{position:"relative",display:"flex",alignItems:"center"}}>
              <label style={{position:"absolute",top:-7,left:9,padding:"0 4px",background:C.grey[100],fontSize:10,color:C.grey[600],fontFamily:font,lineHeight:1}}>Date *</label>
              <select value={dateFilter} onChange={e=>setDateFilter(e.target.value)} style={{appearance:"none",padding:"8px 28px 8px 12px",border:`1px solid ${C.grey[400]}`,borderRadius:4,fontSize:12,color:C.grey[800],background:C.grey[100],cursor:"pointer",outline:"none",fontFamily:font,minWidth:150}}>
                {DATE_FILTER_OPTIONS.map(o=><option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={10} color={C.grey[500]} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            </div>
            <div style={{position:"relative",display:"flex",alignItems:"center"}}>
              <label style={{position:"absolute",top:-7,left:9,padding:"0 4px",background:C.grey[100],fontSize:10,color:C.grey[600],fontFamily:font,lineHeight:1}}>Sort By *</label>
              <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{appearance:"none",padding:"8px 28px 8px 12px",border:`1px solid ${C.grey[400]}`,borderRadius:4,fontSize:12,color:C.grey[800],background:C.grey[100],cursor:"pointer",outline:"none",fontFamily:font,minWidth:150}}>
                {SORT_BY_OPTIONS.map(o=><option key={o}>{o}</option>)}
              </select>
              <ChevronDown size={10} color={C.grey[500]} style={{position:"absolute",right:9,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
            </div>
            {dateFilter==="Custom Date Range" && <>
              <input type="date" value={customStart} onChange={e=>setCustomStart(e.target.value)} aria-label="Custom date range start" style={{padding:"7px 8px",border:`1px solid ${C.grey[300]}`,borderRadius:6,fontSize:12,color:C.grey[700],background:C.grey[100],fontFamily:font}}/>
              <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>to</span>
              <input type="date" value={customEnd} onChange={e=>setCustomEnd(e.target.value)} aria-label="Custom date range end" style={{padding:"7px 8px",border:`1px solid ${C.grey[300]}`,borderRadius:6,fontSize:12,color:C.grey[700],background:C.grey[100],fontFamily:font}}/>
            </>}
            <button onClick={()=>{setFacilityFilter([...FACILITIES]);setSearch("");setCtFilter("All Case Types");setSevFilter("All Severity");setStatusFilter("Active");setSortFilter("All Severity");setDateFilter("Visit Date");setSortBy("Next Visit Date");setCustomStart("");setCustomEnd("");setVtFilter("All Visit Types");}} aria-label="Reset all filters to default" title="Reset filters" style={{display:"flex",alignItems:"center",justifyContent:"center",width:32,height:32,border:`1px solid ${C.grey[400]}`,borderRadius:6,background:C.grey[100],color:C.grey[700],cursor:"pointer",outline:"none"}}><RotateCcw size={15} color={C.grey[700]}/></button>
          </div>

          {/* Table */}
          <div style={{flex:1,overflowY:"auto",overflowX:"auto",minHeight:0}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:C.grey[200],borderBottom:`1px solid ${C.grey[300]}`}}>
                  {COLS.map(h => <th key={h} style={{fontSize:12,fontWeight:700,letterSpacing:"0.06em",color:C.grey[600],textAlign:h==="MATERNAL HEALTH RISK"?"center":"left",padding:"10px 16px",textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:font}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {displayedPatients.length===0
                  ? <tr><td colSpan={COLS.length} style={{padding:24,textAlign:"center",fontSize:14,color:C.grey[500],fontFamily:font}}>No patients match</td></tr>
                  : displayedPatients.map(p => <PatientRow key={p._ep?._id||p.id} p={p}
                      onOpen={(p,zone="overview",episodeId=null)=>{setActivePatient(p);setActiveEpisodeId(episodeId);setDefaultZone(zone);setScreen("workspace");}}
                      onOpenACOG={p=>setAcogPatient(p)}/>)
                }
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{padding:"9px 16px",borderTop:`1px solid ${C.grey[300]}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>Showing {displayedPatients.length} of {episodeRows.length} episodes</span>
            <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:C.success[400]}}/><span style={{fontSize:12,color:C.success[400],fontFamily:font}}>FHIR R4 Live · Synced 2 min ago</span></div>
          </div>
        </div>
      </div>

      {/* MHR Modal */}
      {acogPatient && <MHRModal p={acogPatient} onClose={()=>setAcogPatient(null)}/>}
    </div></>
  );
}