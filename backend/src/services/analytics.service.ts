export interface TopicMastery {
  code: string;
  subject: string;
  topic: string;
  masteryPercentage: number;
  totalAnswered: number;
  correctCount: number;
  status: "critical" | "borderline" | "passing"; // <60% = critical, 60-74% = borderline, >=75% = passing
}

export interface ExamPartMastery {
  code: string;
  name: string;
  shortName: string;
  masteryPercentage: number;
  totalAnswered: number;
  topics: TopicMastery[];
  status: "critical" | "borderline" | "passing";
}

export interface AnalyticsSummary {
  exam: "NLE" | "NCLEX-RN";
  overallReadiness: number; // 0-100
  passingThreshold: number; // Fixed at 75% for PRC NLE standard
  minimumSubjectThreshold: number; // 60% PRC minimum
  passLikelihood: "Likely to Pass" | "Borderline" | "At Risk";
  totalQuestionsAnswered: number;
  accuracyRate: number; // 0-100
  flashcardsMastered: number;
  mockExamHighestScore: number;
  studyMinutesTotal: number;
  radarData: Array<{ subject: string; score: number; fullMark: number }>;
  parts: ExamPartMastery[];
  weakAreas: TopicMastery[];
  primaryWeakArea: TopicMastery | null;
  weakDrillRecommendation: {
    subject: string;
    topic: string;
    questionCount: number;
    targetScore: number;
  } | null;
}

// In-memory persistent state for tracking attempts
interface StudyRecord {
  timestamp: string;
  type: "quiz" | "mock" | "srs";
  subject: string;
  topic?: string;
  score: number;
  total: number;
}

const studyHistory: StudyRecord[] = [
  { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), type: "quiz", subject: "Part I: Foundation", topic: "Basic Nursing Skills & Infection Control", score: 9, total: 10 },
  { timestamp: new Date(Date.now() - 86400000 * 2).toISOString(), type: "srs", subject: "Part I: Foundation", topic: "RA 9173 (Philippine Nursing Act of 2002)", score: 18, total: 20 },
  { timestamp: new Date(Date.now() - 86400000 * 1.5).toISOString(), type: "quiz", subject: "Part II: Community Health", topic: "Expanded Program on Immunization (EPI)", score: 8, total: 10 },
  { timestamp: new Date(Date.now() - 86400000 * 1.2).toISOString(), type: "quiz", subject: "Part III: Care of Clients", topic: "Fluid Volume Deficit & Excess", score: 4, total: 10 },
  { timestamp: new Date(Date.now() - 86400000 * 1).toISOString(), type: "quiz", subject: "Part III: Care of Clients", topic: "Oxygenation Alterations & CPR Protocols", score: 5, total: 10 },
  { timestamp: new Date(Date.now() - 86400000 * 0.8).toISOString(), type: "quiz", subject: "Part IV: Care of Clients", topic: "Diabetes Mellitus (Type 1 & 2 Management)", score: 7, total: 10 },
  { timestamp: new Date(Date.now() - 86400000 * 0.5).toISOString(), type: "mock", subject: "Full Mock Exam", score: 74, total: 100 },
];

export class AnalyticsService {
  public static readonly PASSING_THRESHOLD = 75; // PRC Board standard: 75%
  public static readonly MINIMUM_SUBJECT_THRESHOLD = 60; // PRC standard: No rating below 60%

  public static getAnalytics(examType: "NLE" | "NCLEX-RN" = "NLE"): AnalyticsSummary {
    if (examType === "NLE") {
      return this.computeNLEAnalytics();
    } else {
      return this.computeNCLEXAnalytics();
    }
  }

  public static recordAttempt(record: {
    type: "quiz" | "mock" | "srs";
    subject: string;
    topic?: string;
    score: number;
    total: number;
  }): void {
    studyHistory.push({
      timestamp: new Date().toISOString(),
      ...record,
    });
  }

