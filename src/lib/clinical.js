/* HerCare clinical data and scoring, moved unchanged from the original App.jsx (colours removed: the UI maps tiers to design-system tokens). */

export const CANCELLATION_REASONS = [
  "Cancelled/Postponed visit",
  "Insurance denied treatment",
  "No contact from patient",
  "Patient declines treatment",
  "Patient treatment plan complete",
];

export const mhrTier=(cat)=>cat==="Very High"?"severe":cat==="High"?"moderate":cat==="Intermediate"?"mild":"normal";
export const CASE_TYPES = ["All Case Types","OB Surgical","OB Non-Surgical","Postpartum"];
export const normSev=(s)=>s==="critical"?"critical":s==="high"||s==="borderline"?"high":"low";

// ── Maternal Health Risk Score — 6-domain engine (max 74) ──────
export const MHR_DOMAINS = [
  {id:"hematologic",  name:"Hematologic Reserve",              cap:16, icon:"🩸"},
  {id:"placental",   name:"Placental & Hemorrhage Risk",      cap:20, icon:"🩺"},
  {id:"delivery",    name:"Delivery & Obstetric History",      cap:10, icon:"📋"},
  {id:"demographics",name:"Maternal Demographics & Physiology",cap:6,  icon:"👤"},
  {id:"comorbidities",name:"Maternal Comorbidities",           cap:17, icon:"🏥"},
  {id:"medication",  name:"Medication & Treatment Factors",    cap:5,  icon:"💊"},
];
export const MHR_TIERS = [
  {min:0,  label:"Low",         tier:"normal",   interp:"No major identified maternal health risk factors"},
  {min:10, label:"Intermediate", tier:"mild",     interp:"One or more meaningful maternal health risk factors present"},
  {min:20, label:"High",         tier:"moderate", interp:"Multiple or significant maternal health risk factors; pre-delivery optimization recommended"},
  {min:35, label:"Very High",    tier:"severe",   interp:"Major maternal health risk; multidisciplinary planning and blood-bank preparedness recommended"},
];
export const mhrTierInfo=(score)=>MHR_TIERS.reduce((a,t)=>score>=t.min?t:a,MHR_TIERS[0]);
export const calcMHR = (p) => {
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
  return {score,cat:ti.label,tier:ti.tier,interp:ti.interp,domains,maxPossible:74,activeDomains,drivers,modifiableDrivers,nonModifiableDrivers,missing,calcComplete:missing.length===0};
};

// ── Patient data — 7 patients covering Critical / High / Low severity ──
export const FACILITIES = ["North Aux Hospital", "Main Hospital"];

export const PATIENTS = [
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

export const getAnemiaGrade = (hgb) => {
  const h = parseFloat(hgb);
  if(h > 13.0) return {label:"No Anemia", tier:"normal"};
  if(h >= 11.1) return {label:"Mild",     tier:"mild"};
  if(h >= 8.1)  return {label:"Moderate", tier:"moderate"};
  return               {label:"Severe",   tier:"severe"};
};
