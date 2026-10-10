export type StudyDayKind = "Flashcards" | "Reading" | "Practice test" | "Quiz" | "Rest" | "Mock exam";

export interface DaySchedule {
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  kind: StudyDayKind;
  subject: string;
  topic: string;
  targetMinutes: number;
  activities: string[];
  isExamDay: boolean;
  isRescheduled?: boolean;
}

export interface PlannerConfig {
  examDate: string; // YYYY-MM-DD
  hoursPerDay: number; // 1 to 8
  restDayMode: "sunday" | "saturday" | "none" | "custom";
  customRestDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  weakSubjects: string[];
  mockSprintWeeks: number; // default 2 weeks
  examType: "NCLEX-RN" | "NLE";
}

export const defaultSubjects = [
  "Pharmacology",
  "Med-Surg",
  "Maternal & Child",
  "Psychiatric",
  "Fundamentals & Ethics",
];

export const subjectTopics: Record<string, string[]> = {
  Pharmacology: ["Cardiac Glycosides", "Anticoagulants", "Insulin Regimens", "Psychotropics", "Emergency Antidotes"],
  "Med-Surg": ["Fluid & Electrolytes", "ABG Interpretation", "Renal & Dialysis", "Shock & Hemodynamics", "Post-op Care"],
  "Maternal & Child": ["Preeclampsia & HELLP", "Labor & Delivery", "Neonatal Resuscitation", "Pediatric Milestones"],
  Psychiatric: ["Defense Mechanisms", "Therapeutic Communication", "Crisis Intervention", "Substance Withdrawal"],
  "Fundamentals & Ethics": ["RA 9173 & Law", "Informed Consent", "Infection Control", "Prioritization & Triage"],
};

export const KIND_TONES: Record<StudyDayKind, string> = {
  Flashcards: "bg-teal-tint text-rosetext",
  Reading: "bg-lav text-indigo",
  "Practice test": "bg-[#ffe8cf] text-[#8d4b00]",
  Quiz: "bg-lav-deep text-indigo",
  Rest: "bg-canvas text-ink-soft",
  "Mock exam": "bg-danger text-white",
};

export function generateStudyPlan(
  config: PlannerConfig,
  startDate: Date = new Date(),
  customOverrides: Record<string, StudyDayKind> = {}
): Record<string, DaySchedule> {
  const plan: Record<string, DaySchedule> = {};
  const exam = new Date(config.examDate + "T00:00:00");
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  const totalDays = Math.max(1, Math.round((exam.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const sprintDays = config.mockSprintWeeks * 7;

  // Prioritize weak subjects in subject pool
  const subjectsPool: string[] = [];
  defaultSubjects.forEach((subj) => {
    subjectsPool.push(subj);
    if (config.weakSubjects.includes(subj)) {
      subjectsPool.push(subj); // Higher weight for weak areas
    }
  });

  let subjectIdx = 0;

  for (let i = 0; i <= totalDays; i++) {
    const curDate = new Date(start.getTime() + i * (1000 * 60 * 60 * 24));
    const yyyy = curDate.getFullYear();
    const mm = String(curDate.getMonth() + 1).padStart(2, "0");
    const dd = String(curDate.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = curDate.getDay();

    const isExamDay = i === totalDays;
    const daysUntilExam = totalDays - i;

    // Check if rest day
    let isRestDay = false;
    if (config.restDayMode === "sunday" && dayOfWeek === 0) isRestDay = true;
    if (config.restDayMode === "saturday" && dayOfWeek === 6) isRestDay = true;
    if (config.restDayMode === "custom" && config.customRestDays.includes(dayOfWeek)) isRestDay = true;
    if (daysUntilExam === 1) isRestDay = true; // Mandatory light rest day right before exam

    const activeSubject = subjectsPool[subjectIdx % subjectsPool.length];
    const topicsList = subjectTopics[activeSubject] || ["General Clinical Concepts"];
    const activeTopic = topicsList[subjectIdx % topicsList.length];

    let kind: StudyDayKind;

    if (customOverrides[dateStr]) {
      kind = customOverrides[dateStr];
    } else if (isExamDay) {
      kind = "Mock exam";
    } else if (isRestDay) {
      kind = "Rest";
    } else if (daysUntilExam <= sprintDays) {
      // Final sprint: heavy mock simulations and high-yield reviews
      kind = i % 2 === 0 ? "Mock exam" : "Practice test";
    } else {
      // Foundation & Consolidation rotation
      const rotation = i % 4;
      if (rotation === 0) kind = "Reading";
      else if (rotation === 1) kind = "Flashcards";
      else if (rotation === 2) kind = "Quiz";
      else kind = "Practice test";
    }

    if (!isRestDay && !isExamDay) {
      subjectIdx++;
    }

    const targetMinutes = kind === "Rest" ? 0 : config.hoursPerDay * 60;

    const activities: string[] = [];
    if (isExamDay) {
      activities.push("Official Board Examination Day");
      activities.push("Target: " + config.examType + " Licensure");
    } else if (kind === "Rest") {
      activities.push("Rest & mental recovery");
      activities.push("Optional: 15-minute light flashcard flip");
    } else if (kind === "Mock exam") {
      activities.push("Full-length timed simulation (75–100 items)");
      activities.push("Comprehensive rationale review for incorrect answers");
      activities.push("Error log bookmarking");
    } else if (kind === "Reading") {
      activities.push(`Deep dive reading: ${activeSubject} - ${activeTopic}`);
      activities.push("Extract high-yield clinical notes to Document Hub");
      activities.push("20-card warm-up review");
    } else if (kind === "Flashcards") {
      activities.push(`Warm-up: FSRS spaced repetition review`);
      activities.push(`Core: ${activeSubject} flashcard mastery`);
      activities.push("Cooldown: Review 'Again' & 'Hard' cards");
    } else {
      activities.push(`Warm-up: 15 SRS cards on ${activeSubject}`);
      activities.push(`Core: Timed ${kind.toLowerCase()} session on ${activeTopic}`);
      activities.push("Cooldown: Clinical decision-making audit");
    }

    plan[dateStr] = {
      dateStr,
      dayNumber: curDate.getDate(),
      kind,
      subject: activeSubject,
      topic: activeTopic,
      targetMinutes,
      activities,
      isExamDay,
      isRescheduled: Boolean(customOverrides[dateStr]),
    };
  }

  return plan;
}