  private static computeNLEAnalytics(): AnalyticsSummary {
    // 5 Philippine NLE Parts
    const partsData: ExamPartMastery[] = [
      {
        code: "NLE-PART1",
        name: "Part I: Foundation of Professional Nursing Practice",
        shortName: "NP I: Fundamentals & Law",
        masteryPercentage: 86,
        totalAnswered: 240,
        status: "passing",
        topics: [
          { code: "NP1-T1", subject: "Part I", topic: "RA 9173 (Nursing Act of 2002)", masteryPercentage: 88, totalAnswered: 60, correctCount: 53, status: "passing" },
          { code: "NP1-T2", subject: "Part I", topic: "Code of Ethics & Patient Rights", masteryPercentage: 84, totalAnswered: 60, correctCount: 50, status: "passing" },
          { code: "NP1-T3", subject: "Part I", topic: "Basic Nursing Skills & Asepsis", masteryPercentage: 90, totalAnswered: 70, correctCount: 63, status: "passing" },
          { code: "NP1-T4", subject: "Part I", topic: "Nursing Process & Documentation", masteryPercentage: 82, totalAnswered: 50, correctCount: 41, status: "passing" },
        ],
      },
      {
        code: "NLE-PART2",
        name: "Part II: Community Health & Maternal-Child Nursing",
        shortName: "NP II: CHN & MCN",
        masteryPercentage: 79,
        totalAnswered: 310,
        status: "passing",
        topics: [
          { code: "NP2-T1", subject: "Part II", topic: "DOH Primary Health Care (PHC)", masteryPercentage: 82, totalAnswered: 90, correctCount: 74, status: "passing" },
          { code: "NP2-T2", subject: "Part II", topic: "Expanded Program on Immunization (EPI)", masteryPercentage: 85, totalAnswered: 80, correctCount: 68, status: "passing" },
          { code: "NP2-T3", subject: "Part II", topic: "Essential Intrapartum & Newborn Care (EENC)", masteryPercentage: 76, totalAnswered: 80, correctCount: 61, status: "passing" },
          { code: "NP2-T4", subject: "Part II", topic: "Communicable Disease Management", masteryPercentage: 73, totalAnswered: 60, correctCount: 44, status: "borderline" },
        ],
      },
      {
        code: "NLE-PART3",
        name: "Part III: Care of Clients (Oxygenation, Fluid & Electrolytes)",
        shortName: "NP III: Cardio-Resp & Fluids",
        masteryPercentage: 58, // < 60% Critical under PRC NLE!
        totalAnswered: 340,
        status: "critical",
        topics: [
          { code: "NP3-T1", subject: "Part III", topic: "Fluid Volume Deficit & IV Flow Rates", masteryPercentage: 46, totalAnswered: 110, correctCount: 51, status: "critical" },
          { code: "NP3-T2", subject: "Part III", topic: "Oxygenation & ABG Interpretation", masteryPercentage: 55, totalAnswered: 95, correctCount: 52, status: "critical" },
          { code: "NP3-T3", subject: "Part III", topic: "Myocardial Infarction & Arrhythmias", masteryPercentage: 64, totalAnswered: 75, correctCount: 48, status: "borderline" },
          { code: "NP3-T4", subject: "Part III", topic: "Blood Transfusion Reactions", masteryPercentage: 68, totalAnswered: 60, correctCount: 41, status: "borderline" },
        ],
      },
      {
        code: "NLE-PART4",
        name: "Part IV: Care of Clients (Nutrition, Elimination, Metabolism)",
        shortName: "NP IV: GI, Renal & Endocrine",
        masteryPercentage: 71,
        totalAnswered: 290,
        status: "borderline",
        topics: [
          { code: "NP4-T1", subject: "Part IV", topic: "Diabetes Mellitus & Insulin Regimens", masteryPercentage: 75, totalAnswered: 90, correctCount: 68, status: "passing" },
          { code: "NP4-T2", subject: "Part IV", topic: "Chronic Kidney Disease & Dialysis", masteryPercentage: 62, totalAnswered: 80, correctCount: 50, status: "borderline" },
          { code: "NP4-T3", subject: "Part IV", topic: "GI Bleeding & Peptic Ulcer Disease", masteryPercentage: 74, totalAnswered: 60, correctCount: 44, status: "borderline" },
          { code: "NP4-T4", subject: "Part IV", topic: "Chemotherapy & Radiation Oncology", masteryPercentage: 72, totalAnswered: 60, correctCount: 43, status: "borderline" },
        ],
      },
      {
        code: "NLE-PART5",
        name: "Part V: Care of Clients (Perception, Coordination, Psych)",
        shortName: "NP V: Neuro & Psychiatric",
        masteryPercentage: 77,
        totalAnswered: 260,
        status: "passing",
        topics: [
          { code: "NP5-T1", subject: "Part V", topic: "Increased ICP & Stroke Protocols", masteryPercentage: 76, totalAnswered: 70, correctCount: 53, status: "passing" },
          { code: "NP5-T2", subject: "Part V", topic: "Spinal Cord Injury & Autonomic Dysreflexia", masteryPercentage: 73, totalAnswered: 65, correctCount: 47, status: "borderline" },
          { code: "NP5-T3", subject: "Part V", topic: "Crisis Intervention & Psych Emergencies", masteryPercentage: 78, totalAnswered: 65, correctCount: 51, status: "passing" },
          { code: "NP5-T4", subject: "Part V", topic: "Therapeutic Communication", masteryPercentage: 81, totalAnswered: 60, correctCount: 49, status: "passing" },
        ],
      },
    ];

    // Calculate overall general average
    const totalPercentage = partsData.reduce((acc, p) => acc + p.masteryPercentage, 0);
    const overallReadiness = Math.round(totalPercentage / partsData.length);

    // PRC NLE Rule Evaluation:
    // General average must be >= 75%, and NO subject/part rating below 60%.
    const hasCriticalSubject = partsData.some((p) => p.masteryPercentage < this.MINIMUM_SUBJECT_THRESHOLD);
    let passLikelihood: "Likely to Pass" | "Borderline" | "At Risk";

    if (overallReadiness >= this.PASSING_THRESHOLD && !hasCriticalSubject) {
      passLikelihood = "Likely to Pass";
    } else if (overallReadiness >= 70 && !hasCriticalSubject) {
      passLikelihood = "Borderline";
    } else {
      passLikelihood = "At Risk"; // Below 75% or has a part < 60%
    }

    // Extract weak topics (<75%)
    const allTopics = partsData.flatMap((p) => p.topics);
    const weakAreas = allTopics.filter((t) => t.masteryPercentage < this.PASSING_THRESHOLD)
      .sort((a, b) => a.masteryPercentage - b.masteryPercentage);

    const primaryWeakArea = weakAreas[0] || null;

    const radarData = partsData.map((p) => ({
      subject: p.shortName,
      score: p.masteryPercentage,
      fullMark: 100,
    }));

    return {
      exam: "NLE",
      overallReadiness,
      passingThreshold: this.PASSING_THRESHOLD,
      minimumSubjectThreshold: this.MINIMUM_SUBJECT_THRESHOLD,
      passLikelihood,
      totalQuestionsAnswered: partsData.reduce((acc, p) => acc + p.totalAnswered, 0),
      accuracyRate: overallReadiness,
      flashcardsMastered: 184,
      mockExamHighestScore: 78,
      studyMinutesTotal: 1420,
      radarData,
      parts: partsData,
      weakAreas,
      primaryWeakArea,
      weakDrillRecommendation: primaryWeakArea ? {
        subject: primaryWeakArea.subject,
        topic: primaryWeakArea.topic,
        questionCount: 10,
        targetScore: 75,
      } : null,
    };
  }

