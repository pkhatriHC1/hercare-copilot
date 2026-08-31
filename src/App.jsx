import { useState, useEffect } from "react";

const GlobalReset = () => {
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = "html,body,#root{height:100%;margin:0;padding:0;overflow:hidden;}*{box-sizing:border-box;}";
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);
  return null;
};
import { Search, Filter, ChevronDown, ArrowRight, ChevronLeft, MessageSquare, ClipboardList, User, Hash, Stethoscope } from "lucide-react";
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
const TRC  = { "very-high": C.error[400], "high": C.orange[400], "medium": "#92600A", "low": C.success[400] };
// Shared 4-tier severity chip — SEVERE / MODERATE / MILD / NORMAL — consistent across TRS, ACOG, and lab grades
const SEV4={severe:{c:C.error[400],bg:C.error[100],l:"SEVERE"},moderate:{c:C.orange[400],bg:C.orange[100],l:"MODERATE"},mild:{c:"#92600A",bg:C.yellow[100],l:"MILD"},normal:{c:C.success[400],bg:C.success[100],l:"NORMAL"}};
const SevChip=({tier})=>{const s=SEV4[tier]||SEV4.normal;return <span style={{fontSize:12,fontWeight:700,color:s.c,background:s.bg,borderRadius:4,padding:"2px 7px",fontFamily:font,letterSpacing:"0.06em",textTransform:"uppercase"}}>{s.l}</span>;};
// Map TRS trsSev → 4-tier: very-high → severe, high → moderate, medium → mild, low → normal
const trsTier=(sev)=>sev==="very-high"?"severe":sev==="high"?"moderate":sev==="medium"?"mild":"normal";
// Map ACOG cat → 4-tier: Critical → severe, High → moderate, Moderate → mild, Low → normal
const acogTier=(cat)=>cat==="Critical"?"severe":cat==="High"?"moderate":cat==="Moderate"?"mild":"normal";
// Consistent SVG icons for each ACOG condition — same size, same stroke style
const ConditionIcon = ({name, size=16}) => {
  const s = {width:size, height:size, flexShrink:0};
  const sh = {fill:"none", strokeWidth:"1.8", strokeLinecap:"round", strokeLinejoin:"round"};
  if(name==="Multiple Gestations")   return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.orange[400]}><circle cx="9" cy="7" r="3"/><circle cx="15" cy="7" r="3"/><path d="M3 21v-2a4 4 0 0 1 4-4h4"/><path d="M13 21v-2a4 4 0 0 1 4-4h4"/></svg>;
  if(name==="History Preterm Labor") return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.yellow[400]}><path d="M12 2a7 7 0 0 1 7 7c0 4.5-7 13-7 13S5 13.5 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>;
  if(name==="Hypertension")          return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.error[400]}><path d="M3 12h2l2-6 3 12 3-9 2 3h2"/><path d="M19 12h2"/></svg>;
  if(name==="Anemia")                return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.error[400]}><path d="M12 2C12 2 5 10.5 5 15a7 7 0 0 0 14 0c0-4.5-7-13-7-13z"/></svg>;
  if(name==="Recent Pregnancy")      return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.success[400]}><circle cx="12" cy="4" r="2"/><path d="M9 8h3l1 4c1.5 0 3 1.5 3 3.5S14.5 19 13 19H9"/><path d="M9 8l-1 5"/><path d="M8 13l-1 6"/></svg>;
  if(name==="Diabetes")              return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.orange[400]}><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"/></svg>;
  if(name==="Obesity")               return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.yellow[400]}><circle cx="12" cy="12" r="8"/><path d="M8 12c0-2 1.5-4 4-4s4 2 4 4"/><path d="M8 14h8"/></svg>;
  if(name==="Prior Cesarean")        return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.primary[500]}><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>;
  if(name==="Placenta Previa")       return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.error[400]}><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z"/><circle cx="12" cy="10" r="3"/></svg>;
  if(name==="Advanced Maternal Age") return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.orange[400]}><circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0 1 12 0v2"/><path d="M12 14v3"/><path d="M9.5 19.5l2.5-2.5 2.5 2.5"/></svg>;
  if(name==="Thyroid Disease")       return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.secondary[500]}><ellipse cx="12" cy="12" rx="5" ry="7"/><path d="M7 12H3"/><path d="M21 12h-4"/></svg>;
  if(name==="Cardiac Disease")       return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.error[400]}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>;
  // fallback — ⚠ exclamation for unknown conditions
  return <svg {...s} viewBox="0 0 24 24" {...sh} stroke={C.grey[500]}><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.6" fill={C.grey[500]} stroke="none"/></svg>;
};
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
const TRSGauge = ({value,color,size=44}) => {
  const w=size,h=Math.round(size*0.64),r=size*0.41,cx=size/2,cy=size/2,circ=Math.PI*r,pct=Math.min(value/10,1),stroke=circ*pct,gap=circ-stroke,arcD=`M ${cx-r} ${cy} A ${r} ${r} 0 0 1 ${cx+r} ${cy}`,fs=Math.round(size*0.25);
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}><path d={arcD} fill="none" stroke={C.grey[300]} strokeWidth="4" strokeLinecap="round"/><path d={arcD} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={`${stroke} ${gap}`}/><text x={cx} y={h} textAnchor="middle" fontSize={fs} fontWeight="700" fill={color} fontFamily={font}>{value}</text></svg>;
};

// ── TRS calculator ────────────────────────────────────────────────
const calcTRS = (p) => {
  let score=0; const full=[];
  const hgb=parseFloat(p.labs.find(l=>l.label==="HGB")?.value??99);
  const hs=hgb<10?2:hgb<13?1:0; score+=hs;
  full.push({label:"Hemoglobin",value:hgb+" g/dL",criteria:hgb<10?"<10.0":hgb<13?"10–12.9":"≥13",maxPts:2,earnedPts:hs});
  const crLab=p.labs.find(l=>l.label==="Creatinine"); const cr=crLab?parseFloat(crLab.value):0;
  const cs=cr>=2?2:cr>=1.2?1:0; score+=cs;
  full.push({label:"Creatinine",value:(crLab?.value??"N/A")+" mg/dL",criteria:cr>=2?"≥2.0":cr>=1.2?"1.2–1.9":"<1.2",maxPts:2,earnedPts:cs});
  const wt=parseFloat(p.weight); const ws=wt<75?1:0; score+=ws;
  full.push({label:"Weight",value:p.weight,criteria:wt<75?"<75 kg":">75",maxPts:1,earnedPts:ws});
  score+=1; full.push({label:"Gender",value:"female",criteria:"female",maxPts:1,earnedPts:1});
  const as=p.age>=65?1:0; score+=as;
  full.push({label:"Age",value:p.age+" years",criteria:p.age>=65?"≥65":"<65",maxPts:1,earnedPts:as});
  full.push({label:"Surgery Timing",value:"≥2 weeks",criteria:"scheduled",maxPts:1,earnedPts:0});
  const rs=p.redoOrNonIsolated?1:0; score+=rs;
  full.push({label:"Redo Procedure",value:p.redoOrNonIsolated?"Yes":"No",criteria:"previous surgery",maxPts:1,earnedPts:rs});
  full.push({label:"Non-Isolated Surgery",value:"No",criteria:"complex procedure",maxPts:1,earnedPts:0});
  const cms=p.significantComorbidities?1:0; score+=cms;
  full.push({label:"Comorbidities",value:p.significantComorbidities?"Present":"None",criteria:"significant",maxPts:1,earnedPts:cms});
  full.push({label:"Anticoagulant Use",value:"No",criteria:"bleeding-risk meds",maxPts:1,earnedPts:0});
  let category,trsSev;
  if(score>=4){category="Very High Risk";trsSev="very-high";}
  else if(score===3){category="High Risk";trsSev="high";}
  else if(score===2){category="Intermediate Risk";trsSev="medium";}
  else{category="Low Risk";trsSev="low";}
  const actions={"low":["Routine monitoring","Oral iron if Hgb <12","Standard blood conservation","Re-evaluate if status changes"],"medium":["Enhanced anemia monitoring","Consider IV iron therapy","Blood conservation strategy","Discuss transfusion threshold"],"high":["IV iron therapy if Hgb <13 g/dL","Type and crossmatch 2–4 units","Multidisciplinary planning","Consider erythropoietin","Cell salvage recommended"],"very-high":["Urgent IV iron and/or EPO","Type and crossmatch ≥4 units","Delay elective procedure","Cell salvage mandatory"]}[trsSev];
  return {score,category,trsSev,fullBreakdown:full,actions};
};

