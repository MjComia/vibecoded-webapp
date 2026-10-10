import { Router } from "express";
import { supabase } from "../config/supabase.js";

export const taxonomyRouter = Router();

// Fallback seed taxonomy when offline or initializing
const DEFAULT_TAXONOMY = {
  "NCLEX-RN": [
    {
      code: "NCLEX-PHARM",
      name: "Pharmacology & Parenteral Therapies",
      description: "Drug calculations, adverse effects, contraindications, and medication rights",
      topics: [
        "Cardiac Glycosides & Antiarrhythmics",
        "Anticoagulants & Thrombolytics",
        "Insulin, Hypoglycemics & Endocrine Agents",
        "Psychotropic Medications & Lithium",
      ],
    },
    {
      code: "NCLEX-MEDSURG",
      name: "Physiological Adaptation & Med-Surg",
      description: "Care for clients with acute, chronic, or life-threatening physical conditions",
      topics: [
        "Fluid & Electrolyte Imbalances",
        "Respiratory Distress & ABG Interpretation",
        "Renal Failure & Dialysis",
        "Shock & Hemodynamic Monitoring",
      ],
    },
    {
      code: "NCLEX-MCH",
      name: "Maternal & Child Health",
      description: "Antepartum, intrapartum, postpartum, newborn, and pediatric developmental stages",
      topics: [
        "Preeclampsia & HELLP Syndrome",
        "Labor Complications & Fetal Heart Rate Monitoring",
        "Neonatal Resuscitation & APGAR",
        "Pediatric Milestones & Vaccinations",
      ],
    },
    {
      code: "NCLEX-PSYCH",
      name: "Psychosocial Integrity",
      description: "Mental health alterations, crisis intervention, coping mechanisms, and defense mechanisms",
      topics: [
        "Defense Mechanisms",
        "Therapeutic Communication Techniques",
        "Schizophrenia & Mood Disorders",
        "Substance Withdrawal Syndromes",
      ],
    },
    {
      code: "NCLEX-MGMT",
      name: "Management of Care & Prioritization",
      description: "Delegation, assignment, ethics, informed consent, triage, and prioritization",
      topics: [
        "Prioritization Frameworks (ABCs, Maslow)",
        "Delegation to LPN / UAP",
        "Informed Consent & Patient Advocacy",
        "Infection Control & Precautions",
      ],
    },
  ],
  NLE: [
    {
      code: "NLE-PART1",
      name: "Part I: Foundation of Professional Nursing Practice",
      description: "Nursing jurisprudence, ethics, research, fundamentals of nursing practice, and leadership",
      topics: [
        "RA 9173 (Philippine Nursing Act of 2002)",
        "Code of Ethics & Patient Rights",
        "Basic Nursing Skills & Infection Control",
        "Nursing Process & Clinical Documentation",
      ],
    },
    {
      code: "NLE-PART2",
      name: "Part II: Community Health & Maternal-Child Nursing",
      description: "Primary health care, epidemiology, maternal, neonatal, and child health nursing",
      topics: [
        "DOH Programs & Primary Health Care (PHC)",
        "Expanded Program on Immunization (EPI)",
        "Maternal & Newborn Care Guidelines (EENC)",
        "Communicable Diseases in the Community",
      ],
    },
    {
      code: "NLE-PART3",
      name: "Part III: Care of Clients (Oxygenation, Fluid & Electrolytes)",
      description: "Cardiovascular, respiratory, hematologic, fluids and electrolytes, acid-base balance",
      topics: [
        "Oxygenation Alterations & CPR Protocols",
        "Fluid Volume Deficit & Excess",
        "Blood Transfusion Reactions & Protocols",
        "Myocardial Infarction & Heart Failure",
      ],
    },
    {
      code: "NLE-PART4",
      name: "Part IV: Care of Clients (Nutrition, Elimination, Metabolism)",
      description: "Gastrointestinal, endocrine, renal, urinary, metabolic disorders, and oncology",
      topics: [
        "Diabetes Mellitus (Type 1 & 2 Management)",
        "Chronic Kidney Disease & Glomerulonephritis",
        "Gastrointestinal Bleeding & Peptic Ulcer",
        "Chemotherapy & Radiation Safety",
      ],
    },
    {
      code: "NLE-PART5",
      name: "Part V: Care of Clients (Perception, Coordination, Psych)",
      description: "Neurologic, musculoskeletal, sensory alterations, acute psychiatry, and crisis intervention",
      topics: [
        "Increased ICP & Cerebrovascular Accidents",
        "Spinal Cord Injury & Autonomic Dysreflexia",
        "Crisis Intervention & Psychiatric Emergencies",
        "Therapeutic Nurse-Patient Relationship",
      ],
    },
  ],
};

taxonomyRouter.get("/", async (req, res) => {
  const exam = (req.query.exam as string)?.toUpperCase();

  try {
    // Attempt database query if Supabase is connected
    const { data: subjects, error } = await supabase
      .from("subjects")
      .select("*, topics(*)")
      .order("created_at", { ascending: true });

    if (!error && subjects && subjects.length > 0) {
      const filtered = exam && ["NLE", "NCLEX-RN"].includes(exam)
        ? subjects.filter((s: any) => s.exam_type === exam || s.exam_type === "BOTH")
        : subjects;
      return res.json({ success: true, source: "database", data: filtered });
    }
  } catch (err) {
    // Graceful fallback to default syllabus taxonomy
  }

  // Fallback to embedded curriculum taxonomy
  if (exam === "NLE") {
    return res.json({ success: true, source: "curriculum_seed", data: DEFAULT_TAXONOMY.NLE });
  } else if (exam === "NCLEX-RN") {
    return res.json({ success: true, source: "curriculum_seed", data: DEFAULT_TAXONOMY["NCLEX-RN"] });
  }

  return res.json({ success: true, source: "curriculum_seed", data: DEFAULT_TAXONOMY });
});