  private static computeNCLEXAnalytics(): AnalyticsSummary {
    const partsData: ExamPartMastery[] = [
      {
        code: "NCLEX-MGMT",
        name: "Management of Care & Prioritization",
        shortName: "Management of Care",
        masteryPercentage: 80,
        totalAnswered: 310,
        status: "passing",
        topics: [
          { code: "NC-M1", subject: "Management", topic: "Prioritization (ABCs / Maslow)", masteryPercentage: 84, totalAnswered: 90, correctCount: 76, status: "passing" },
          { code: "NC-M2", subject: "Management", topic: "Delegation to LPN / UAP", masteryPercentage: 78, totalAnswered: 85, correctCount: 66, status: "passing" },
          { code: "NC-M3", subject: "Management", topic: "Informed Consent & Ethics", masteryPercentage: 79, totalAnswered: 70, correctCount: 55, status: "passing" },
          { code: "NC-M4", subject: "Management", topic: "Infection Control & Precautions", masteryPercentage: 80, totalAnswered: 65, correctCount: 52, status: "passing" },
        ],
      },
      {
        code: "NCLEX-PHARM",
        name: "Pharmacology & Parenteral Therapies",
        shortName: "Pharmacology",
        masteryPercentage: 54, // Critical
        totalAnswered: 350,
        status: "critical",
        topics: [
          { code: "NC-P1", subject: "Pharmacology", topic: "Cardiac Glycosides & Antidotes", masteryPercentage: 48, totalAnswered: 100, correctCount: 48, status: "critical" },
          { code: "NC-P2", subject: "Pharmacology", topic: "Anticoagulants (Heparin vs Warfarin)", masteryPercentage: 52, totalAnswered: 90, correctCount: 47, status: "critical" },
          { code: "NC-P3", subject: "Pharmacology", topic: "Insulin & Endocrine Agents", masteryPercentage: 58, totalAnswered: 80, correctCount: 46, status: "critical" },
          { code: "NC-P4", subject: "Pharmacology", topic: "Psychotropics & Lithium Toxicity", masteryPercentage: 60, totalAnswered: 80, correctCount: 48, status: "borderline" },
        ],
      },
      {
        code: "NCLEX-MEDSURG",
        name: "Physiological Adaptation & Med-Surg",
        shortName: "Physiological Adaptation",
        masteryPercentage: 69,
        totalAnswered: 380,
        status: "borderline",
        topics: [
          { code: "NC-MS1", subject: "Physiology", topic: "Fluid & Electrolyte Imbalances", masteryPercentage: 62, totalAnswered: 110, correctCount: 68, status: "borderline" },
          { code: "NC-MS2", subject: "Physiology", topic: "Respiratory & Mechanical Ventilation", masteryPercentage: 71, totalAnswered: 100, correctCount: 71, status: "borderline" },
          { code: "NC-MS3", subject: "Physiology", topic: "Hemodynamic Monitoring & Shock", masteryPercentage: 70, totalAnswered: 90, correctCount: 63, status: "borderline" },
          { code: "NC-MS4", subject: "Physiology", topic: "Renal Failure & Dialysis", masteryPercentage: 74, totalAnswered: 80, correctCount: 59, status: "borderline" },
        ],
      },
      {
        code: "NCLEX-MCH",
        name: "Maternal & Child Health",
        shortName: "Maternal & Child",
        masteryPercentage: 82,
        totalAnswered: 240,
        status: "passing",
        topics: [
          { code: "NC-MC1", subject: "Maternal", topic: "Preeclampsia & HELLP Syndrome", masteryPercentage: 81, totalAnswered: 70, correctCount: 57, status: "passing" },
          { code: "NC-MC2", subject: "Maternal", topic: "Fetal Heart Rate Monitoring (VEAL CHOP)", masteryPercentage: 86, totalAnswered: 60, correctCount: 52, status: "passing" },
          { code: "NC-MC3", subject: "Maternal", topic: "Pediatric Developmental Milestones", masteryPercentage: 80, totalAnswered: 60, correctCount: 48, status: "passing" },
          { code: "NC-MC4", subject: "Maternal", topic: "Neonatal Resuscitation & APGAR", masteryPercentage: 82, totalAnswered: 50, correctCount: 41, status: "passing" },
        ],
      },
      {
        code: "NCLEX-PSYCH",
        name: "Psychosocial Integrity",
        shortName: "Psychosocial",
        masteryPercentage: 76,
        totalAnswered: 220,
        status: "passing",
        topics: [
          { code: "NC-PS1", subject: "Psych", topic: "Therapeutic Communication", masteryPercentage: 84, totalAnswered: 60, correctCount: 50, status: "passing" },
          { code: "NC-PS2", subject: "Psych", topic: "Defense Mechanisms", masteryPercentage: 74, totalAnswered: 55, correctCount: 41, status: "borderline" },
          { code: "NC-PS3", subject: "Psych", topic: "Schizophrenia & Mood Alterations", masteryPercentage: 73, totalAnswered: 55, correctCount: 40, status: "borderline" },
          { code: "NC-PS4", subject: "Psych", topic: "Substance Withdrawal Syndromes", masteryPercentage: 75, totalAnswered: 50, correctCount: 38, status: "passing" },
        ],
      },
    ];

    const totalPercentage = partsData.reduce((acc, p) => acc + p.masteryPercentage, 0);
    const overallReadiness = Math.round(totalPercentage / partsData.length);
    const hasCriticalSubject = partsData.some((p) => p.masteryPercentage < this.MINIMUM_SUBJECT_THRESHOLD);

    let passLikelihood: "Likely to Pass" | "Borderline" | "At Risk";
    if (overallReadiness >= this.PASSING_THRESHOLD && !hasCriticalSubject) {
      passLikelihood = "Likely to Pass";
    } else if (overallReadiness >= 70 && !hasCriticalSubject) {
      passLikelihood = "Borderline";
    } else {
      passLikelihood = "At Risk";
    }

    const allTopics = partsData.flatMap((p) => p.topics);
    const weakAreas = allTopics.filter((t) => t.masteryPercentage < this.PASSING_THRESHOLD)
      .sort((a, b) => a.masteryPercentage - b.masteryPercentage);

    const primaryWeakArea = weakAreas[0] || null;

    const radarData = partsData.map((p) => ({
      subject: p.shortName,
      score: p.masteryPercentage,
      fullMark: 100,
    }));

    return {
      exam: "NCLEX-RN",
      overallReadiness,
      passingThreshold: this.PASSING_THRESHOLD,
      minimumSubjectThreshold: this.MINIMUM_SUBJECT_THRESHOLD,
      passLikelihood,
      totalQuestionsAnswered: partsData.reduce((acc, p) => acc + p.totalAnswered, 0),
      accuracyRate: overallReadiness,
      flashcardsMastered: 172,
      mockExamHighestScore: 76,
      studyMinutesTotal: 1350,
      radarData,
      parts: partsData,
      weakAreas,
      primaryWeakArea,
      weakDrillRecommendation: primaryWeakArea ? {
        subject: primaryWeakArea.subject,
        topic: primaryWeakArea.topic,
        questionCount: 10,
        targetScore: 75,
      } : null,
    };
  }
}