// ── ACOG calculator — 12 conditions ──────────────────────────────
const ACOG_CONDITIONS = [
  {name:"Multiple Gestations",  pts:30, icd:"O30.C30"},
  {name:"History Preterm Labor",pts:20, icd:"O09.21"},
  {name:"Hypertension",         pts:15, icd:"I10–I13"},
  {name:"Anemia",               pts:15, icd:"D50, O99.011"},
  {name:"Cardiac Disease",      pts:15, icd:"I00–I52"},
  {name:"Diabetes",             pts:12, icd:"O24, E11"},
  {name:"Placenta Previa",      pts:12, icd:"O44"},
  {name:"Prior Cesarean",       pts:10, icd:"O34.21"},
  {name:"Obesity",              pts:10, icd:"E66, O99.21"},
  {name:"Recent Pregnancy",     pts:10, icd:"Z33"},
  {name:"Advanced Maternal Age",pts:8,  icd:"O09.52"},
  {name:"Thyroid Disease",      pts:8,  icd:"O99.28, E00–E07"},
];
const calcACOG = (p) => {
  let score=15; const contribs=[];
  ACOG_CONDITIONS.forEach(c=>{
    if(p.comorbidities.includes(c.name)){score+=c.pts;contribs.push({...c});}
  });
  const color=score>=80?C.error[400]:score>=60?C.orange[400]:score>=40?"#92600A":C.success[400];  const cat  =score>=80?"Critical":score>=60?"High":score>=40?"Moderate":"Low";
  return {score,color,cat,contribs,baseline:15,condPts:score-15};
};

// ── Patient data — 6 patients covering Critical / High / Low severity ──
const PATIENTS = [
  // CRITICAL — HGB < 8, many ACOG conditions
  { id:"MR-7821", name:"Maria Rodriguez", age:34, dob:"03/15/1992", sex:"Female", weight:"68 kg", bmi:"24.2", npi:"1122334455", domain:"OB Anemia", caseType:"OB Surgical",
    gestAge:"32 wks", parity:"G4P2", redoOrNonIsolated:false, significantComorbidities:true, anticoagulants:false,
    labs:[{label:"HGB",value:"7.2",unit:"g/dL",status:"critical",draws:[{date:"Apr 5",value:9.6},{date:"Apr 7",value:8.4},{date:"Apr 9",value:7.2}]},{label:"Ferritin",value:"6",unit:"ng/mL",status:"critical"},{label:"TIBC",value:"480",unit:"mcg/dL",status:"high"},{label:"Transferrin Sat",value:"4",unit:"%",status:"critical"},{label:"Reticulocytes",value:"0.9",unit:"%",status:"low"},{label:"WBC",value:"10.2",unit:"K/uL",status:"high"},{label:"Platelets",value:"168",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.8",unit:"mg/dL",status:"low"}],
    comorbidities:["Multiple Gestations","History Preterm Labor","Hypertension","Anemia","Cardiac Disease","Diabetes"],
    conditions:["Multiple Gestations","Hypertension","Iron Deficiency Anemia","Gestational Diabetes"],
    order:"IV Iron – Ferric Carboxymaltose 1000mg STAT + MFM consult",
    provider:"Dr. Chen", providerRole:"OB/GYN", unit:"OB High Risk", admitDate:"Apr 5, 2026",
    severity:"Critical", carePlanStatus:"pending", aiConfidence:94,
    diagnosis:"OB Iron Deficiency Anemia — Severe, ACOG PB #233",
    icdCodes:["O99.011","D50.0","O30.C30","I10"], allergies:["NKDA"],
    medications:["Prenatal vitamins","Labetalol 200mg BID","Insulin glargine 20u nightly"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Open",close:true},{name:"Comprehensive Diabetes Care (CDC)",st:"Open",close:true},{name:"Depression Screening & Follow-up (DSF)",st:"Closed",close:false}],
    star:3.5, starP:3.8 },

  // CRITICAL — HGB < 8, different condition mix
  { id:"SM-9643", name:"Sarah Martinez", age:31, dob:"07/22/1994", sex:"Female", weight:"72 kg", bmi:"25.8", npi:"1122334456", domain:"OB Anemia", caseType:"OB Non-Surgical",
    gestAge:"30 wks", parity:"G2P1", redoOrNonIsolated:true, significantComorbidities:true, anticoagulants:false,
    labs:[{label:"HGB",value:"7.8",unit:"g/dL",status:"critical",draws:[{date:"Apr 8",value:9.1},{date:"Apr 9",value:7.8}]},{label:"Ferritin",value:"9",unit:"ng/mL",status:"critical"},{label:"TIBC",value:"398",unit:"mcg/dL",status:"high"},{label:"Transferrin Sat",value:"6",unit:"%",status:"critical"},{label:"Reticulocytes",value:"0.9",unit:"%",status:"low"},{label:"WBC",value:"8.3",unit:"K/uL",status:"low"},{label:"Platelets",value:"210",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.7",unit:"mg/dL",status:"low"}],
    comorbidities:["Multiple Gestations","History Preterm Labor","Anemia","Prior Cesarean","Placenta Previa"],
    conditions:["Multiple Gestations","Preterm Labor Risk","Placenta Previa","Severe Iron Deficiency"],
    order:"IV Iron – Ferumoxytol 510mg x2 + High-risk monitoring",
    provider:"Dr. Patel", providerRole:"MFM", unit:"OB High Risk", admitDate:"Apr 7, 2026",
    severity:"Critical", carePlanStatus:"in-progress", aiConfidence:91,
    diagnosis:"OB Severe Iron Deficiency Anemia — Placenta Previa Risk",
    icdCodes:["O99.011","D50.0","O09.21","O44.0"], allergies:["Sulfa"],
    medications:["Prenatal vitamins","Progesterone 200mg"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Closed",close:false},{name:"Comprehensive Diabetes Care (CDC)",st:"Closed",close:false},{name:"Depression Screening & Follow-up (DSF)",st:"Open",close:true}],
    star:3.2, starP:3.6 },

  // HIGH — HGB 8–11, moderate ACOG conditions
  { id:"PS-0081", name:"Priya Sharma", age:29, dob:"11/08/1996", sex:"Female", weight:"63 kg", bmi:"22.4", npi:"1122334457", domain:"OB Anemia", caseType:"OB Non-Surgical",
    gestAge:"28 wks", parity:"G1P0", redoOrNonIsolated:false, significantComorbidities:false, anticoagulants:false,
    labs:[{label:"HGB",value:"9.2",unit:"g/dL",status:"high",draws:[{date:"Apr 6",value:10.4},{date:"Apr 9",value:9.2}]},{label:"Ferritin",value:"11",unit:"ng/mL",status:"high"},{label:"TIBC",value:"380",unit:"mcg/dL",status:"high"},{label:"Transferrin Sat",value:"12",unit:"%",status:"high"},{label:"Reticulocytes",value:"1.4",unit:"%",status:"low"},{label:"WBC",value:"8.8",unit:"K/uL",status:"low"},{label:"Platelets",value:"228",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.6",unit:"mg/dL",status:"low"}],
    comorbidities:["Anemia","Thyroid Disease","Advanced Maternal Age"],
    conditions:["Gestational Iron Deficiency Anemia","Hypothyroidism"],
    order:"IV Iron – Ferric Carboxymaltose 750mg + Thyroid monitoring",
    provider:"Dr. Nguyen", providerRole:"OB/GYN", unit:"OB Outpatient", admitDate:"Apr 8, 2026",
    severity:"High", carePlanStatus:"generated", aiConfidence:87,
    diagnosis:"Gestational Iron Deficiency Anemia — Thyroid Comorbidity",
    icdCodes:["O99.011","D50.9","O99.28"], allergies:["NKDA"],
    medications:["Prenatal vitamins","Levothyroxine 75mcg daily"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Closed",close:false},{name:"Comprehensive Diabetes Care (CDC)",st:"Closed",close:false},{name:"Depression Screening & Follow-up (DSF)",st:"Closed",close:false}],
    star:3.7, starP:3.9 },

  // HIGH — HGB 8–11, obesity + hypertension mix
  { id:"JW-3431", name:"Jennifer Washington", age:38, dob:"02/14/1988", sex:"Female", weight:"98 kg", bmi:"34.2", npi:"1122334458", domain:"OB Anemia", caseType:"OB Surgical",
    gestAge:"24 wks", parity:"G5P2", redoOrNonIsolated:false, significantComorbidities:true, anticoagulants:false,
    labs:[{label:"HGB",value:"10.1",unit:"g/dL",status:"high",draws:[{date:"Apr 5",value:10.8},{date:"Apr 9",value:10.1}]},{label:"Ferritin",value:"22",unit:"ng/mL",status:"high"},{label:"TIBC",value:"342",unit:"mcg/dL",status:"high"},{label:"Transferrin Sat",value:"18",unit:"%",status:"high"},{label:"Reticulocytes",value:"1.6",unit:"%",status:"low"},{label:"WBC",value:"7.9",unit:"K/uL",status:"low"},{label:"Platelets",value:"244",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.9",unit:"mg/dL",status:"low"}],
    comorbidities:["Hypertension","Anemia","Obesity","Advanced Maternal Age","Recent Pregnancy"],
    conditions:["Hypertension","Anemia of Pregnancy","Obesity","Multiparity"],
    order:"IV Iron – Ferric Carboxymaltose 750mg + Nephrology consult",
    provider:"Dr. Kim", providerRole:"MFM", unit:"OB Outpatient", admitDate:"Apr 6, 2026",
    severity:"High", carePlanStatus:"pending", aiConfidence:83,
    diagnosis:"OB Anemia — Mixed Iron Deficiency, Obesity & Hypertension",
    icdCodes:["O99.011","D63.1","O10.02","E66"], allergies:["Penicillin"],
    medications:["Prenatal vitamins","Methyldopa 250mg BID"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Open",close:true},{name:"Comprehensive Diabetes Care (CDC)",st:"Closed",close:false},{name:"Depression Screening & Follow-up (DSF)",st:"Closed",close:false}],
    star:3.1, starP:3.5 },

  // LOW — HGB ≥ 11, minimal conditions
  { id:"AT-9012", name:"Ashley Thompson", age:26, dob:"09/05/2000", sex:"Female", weight:"61 kg", bmi:"22.0", npi:"1122334459", domain:"OB Anemia", caseType:"Postpartum",
    gestAge:"20 wks", parity:"G1P0", redoOrNonIsolated:false, significantComorbidities:false, anticoagulants:false,
    labs:[{label:"HGB",value:"11.4",unit:"g/dL",status:"low",draws:[{date:"Apr 7",value:11.8},{date:"Apr 9",value:11.4}]},{label:"Ferritin",value:"28",unit:"ng/mL",status:"low"},{label:"TIBC",value:"295",unit:"mcg/dL",status:"low"},{label:"Transferrin Sat",value:"22",unit:"%",status:"low"},{label:"Reticulocytes",value:"1.8",unit:"%",status:"low"},{label:"WBC",value:"8.2",unit:"K/uL",status:"low"},{label:"Platelets",value:"282",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.7",unit:"mg/dL",status:"low"}],
    comorbidities:["Anemia"],
    conditions:["Mild Gestational Anemia","Mental Health Support"],
    order:"Oral Iron – Ferrous Sulfate 325mg BID + Mental health referral",
    provider:"Dr. Williams", providerRole:"OB/GYN", unit:"OB Outpatient", admitDate:"Apr 9, 2026",
    severity:"Low", carePlanStatus:"generated", aiConfidence:82,
    diagnosis:"Mild Gestational Anemia — Iron Supplementation",
    icdCodes:["O99.011","D50.9"], allergies:["NKDA"],
    medications:["Prenatal vitamins","Ferrous Sulfate 325mg BID"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Closed",close:false},{name:"Comprehensive Diabetes Care (CDC)",st:"Closed",close:false},{name:"Depression Screening & Follow-up (DSF)",st:"Open",close:true}],
    star:3.9, starP:4.1 },

  // LOW — HGB ≥ 11, cardiac + thyroid
  { id:"LK-5509", name:"Linda Kowalski", age:41, dob:"06/18/1984", sex:"Female", weight:"74 kg", bmi:"26.1", npi:"1122334460", domain:"OB Anemia", caseType:"OB Non-Surgical",
    gestAge:"18 wks", parity:"G3P1", redoOrNonIsolated:false, significantComorbidities:true, anticoagulants:true,
    labs:[{label:"HGB",value:"11.8",unit:"g/dL",status:"low",draws:[{date:"Apr 4",value:12.1},{date:"Apr 9",value:11.8}]},{label:"Ferritin",value:"32",unit:"ng/mL",status:"low"},{label:"TIBC",value:"280",unit:"mcg/dL",status:"low"},{label:"Transferrin Sat",value:"24",unit:"%",status:"low"},{label:"Reticulocytes",value:"2.1",unit:"%",status:"low"},{label:"WBC",value:"7.4",unit:"K/uL",status:"low"},{label:"Platelets",value:"201",unit:"K/uL",status:"low"},{label:"Creatinine",value:"0.8",unit:"mg/dL",status:"low"}],
    comorbidities:["Cardiac Disease","Thyroid Disease","Advanced Maternal Age","Prior Cesarean"],
    conditions:["Cardiac Disease","Hypothyroidism","Advanced Maternal Age"],
    order:"Oral Iron – Ferrous Gluconate 300mg + Cardiology co-management",
    provider:"Dr. Osei", providerRole:"MFM", unit:"OB Cardiac Clinic", admitDate:"Apr 8, 2026",
    severity:"Low", carePlanStatus:"in-progress", aiConfidence:78,
    diagnosis:"Borderline Anemia — Cardiac Co-management Required",
    icdCodes:["O99.011","D50.9","O99.41","O99.28"], allergies:["Aspirin"],
    medications:["Prenatal vitamins","Levothyroxine 100mcg daily","Heparin 5000u SQ BID"],
    hedis:[{name:"Prenatal & Postpartum Care (PPC)",st:"Open",close:true},{name:"Controlling High Blood Pressure (CBP)",st:"Closed",close:false},{name:"Comprehensive Diabetes Care (CDC)",st:"Closed",close:false},{name:"Depression Screening & Follow-up (DSF)",st:"Closed",close:false}],
    star:3.6, starP:3.8 },
];
PATIENTS.forEach(p => { p._trs = calcTRS(p); p._acog = calcACOG(p); });

// ── Anemia grade helper — 4-tier per surgical consensus ──────────
// Severe ≤8.0 · Moderate 8.1–11.0 · Mild 11.1–12.9 · No Anemia >13.0
const getAnemiaGrade = (hgb) => {
  const h = parseFloat(hgb);
  if(h > 13.0) return {label:"No Anemia", tier:"normal",   color:C.success[400], bg:C.success[100]};
  if(h >= 11.1) return {label:"Mild",     tier:"mild",     color:"#92600A",       bg:C.yellow[100]};
  if(h >= 8.1)  return {label:"Moderate", tier:"moderate", color:C.orange[400],   bg:C.orange[100]};
  return               {label:"Severe",   tier:"severe",   color:C.error[400],    bg:C.error[100]};
};

// ── TRS Drawer (identical to BloodHealth) ─────────────────────────
const TRSDrawer = ({p, onClose}) => {
  const t=p._trs; const tc=TRC[t.trsSev];
  const riskDesc = {"low":"Low transfusion risk. Routine monitoring and optimization is sufficient.","medium":"Moderate risk. Enhanced monitoring and iron optimization recommended.","high":"High risk. Aggressive optimization and preparation required before procedure.","very-high":"Very high risk. Immediate intervention required. Consider delaying elective surgery."}[t.trsSev];
  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{width:580,maxHeight:"85vh",background:C.grey[100],borderRadius:16,display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",gap:12,flexShrink:0,background:C.grey[100]}}>
          <div style={{width:36,height:36,borderRadius:10,background:C.primary[100],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}><TRSGauge value={t.score} color={tc} size={28}/></div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,color:C.grey[800],fontFamily:font,lineHeight:1.2}}>Transfusion Risk Score</div>
            <div style={{fontSize:12,color:C.grey[600],fontFamily:font,marginTop:2}}>{p.name} · MRN {p.id}</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:C.grey[200],border:"none",color:C.grey[600],fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:font,lineHeight:1}}>✕</button>
        </div>
        <div style={{padding:"20px",borderBottom:`1px solid ${C.grey[300]}`,flexShrink:0,background:C.grey[100]}}>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <div style={{background:C.grey[200],borderRadius:12,padding:"16px 20px",textAlign:"center",minWidth:100,flexShrink:0}}>
              <div style={{fontSize:48,fontWeight:500,color:tc,fontFamily:font,lineHeight:1,letterSpacing:"-0.03em"}}>{t.score}</div>
              <div style={{marginTop:6}}><SevChip tier={trsTier(t.trsSev)}/></div>
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <div style={{height:6,flex:1,background:C.grey[300],borderRadius:999,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${Math.min(t.score/10*100,100)}%`,background:tc,borderRadius:999,transition:"width 0.4s ease"}}/>
                </div>
                <span style={{fontSize:12,fontWeight:600,color:tc,fontFamily:font,flexShrink:0}}>{t.score}/10</span>
              </div>
              <p style={{fontSize:14,color:C.grey[700],fontFamily:font,lineHeight:1.6,margin:0}}>{riskDesc}</p>
            </div>
          </div>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:12,background:C.grey[100]}}>
          <div>
            <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:C.grey[600],fontFamily:font,marginBottom:8}}>Score Breakdown</div>
            <div style={{background:C.grey[100],borderRadius:10,overflow:"hidden",border:`1px solid ${C.grey[300]}`}}>
              {t.fullBreakdown.map((f,i) => {
                const sc = f.earnedPts > 0;
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderBottom:i<t.fullBreakdown.length-1?`1px solid ${C.grey[300]}`:"none",background:sc?"#fff":C.grey[200]}}>
                    <div style={{width:20,height:20,borderRadius:6,background:sc?tc:C.grey[300],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <span style={{fontSize:10,fontWeight:700,color:"#fff"}}>{sc?"✓":"–"}</span>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:sc?600:400,color:sc?C.grey[800]:C.grey[500],fontFamily:font}}>{f.label}</div>
                      <div style={{fontSize:12,color:C.grey[500],fontFamily:font,marginTop:1}}>{f.value} · {f.criteria}</div>
                    </div>
                    <div style={{flexShrink:0,textAlign:"right"}}>
                      <span style={{fontSize:14,fontWeight:700,color:sc?tc:C.grey[400],fontFamily:font}}>{sc?`+${f.earnedPts}`:"+0"}</span>
                      <span style={{fontSize:12,color:C.grey[400],fontFamily:font,marginLeft:2}}>/{f.maxPts}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div style={{background:C.grey[200],borderRadius:10,border:`1px solid ${C.grey[300]}`,padding:"14px 16px",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
                <span style={{fontSize:16}}>💡</span>
                <span style={{fontSize:14,fontWeight:700,color:C.grey[800],fontFamily:font}}>Recommended Actions</span>
              </div>
              {t.actions.map((a,i) => (
                <div key={i} style={{display:"flex",gap:8,alignItems:"flex-start",marginBottom:i<t.actions.length-1?8:0,fontSize:14,color:C.grey[700],fontFamily:font,lineHeight:1.5}}>
                  <span style={{color:C.grey[500],flexShrink:0,marginTop:1}}>·</span>{a}
                </div>
              ))}
            </div>
            <div style={{background:C.success[100],border:"1px solid rgba(56,128,50,0.2)",borderRadius:10,padding:"12px 16px"}}>
              <div style={{fontSize:12,color:C.success[400],fontFamily:font,lineHeight:1.6,fontStyle:"italic"}}>
                <strong style={{fontStyle:"normal"}}>Evidence Base:</strong> Transfusion Risk Score validated in cardiac surgery populations (Karkouti et al., Anesthesiology 2006). Predictive accuracy for perioperative transfusion requirement: AUC 0.78–0.82.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── ACOG Risk Score Modal — mirrors TRS drawer exactly ────────────
const ACOGModal = ({p, onClose}) => {
  const acog = p._acog;
  const ac = acog.color; // accent colour for this score

  const riskDesc = {
    "critical": "Critical risk for severe maternal morbidity. Immediate intervention required.",
    "high":     "High risk for severe maternal morbidity. Specialist consultation required.",
    "medium":   "Moderate risk. Enhanced monitoring and iron optimization recommended.",
    "low":      "Low maternal morbidity risk. Routine prenatal monitoring is sufficient.",
  }[acog.score>=80?"critical":acog.score>=60?"high":acog.score>=40?"medium":"low"];

  // Recommended actions per risk tier — mirrors TRS actions pattern
  const actions = acog.score >= 80
    ? ["Initiate IV iron therapy — Ferric Carboxymaltose STAT","MFM consultation for high-risk monitoring","Type & screen — peripartum transfusion risk elevated","Target Hgb ≥11 g/dL before delivery","CBC recheck in 24–48h"]
    : acog.score >= 60
    ? ["IV iron therapy — Ferric Carboxymaltose 750mg within 14 days","MFM consultation recommended","Recheck Hgb + Ferritin in 7–10 days","Target Hgb ≥11 g/dL by 34 weeks gestation"]
    : acog.score >= 40
    ? ["Enhanced anemia monitoring — CBC every 4 weeks","Consider IV iron if Hgb <11 g/dL","Obstetric follow-up with risk reassessment"]
    : ["Routine prenatal monitoring","Oral iron supplementation if Hgb <11 g/dL","Standard CBC schedule per OB protocol"];

  // Condition breakdown rows — full 12-condition master list
  const earnedNames = new Set(acog.contribs.map(c=>c.name));

  return (
    <div style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)"}} onClick={onClose}>
      <div style={{width:580,maxHeight:"85vh",background:C.grey[100],borderRadius:16,display:"flex",flexDirection:"column",boxShadow:"0 24px 80px rgba(0,0,0,0.25)",overflow:"hidden"}} onClick={e=>e.stopPropagation()}>

        {/* ── Header — mirrors TRS ── */}
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",gap:12,flexShrink:0,background:"#fff"}}>
          <div style={{width:36,height:36,borderRadius:10,background:C.grey[200],display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.grey[700]} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:16,fontWeight:700,color:C.grey[800],fontFamily:font,lineHeight:1.2}}>ACOG Risk Score</div>
            <div style={{fontSize:12,color:C.grey[600],fontFamily:font,marginTop:2}}>{p.name} · MRN {p.id}</div>
          </div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,background:C.grey[200],border:"none",color:C.grey[600],fontSize:16,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:font,lineHeight:1}}>✕</button>
        </div>

        {/* ── Score hero ── */}
        <div style={{padding:"24px 28px",borderBottom:`1px solid ${C.grey[300]}`,flexShrink:0,background:"#fff"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>

            {/* Total */}
            <div style={{background:C.grey[200],borderRadius:12,padding:"20px 24px",textAlign:"center",flex:1}}>
              <div style={{fontSize:48,fontWeight:500,color:ac,fontFamily:font,lineHeight:1,letterSpacing:"-0.03em"}}>{acog.score}</div>
              <div style={{fontSize:12,fontWeight:600,color:ac,fontFamily:font,marginTop:8}}>Total ACOG Score</div>
            </div>

            <div style={{fontSize:24,color:C.grey[400],fontWeight:400,flexShrink:0}}>=</div>

            {/* Baseline */}
            <div style={{background:C.grey[200],borderRadius:12,padding:"20px 24px",textAlign:"center",flex:1}}>
              <div style={{fontSize:32,fontWeight:500,color:"#003E7C",fontFamily:font,lineHeight:1,letterSpacing:"-0.02em"}}>{acog.baseline}</div>
              <div style={{fontSize:12,fontWeight:600,color:"#003E7C",fontFamily:font,marginTop:8}}>Baseline Risk</div>
            </div>

            <div style={{fontSize:24,color:C.grey[400],fontWeight:400,flexShrink:0}}>+</div>

            {/* Condition Points */}
            <div style={{background:C.grey[200],borderRadius:12,padding:"20px 24px",textAlign:"center",flex:1}}>
              <div style={{fontSize:32,fontWeight:500,color:ac,fontFamily:font,lineHeight:1,letterSpacing:"-0.02em"}}>{acog.condPts}</div>
              <div style={{fontSize:12,fontWeight:600,color:ac,fontFamily:font,marginTop:8}}>Condition Points</div>
            </div>

          </div>
        </div>

        {/* ── Scrollable body — mirrors TRS body exactly ── */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 20px",display:"flex",flexDirection:"column",gap:12,background:"#fff"}}>

          {/* Condition Breakdown — same bordered list as TRS Score Breakdown */}
          <div>
            <div style={{fontSize:12,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:C.grey[600],fontFamily:font,marginBottom:8}}>Condition Contributions</div>
            <div style={{background:"#fff",borderRadius:10,overflow:"hidden",border:`1px solid ${C.grey[300]}`}}>
              {ACOG_CONDITIONS.map((cond, i) => {
                const earned = earnedNames.has(cond.name);
                const pts = earned ? cond.pts : 0;
                return (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderBottom:i<ACOG_CONDITIONS.length-1?`1px solid ${C.grey[300]}`:"none",background:earned?"#fff":C.grey[200]}}>
                    <ConditionIcon name={cond.name} size={18}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:14,fontWeight:earned?600:400,color:earned?C.grey[800]:C.grey[500],fontFamily:font}}>{cond.name}</div>
                      <div style={{fontSize:12,color:C.grey[500],fontFamily:font,marginTop:1}}>ICD-10: {cond.icd}</div>
                    </div>
                    <div style={{flexShrink:0,textAlign:"right"}}>
                      <span style={{fontSize:14,fontWeight:700,color:earned?ac:C.grey[400],fontFamily:font}}>{earned?`+${pts}`:"+0"}</span>
                      <span style={{fontSize:12,color:C.grey[400],fontFamily:font,marginLeft:2}}>/{cond.pts}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clinical Recommendations — Image 4 */}
          <div style={{background:"#fff",border:`1px solid ${C.grey[300]}`,borderRadius:10,padding:"14px 16px"}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <span style={{fontSize:16}}>🎯</span>
              <span style={{fontSize:14,fontWeight:700,color:C.grey[800],fontFamily:font}}>Clinical Recommendations</span>
            </div>
            <div style={{fontSize:14,color:C.grey[700],fontFamily:font,lineHeight:1.6,marginBottom:14}}>
              Based on ACOG Practice Bulletin #233 and the patient's risk profile, immediate intervention is recommended to prevent severe maternal morbidity.
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              <div style={{background:C.grey[200],borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:10,fontWeight:600,color:C.grey[500],fontFamily:font,marginBottom:4}}>Recommended Order</div>
                <div style={{fontSize:14,fontWeight:600,color:C.grey[800],fontFamily:font}}>{p.order}</div>
              </div>
              <div style={{background:C.grey[200],borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:10,fontWeight:600,color:C.grey[500],fontFamily:font,marginBottom:4}}>Expected Outcome</div>
                <div style={{fontSize:14,fontWeight:700,color:C.success[400],fontFamily:font}}>60–70% SMM reduction</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// ── Overview Zone (identical structure to BloodHealth, OB data) ────
const OverviewZone = ({p, onNavigate}) => {
  const hgbLab = p.labs[0];
  const draws = hgbLab.draws||[]; const hasDelta = draws.length>=2;
  const currentHgb = parseFloat(hgbLab.value);
  const baselineHgb = hasDelta ? draws[0].value : currentHgb;
  const delta = hasDelta ? Math.abs(draws[draws.length-1].value - draws[0].value).toFixed(1) : null;
  const isDown = hasDelta && draws[draws.length-1].value < draws[0].value;
  const deltaHbPct = hasDelta&&isDown ? Math.round(((baselineHgb-currentHgb)/baselineHgb)*100) : null;
  const isDeltaRisk = deltaHbPct!==null && deltaHbPct>=50;
  const trs = p._trs; const tc = TRC[trs.trsSev]; const acog = p._acog;
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
        {/* Five value columns: HGB · Ferritin · ACOG · TRS · Active Order */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1.4fr",borderBottom:`1px solid ${C.grey[200]}`}}>
          <div style={{padding:"14px 18px",borderRight:`1px solid ${C.grey[200]}`}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>HGB</div>
            <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:4}}>
              <span style={{fontSize:32,fontWeight:500,color:hgbColor,fontFamily:font,lineHeight:1,letterSpacing:"-0.02em"}}>{hgbLab.value}</span>
              <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>g/dL</span>
            </div>
            {hasDelta && <div style={{display:"inline-flex",alignItems:"center",gap:3,background:isDown?C.error[100]:C.success[100],borderRadius:4,padding:"2px 7px",marginBottom:4}}>
              <span style={{fontSize:12,fontWeight:700,color:isDown?C.error[400]:C.success[400]}}>{isDown?"↓":"↑"}</span>
              <span style={{fontSize:12,fontWeight:600,color:isDown?C.error[400]:C.success[400],fontFamily:font}}>{delta} g/dL</span>
            </div>}
            <div><SevChip tier={getAnemiaGrade(hgbLab.value).tier}/></div>
          </div>
          <div style={{padding:"14px 18px",borderRight:`1px solid ${C.grey[200]}`}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>Ferritin</div>
            <div style={{display:"flex",alignItems:"baseline",gap:3,marginBottom:4}}>
              <span style={{fontSize:32,fontWeight:500,color:ferColor,fontFamily:font,lineHeight:1,letterSpacing:"-0.02em"}}>{p.labs[1].value}</span>
              <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>ng/mL</span>
            </div>
            <StatusChip status={p.labs[1].status}/>
          </div>
          <div style={{padding:"14px 18px",borderRight:`1px solid ${C.grey[200]}`}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>ACOG Score</div>
            <div style={{fontSize:32,fontWeight:500,color:acog.color,fontFamily:font,lineHeight:1,marginBottom:4,letterSpacing:"-0.02em"}}>{acog.score}</div>
            <SevChip tier={acogTier(acog.cat)}/>
          </div>
          <div style={{padding:"14px 18px",borderRight:`1px solid ${C.grey[200]}`}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:4}}>TRS</div>
            <TRSGauge value={trs.score} color={tc} size={64}/>
            <div style={{marginTop:4}}><SevChip tier={trsTier(trs.trsSev)}/></div>
          </div>
          <div style={{padding:"14px 18px"}}>
            <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:C.grey[500],fontFamily:font,marginBottom:6}}>Active Order</div>
            <div style={{fontSize:14,fontWeight:600,color:C.grey[800],fontFamily:font,lineHeight:1.5}}>{p.order}</div>
          </div>
        </div>
      </div>

      {/* AI Insight + Care Plan — merged */}
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
              Review & Deploy Medication <ArrowRight size={13}/>
            </button>
          </div>
        </div>
      </div>

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
    {role:"ai", text:`🗒️ ACOG RISK ASSESSMENT SUMMARY

**Obstetric Patient**: Hgb ${p.labs[0].value} g/dL during pregnancy
**Risk Category**: ${p._acog.score>=80?"CRITICAL RISK":"HIGH RISK"} for Severe Maternal Morbidity

🔑 KEY CONCERNS PER ACOG GUIDELINES

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

  const steps = ["Diagnose","Care Plan"];
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
          <div style={{fontSize:32,fontWeight:700,color:C.grey[800],fontFamily:font,marginBottom:14}}>Care Plan Approved Successfully</div>
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
              <div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"rgba(255,255,255,0.5)",fontFamily:font,marginBottom:8}}>AI Diagnosis & Recommendation · {p.aiConfidence}% Confidence</div>
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

          <StepActions onNext={()=>setStep(1)} nextLabel="Attest & Generate Care Plan →"/>
        </div>}

        {/* ══ STEP 1: CARE PLAN ══ */}
        {step===1 && <div>
          <StepHeader eyebrow="Evidence-Based Care Plan" title="ACOG Evidence-Based Care Plan"/>

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
              {num:"3. Specialist",       title:s==="Critical"?"MFM Consultation — STAT":"MFM Consultation — within 2 weeks", detail:`ACOG risk score ${p._acog.score} — ${p._acog.cat}`},
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

// ── Patient Header — IQ Assistant button on far right ─────────────
const PatientHeader = ({p, onOpenIQ}) => {
  const aGrade = getAnemiaGrade(p.labs[0].value);
  return (
    <div style={{background:"#fff",borderBottom:`1px solid ${C.grey[300]}`,flexShrink:0,padding:"12px 20px",display:"flex",alignItems:"center",gap:16}}>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
          <span style={{fontSize:18,fontWeight:700,color:C.grey[800],fontFamily:font}}>{p.name}</span>
          <SevChip tier={getAnemiaGrade(p.labs[0].value).tier}/>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4,marginBottom:0,flexWrap:"wrap"}}>
          <Stethoscope size={11} color={C.grey[500]}/><span style={{fontSize:12,fontWeight:600,color:C.grey[700],fontFamily:font}}>{p.provider}</span>
          <span style={{fontSize:12,color:C.grey[400],margin:"0 2px"}}>·</span>
          <Hash size={11} color={C.grey[500]}/><span style={{fontSize:12,color:C.grey[700],fontFamily:font}}>MRN {p.id}</span>
          <span style={{fontSize:12,color:C.grey[400],margin:"0 2px"}}>·</span>
          <User size={11} color={C.grey[500]}/><span style={{fontSize:12,color:C.grey[700],fontFamily:font}}>Age {p.age} · {p.sex}</span>
          <span style={{fontSize:12,color:C.grey[400],margin:"0 2px"}}>·</span>
          <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>NPI</span><span style={{fontSize:12,color:C.grey[700],fontFamily:font,marginLeft:3}}>{p.npi}</span>
          <span style={{fontSize:12,color:C.grey[400],margin:"0 2px"}}>·</span>
          <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>Obstetric History</span><span style={{fontSize:12,fontWeight:600,color:C.grey[700],fontFamily:font,marginLeft:3}}>{p.parity}</span>
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
    {[{id:"overview",label:"Clinical Decision Support",Icon:User},{id:"cp",label:"Care Plan",Icon:ClipboardList}].map(({id,label,Icon}) => {
      const a = active===id;
      return <div key={id} onClick={()=>onChange(id)} style={{display:"flex",alignItems:"center",gap:6,padding:"10px 16px 9px",borderBottom:a?`2px solid ${C.primary[500]}`:"2px solid transparent",cursor:"pointer",fontSize:14,fontWeight:a?600:400,color:a?C.grey[800]:C.grey[500],fontFamily:font,marginBottom:-1,transition:"all 0.12s",whiteSpace:"nowrap"}}><Icon size={14} strokeWidth={1.5} color={a?C.primary[500]:C.grey[500]}/>{label}</div>;
    })}
  </div>
);



// ── Mini Worklist (same as BloodHealth) ───────────────────────────
const MiniWorklist = ({patients,activeId,onSelect,onBack}) => (
  <div style={{width:240,flexShrink:0,background:"#fff",borderRight:`1px solid ${C.grey[300]}`,display:"flex",flexDirection:"column",overflow:"hidden",height:"100%"}}>
    <div onClick={onBack} style={{padding:"10px 16px",borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",gap:6,cursor:"pointer",minHeight:44}} onMouseEnter={e=>e.currentTarget.style.background=C.grey[200]} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
      <ChevronLeft size={13} strokeWidth={2.5} color={C.grey[500]}/>
      <span style={{fontSize:12,fontWeight:600,color:C.grey[600],fontFamily:font}}>OB Anemia Worklist</span>
    </div>
    <div style={{flex:1,overflowY:"auto",minHeight:0}}>
      {patients.map(p => {
        const a = p.id===activeId;
        const cpC = p.carePlanStatus==="generated"?C.success[400]:p.carePlanStatus==="in-progress"?C.orange[400]:C.grey[400];
        return (
          <div key={p.id} onClick={()=>onSelect(p)} style={{padding:"12px 16px",borderBottom:`1px solid ${C.grey[300]}`,borderLeft:`3px solid ${a?C.primary[500]:"transparent"}`,background:a?C.primary[100]:"transparent",cursor:"pointer",transition:"background 0.12s"}}
            onMouseEnter={e=>{if(!a)e.currentTarget.style.background=C.grey[200];}}
            onMouseLeave={e=>{if(!a)e.currentTarget.style.background="transparent";}}>
            <div style={{fontSize:14,fontWeight:600,color:a?C.primary[500]:C.grey[800],fontFamily:font,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",marginBottom:2}}>{p.name}</div>

            <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:4}}>
              <span style={{fontSize:10,fontWeight:600,color:C.grey[700],background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:4,padding:"1px 6px",fontFamily:font}}>{p.parity}</span>
              <span style={{fontSize:10,fontWeight:600,color:C.grey[700],background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:4,padding:"1px 6px",fontFamily:font}}>{p.gestAge.replace(" wks","W")}</span>
              <span style={{fontSize:10,fontWeight:600,color:C.grey[700],background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:4,padding:"1px 6px",fontFamily:font}}>{p.caseType}</span>
            </div>
            {p.carePlanStatus!=="pending" && <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:5,height:5,borderRadius:"50%",background:cpC,flexShrink:0}}/><span style={{fontSize:10,color:cpC,fontFamily:font,fontWeight:600}}>{p.carePlanStatus==="generated"?"CP Generated":"CP In Progress"}</span></div>}
          </div>
        );
      })}
    </div>
  </div>
);

// ── Patient Workspace (same structure as BloodHealth) ─────────────
const PatientWorkspace = ({patient,allPatients,onBack,onSelectPatient,defaultZone="overview"}) => {
  const [zone, setZone]         = useState(defaultZone==="ai"?"overview":defaultZone);
  const [iqOpen, setIqOpen]     = useState(false);
  const [iqExpanded, setIqExpanded] = useState(false);
  return (
    <div style={{display:"flex",flexDirection:"column",flex:1,minHeight:0,fontFamily:font,background:C.grey[200]}}>
      {/* Top nav */}
      <div style={{height:56,flexShrink:0,background:C.grey[100],borderBottom:`1px solid ${C.grey[300]}`,display:"flex",alignItems:"center",padding:"0 24px"}}>
        <span style={{fontSize:14,fontWeight:700,fontFamily:font,flexShrink:0,marginRight:16}}><span style={{color:C.grey[800]}}>hc</span><span style={{color:C.orange[400]}}>1</span><span style={{color:C.grey[800]}}> ClinicalIQ</span></span>
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
        <MiniWorklist patients={allPatients} activeId={patient.id} onSelect={p=>{onSelectPatient(p);setZone("overview");setIqOpen(false);}} onBack={onBack}/>
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
          <PatientHeader p={patient} onOpenIQ={()=>setIqOpen(o=>!o)}/>
          <ZoneTabs active={zone} onChange={setZone}/>
          <div style={{flex:1,display:"flex",overflow:"hidden",minHeight:0}}>
            <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
              {zone==="overview" && <OverviewZone p={patient} onNavigate={setZone}/>}
              {zone==="cp"       && <CarePlanZone p={patient}/>}
            </div>
            {iqOpen && <IQAssistantPanel p={patient} onClose={()=>setIqOpen(false)} expanded={iqExpanded} onToggleExpand={()=>setIqExpanded(e=>!e)}/>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Worklist Row (same columns as BloodHealth, OB data) ───────────
const PatientRow = ({p, onOpen, onOpenACOG}) => {
  const [trsOpen, setTrsOpen] = useState(false);
  const tc = TRC[p._trs.trsSev];
  const ferC = p.labs[1].status==="critical"?C.error[400]:p.labs[1].status==="high"||p.labs[1].status==="borderline"?C.orange[400]:C.grey[600];
  return (
    <>
      <tr style={{borderBottom:`1px solid ${C.grey[300]}`,cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background=C.grey[200]} onMouseLeave={e=>e.currentTarget.style.background="transparent"} onClick={()=>onOpen(p,"overview")}>

        {/* PATIENT */}
        <td style={{padding:"12px 16px",minWidth:190}}>
          <span style={{fontSize:14,fontWeight:600,color:C.grey[800],fontFamily:font,display:"block",marginBottom:2}}>{p.name}</span>
          <span style={{fontSize:12,color:C.grey[500],fontFamily:font,display:"block",marginBottom:5}}>MRN {p.id} · Age {p.age}</span>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            <span style={{fontSize:10,fontWeight:600,color:C.grey[700],background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:4,padding:"2px 6px",fontFamily:font}}>{p.parity}</span>
            <span style={{fontSize:10,fontWeight:600,color:C.grey[700],background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:4,padding:"2px 6px",fontFamily:font}}>{p.gestAge.replace(" wks","W")}</span>
            <span style={{fontSize:10,fontWeight:600,color:C.grey[700],background:C.grey[200],border:`1px solid ${C.grey[300]}`,borderRadius:4,padding:"2px 6px",fontFamily:font}}>{p.caseType}</span>
          </div>
        </td>

        {/* LAB VALUES */}
        <td style={{padding:"12px 16px",minWidth:190}}>
          <div style={{display:"flex",gap:14}}>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:C.grey[600],textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:font,marginBottom:3}}>HGB</div>
              <div style={{display:"flex",alignItems:"baseline",gap:2,marginBottom:4}}><span style={{fontSize:20,fontWeight:500,color:getAnemiaGrade(p.labs[0].value).color,fontFamily:font,letterSpacing:"-0.01em"}}>{p.labs[0].value}</span><span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>g/dL</span></div>
              <SevChip tier={getAnemiaGrade(p.labs[0].value).tier}/>
            </div>
            <div style={{width:"0.5px",background:C.grey[300],alignSelf:"stretch"}}/>
            <div>
              <div style={{fontSize:12,fontWeight:700,color:C.grey[600],textTransform:"uppercase",letterSpacing:"0.06em",fontFamily:font,marginBottom:3}}>Ferritin</div>
              <div style={{display:"flex",alignItems:"baseline",gap:2,marginBottom:4}}><span style={{fontSize:20,fontWeight:500,color:ferC,fontFamily:font,letterSpacing:"-0.01em"}}>{p.labs[1].value}</span><span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>ng/mL</span></div>
              <StatusChip status={p.labs[1].status}/>
            </div>
          </div>
        </td>

        {/* TRS */}
        <td style={{padding:"12px 16px",minWidth:95}} onClick={e=>{e.stopPropagation();setTrsOpen(v=>!v);}}>
          <div style={{cursor:"pointer",display:"inline-block"}}>
            <TRSGauge value={p._trs.score} color={tc} size={52}/>
            <div style={{marginTop:3}}><SevChip tier={trsTier(p._trs.trsSev)}/></div>
          </div>
        </td>

        {/* ACOG RISK SCORE */}
        <td style={{padding:"12px 16px",minWidth:110}} onClick={e=>{e.stopPropagation();onOpenACOG(p);}}>
          <div style={{cursor:"pointer",display:"inline-block"}}>
            <div style={{display:"flex",alignItems:"baseline",gap:2,marginBottom:4}}>
              <span style={{fontSize:20,fontWeight:500,color:p._acog.color,fontFamily:font,letterSpacing:"-0.01em"}}>{p._acog.score}</span>
              <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>/100</span>
            </div>
            <SevChip tier={acogTier(p._acog.cat)}/>
            <div style={{fontSize:10,color:C.grey[600],fontFamily:font,marginTop:4,fontWeight:500}}>{p._acog.contribs.length} factor{p._acog.contribs.length!==1?"s":""}</div>
          </div>
        </td>

        {/* ACTIVE ORDER */}
        <td style={{padding:"12px 16px",minWidth:180}}><span style={{fontSize:12,color:C.grey[700],fontFamily:font,lineHeight:1.4}}>{p.order}</span></td>

        {/* PROVIDER */}
        <td style={{padding:"12px 16px",minWidth:120}}>
          <div style={{fontSize:14,fontWeight:600,color:C.grey[800],fontFamily:font}}>{p.provider}</div>
          <div style={{fontSize:12,color:C.grey[500],fontFamily:font,marginTop:2}}>{p.providerRole}</div>
        </td>

        {/* ANEMIA SEVERITY */}
        <td style={{padding:"12px 16px",minWidth:110}}>{(()=>{
          const ag = getAnemiaGrade(p.labs[0].value);
          return <div><SevChip tier={ag.tier}/></div>;
        })()}</td>

        {/* ACTIONS */}
        <td style={{padding:"12px 16px",minWidth:150}} onClick={e=>e.stopPropagation()}>
          <button onClick={()=>onOpen(p,"cp")} style={{background:C.primary[600],color:"#fff",border:"none",borderRadius:6,padding:"6px 12px",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:font,display:"flex",alignItems:"center",gap:4,whiteSpace:"nowrap"}}>Generate Care Plan <ArrowRight size={11}/></button>
        </td>
      </tr>
      {trsOpen && <TRSDrawer p={p} onClose={()=>setTrsOpen(false)}/>}
    </>
  );
};

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen]        = useState("worklist");
  const [activePatient, setActivePatient] = useState(null);
  const [defaultZone, setDefaultZone]     = useState("overview");
  const [acogPatient, setAcogPatient]     = useState(null);
  const [search, setSearch]        = useState("");
  const [ctFilter, setCtFilter]    = useState("All Case Types");
  const [sevFilter, setSevFilter]  = useState("All Severity");

  if(screen==="workspace" && activePatient)
    return (
      <><GlobalReset/><div style={{height:"100dvh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        <PatientWorkspace patient={activePatient} allPatients={PATIENTS} onBack={()=>setScreen("worklist")} onSelectPatient={p=>setActivePatient(p)} defaultZone={defaultZone}/>
      </div></>
    );

  const COLS = ["PATIENT / GA","LAB VALUES","TRS","ACOG RISK","ACTIVE ORDER","PROVIDER","ANEMIA SEVERITY","ACTIONS"];
  const filtered = PATIENTS.filter(p => {
    const ag = getAnemiaGrade(p.labs[0].value);
    return (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase()) || p.provider.toLowerCase().includes(search.toLowerCase()))
      && (ctFilter==="All Case Types" || p.caseType===ctFilter)
      && (sevFilter==="All Severity"  || ag.label===sevFilter);
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
            <div style={{position:"relative",width:260}}>
              <Search size={13} color={C.grey[500]} style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search patients, MRN, provider..." style={{width:"100%",boxSizing:"border-box",padding:"7px 10px 7px 30px",border:`1px solid ${C.grey[300]}`,borderRadius:8,fontSize:12,color:C.grey[800],background:C.grey[100],outline:"none",fontFamily:font}}/>
            </div>
            <div style={{flex:1}}/>
            <Filter size={13} color={C.grey[500]}/><span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>Filter by:</span>
            {[{v:ctFilter,s:setCtFilter,o:CASE_TYPES},{v:sevFilter,s:setSevFilter,o:["All Severity","Critical","High","Low"]}].map((dd,i) => (
              <div key={i} style={{position:"relative"}}>
                <select value={dd.v} onChange={e=>dd.s(e.target.value)} style={{appearance:"none",padding:"6px 26px 6px 10px",border:`1px solid ${C.grey[300]}`,borderRadius:8,fontSize:12,color:C.grey[700],background:C.grey[100],cursor:"pointer",outline:"none",fontFamily:font}}>
                  {dd.o.map(o=><option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={10} color={C.grey[500]} style={{position:"absolute",right:7,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}/>
              </div>
            ))}
          </div>

          {/* Table */}
          <div style={{flex:1,overflowY:"auto",overflowX:"auto",minHeight:0}}>
            <table style={{width:"100%",borderCollapse:"collapse"}}>
              <thead>
                <tr style={{background:C.grey[200],borderBottom:`1px solid ${C.grey[300]}`}}>
                  {COLS.map(h => <th key={h} style={{fontSize:12,fontWeight:700,letterSpacing:"0.06em",color:C.grey[600],textAlign:"left",padding:"10px 16px",textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:font}}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.length===0
                  ? <tr><td colSpan={COLS.length} style={{padding:24,textAlign:"center",fontSize:14,color:C.grey[500],fontFamily:font}}>No patients match</td></tr>
                  : filtered.map(p => <PatientRow key={p.id} p={p}
                      onOpen={(p,zone="overview")=>{setActivePatient(p);setDefaultZone(zone);setScreen("workspace");}}
                      onOpenACOG={p=>setAcogPatient(p)}/>)
                }
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div style={{padding:"9px 16px",borderTop:`1px solid ${C.grey[300]}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:C.grey[500],fontFamily:font}}>Showing {filtered.length} of {PATIENTS.length} patients</span>
            <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:6,height:6,borderRadius:"50%",background:C.success[400]}}/><span style={{fontSize:12,color:C.success[400],fontFamily:font}}>FHIR R4 Live · Synced 2 min ago</span></div>
          </div>
        </div>
      </div>

      {/* ACOG Modal */}
      {acogPatient && <ACOGModal p={acogPatient} onClose={()=>setAcogPatient(null)}/>}
    </div></>
  );
}