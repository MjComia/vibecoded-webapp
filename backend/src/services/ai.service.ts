import { getGeminiClient, GEMINI_MODEL } from "../config/gemini.js";
import { z } from "zod";

export interface QuestionItem {
  id: string;
  stem: string;
  options: string[];
  correct_answer_index: number;
  rationale: string;
  clinical_tip?: string;
  subject: string;
  topic: string;
  difficulty: string;
}

const questionSchema = z.object({
  stem: z.string(),
  options: z.array(z.string()).min(4).max(4),
  correct_answer_index: z.number().int().min(0).max(3),
  rationale: z.string(),
  clinical_tip: z.string().optional(),
});

const questionsArraySchema = z.array(questionSchema);

// Comprehensive Multi-Subject Curriculum Bank
export const SEED_QUESTION_BANK: QuestionItem[] = [
  // --- PSYCHIATRIC ---
  {
    id: "psy-1",
    stem: "A client who recently lost his job due to absenteeism arrives home and yells at his spouse for leaving shoes near the doorway. Which ego defense mechanism is the client demonstrating?",
    options: [
      "Displacement (transferring feelings to a less threatening target)",
      "Projection (attributing unacceptable thoughts to others)",
      "Reaction Formation (expressing the opposite of true feelings)",
      "Sublimation (channeling drives into socially acceptable activities)"
    ],
    correct_answer_index: 0,
    rationale: "Displacement involves the redirection of intense emotions from an original threatening source (the employer) onto a safer, less threatening recipient (the spouse).",
    clinical_tip: "Displacement = 'Kick the dog' when angry at the boss.",
    subject: "Psychiatric",
    topic: "Defense Mechanisms",
    difficulty: "Board-level"
  },
  {
    id: "psy-2",
    stem: "A client with severe alcohol dependence insists, 'I only drink beer on weekends to relax with my friends, everyone does it.' Which defense mechanism is being exhibited?",
    options: [
      "Rationalization and Denial",
      "Undoing and Isolation",
      "Splitting and Regression",
      "Introjection and Repression"
    ],
    correct_answer_index: 0,
    rationale: "Denial is the refusal to acknowledge the existence of a real situation. Rationalization is formulating plausible excuses to justify unacceptable behaviors.",
    clinical_tip: "Denial protects the ego by refusing to accept reality.",
    subject: "Psychiatric",
    topic: "Defense Mechanisms",
    difficulty: "Foundation"
  },
  {
    id: "psy-3",
    stem: "A client newly admitted to the psychiatric unit states, 'The FBI has planted microchips in my teeth to monitor my thoughts.' Which therapeutic response is priority for the nurse?",
    options: [
      "I understand that you believe that, but that must feel terrifying for you.",
      "The FBI does not plant microchips in dental fillings; let's check your teeth.",
      "Why do you think the federal government is interested in your thoughts?",
      "You are in a safe psychiatric hospital so they cannot hear you here."
    ],
    correct_answer_index: 0,
    rationale: "The nurse acknowledges the client's feelings and emotional reality without reinforcing or debating the delusion. Never challenge or validate delusional content directly.",
    clinical_tip: "Focus on the FEELING behind the delusion, never argue the false belief.",
    subject: "Psychiatric",
    topic: "Therapeutic Communication",
    difficulty: "Board-level"
  },
  {
    id: "psy-4",
    stem: "A client with bipolar disorder taking Lithium Carbonate 600 mg TID reports persistent coarse hand tremors, nausea, severe ataxia, and slurred speech. The morning serum lithium level is 2.2 mEq/L. What is the nurse's priority action?",
    options: [
      "Hold lithium, prepare for possible emergency hemodialysis, and notify the provider",
      "Administer the morning dose with food to minimize GI upset",
      "Advise the client to restrict sodium and fluid intake",
      "Recheck the lithium level in 4 hours before taking action"
    ],
    correct_answer_index: 0,
    rationale: "A lithium level > 2.0 mEq/L indicates severe life-threatening toxicity manifesting as coarse tremors, ataxia, and neurological collapse. Hemodialysis is the definitive treatment.",
    clinical_tip: "Normal lithium therapeutic range is 0.6–1.2 mEq/L. Levels > 2.0 mEq/L require emergency intervention.",
    subject: "Psychiatric",
    topic: "Crisis Intervention",
    difficulty: "Hard NGN"
  },

  // --- PHARMACOLOGY ---
  {
    id: "pharm-1",
    stem: "A client receiving IV heparin for pulmonary embolism has an aPTT of 115 seconds (control: 30 seconds). The nurse notes active petechiae on the extremities. Which intervention is the priority?",
    options: [
      "Slow the heparin infusion by 50% and recheck aPTT in 4 hours",
      "Immediately stop the heparin infusion and prepare Protamine Sulfate",
      "Administer Vitamin K intramuscularly and monitor INR",
      "Draw blood for a repeat CBC and reassure the client"
    ],
    correct_answer_index: 1,
    rationale: "An aPTT of 115 seconds is more than 3.5× control (therapeutic is 1.5–2.5× control). Petechiae signal active bleeding. Priority action is stopping heparin and preparing the antidote, protamine sulfate.",
    clinical_tip: "Normal aPTT is 30–40 sec; therapeutic heparin range is 45–80 sec. Petechiae indicate bleeding risk.",
    subject: "Pharmacology",
    topic: "Anticoagulants",
    difficulty: "Board-level"
  },
  {
    id: "pharm-2",
    stem: "A client taking Digoxin 0.25 mg daily reports nausea, anorexia, and seeing blurred yellow halos around room lights. The apical pulse is 52 bpm. What is the nurse's priority action?",
    options: [
      "Administer the daily dose with ginger ale to relieve nausea",
      "Hold the dose and immediately notify the healthcare provider",
      "Instruct the client to rest and recheck the pulse in 2 hours",
      "Encourage increased oral potassium-rich fluids"
    ],
    correct_answer_index: 1,
    rationale: "GI disturbances and yellow-green visual halos paired with bradycardia (< 60 bpm) are classic signs of digoxin toxicity. The nurse must hold the medication and notify the provider immediately.",
    clinical_tip: "Normal digoxin level is 0.5–2 ng/mL. Hypokalemia drastically potentiates digoxin toxicity.",
    subject: "Pharmacology",
    topic: "Cardiac Glycosides",
    difficulty: "Foundation"
  },
  {
    id: "pharm-3",
    stem: "A diabetic client received 10 units of Regular Insulin and 20 units of NPH Insulin subcutaneously at 07:30 AM before breakfast. At what time should the nurse monitor most closely for a hypoglycemic peak reaction from NPH?",
    options: [
      "Between 08:00 AM and 09:00 AM (30–60 minutes)",
      "Between 01:30 PM and 05:30 PM (6–10 hours)",
      "Between 09:30 AM and 11:30 AM (2–4 hours)",
      "At 10:00 PM (14–16 hours)"
    ],
    correct_answer_index: 1,
    rationale: "NPH is an intermediate-acting insulin that peaks 4 to 12 hours after administration (typically 6–8 hours). Administered at 07:30 AM, peak hypoglycemia risk occurs mid-to-late afternoon.",
    clinical_tip: "NPH = Not Particularly Hasty (intermediate, peaks in 4-12 hours). Regular peaks in 2-4 hours.",
    subject: "Pharmacology",
    topic: "Insulin & Hypoglycemics",
    difficulty: "Board-level"
  },

  // --- MED-SURG ---
  {
    id: "ms-1",
    stem: "The nurse is reviewing morning arterial blood gas (ABG) results for a client with acute exacerbation of COPD: pH 7.31, PaCO2 56 mmHg, HCO3 28 mEq/L, PaO2 64 mmHg. Which acid-base imbalance is present?",
    options: [
      "Uncompensated Metabolic Acidosis",
      "Partially Compensated Respiratory Acidosis",
      "Fully Compensated Respiratory Alkalosis",
      "Uncompensated Respiratory Acidosis"
    ],
    correct_answer_index: 1,
    rationale: "pH is low (< 7.35 = acidosis); PaCO2 is high (> 45 = respiratory origin); HCO3 is elevated (> 26 = kidneys attempting to compensate by retaining bicarb). Since pH is still abnormal, it is partially compensated.",
    clinical_tip: "Use ROME: Respiratory Opposite (pH low, PaCO2 high). When HCO3 moves opposite to compensate but pH is not yet normal, it is partially compensated.",
    subject: "Med-Surg",
    topic: "ABG Interpretation",
    difficulty: "Hard NGN"
  },
  {
    id: "ms-2",
    stem: "A client who underwent subtotal thyroidectomy 12 hours ago reports numbness and tingling around the lips and fingertips. The nurse inflates a blood pressure cuff on the client's arm and observes carpopedal spasm. What complication does this indicate?",
    options: [
      "Thyroid storm with severe hyperthermia",
      "Accidental parathyroid trauma resulting in acute hypocalcemia",
      "Laryngeal nerve damage resulting in vocal cord paralysis",
      "Hypermagnesemia from post-op fluid overload"
    ],
    correct_answer_index: 1,
    rationale: "Perioral paresthesia and a positive Trousseau's sign (carpopedal spasm upon BP cuff inflation) indicate acute hypocalcemia resulting from accidental trauma or removal of parathyroid glands during surgery.",
    clinical_tip: "Keep IV Calcium Gluconate at the bedside after thyroid surgery for emergency tetany treatment.",
    subject: "Med-Surg",
    topic: "Fluid & Electrolytes",
    difficulty: "Board-level"
  },

  // --- MATERNAL & CHILD ---
  {
    id: "mc-1",
    stem: "A 28-year-old multigravida at 34 weeks gestation presents with BP 168/110 mmHg, 3+ proteinuria, hyperreflexia, and severe frontal headache. The provider orders IV Magnesium Sulfate. Which assessment finding requires immediate cessation of the infusion?",
    options: [
      "Respiratory rate of 10 breaths per minute",
      "Deep tendon reflexes at 2+ (normal)",
      "Urine output of 45 mL/hr",
      "Fetal heart rate baseline of 140 bpm"
    ],
    correct_answer_index: 0,
    rationale: "Respiratory depression (< 12 breaths/min), absent deep tendon reflexes, and oliguria (< 30 mL/hr) are cardinal signs of magnesium sulfate toxicity. Discontinue magnesium immediately and prepare calcium gluconate.",
    clinical_tip: "Remember BURP: BP stable, Urine > 30 mL/hr, Respiratory rate > 12/min, Patellar reflex intact.",
    subject: "Maternal & Child",
    topic: "Preeclampsia & HELLP",
    difficulty: "Board-level"
  },
  {
    id: "mc-2",
    stem: "During active labor, the electronic fetal monitor demonstrates late decelerations associated with each uterine contraction. What is the nurse's immediate sequence of priority actions?",
    options: [
      "Turn client to left lateral position, stop oxytocin, administer oxygen, increase IV fluids",
      "Increase oxytocin rate to speed delivery and call the pediatrician",
      "Place client in Trendelenburg position and perform vaginal exam",
      "Reassure the mother and re-evaluate in 30 minutes"
    ],
    correct_answer_index: 0,
    rationale: "Late decelerations indicate uteroplacental insufficiency. Immediate intrauterine resuscitation: position left lateral to relieve vena cava compression, discontinue Pitocin, 8–10L O2 via non-rebreather, bolus IV fluids.",
    clinical_tip: "LION: Left side, Increase IV fluids, Oxygen on, Notify provider.",
    subject: "Maternal & Child",
    topic: "Labor Complications",
    difficulty: "Hard NGN"
  },

  // --- FUNDAMENTALS & ETHICS ---
  {
    id: "fe-1",
    stem: "Under Republic Act 9173 (Philippine Nursing Act of 2002), which of the following is an explicit requirement for appointment to the Professional Regulatory Board of Nursing (BON)?",
    options: [
      "Must have a Doctorate degree in Nursing Administration",
      "Must have at least ten (10) years of continuous practice in the profession",
      "Must be an active officer of the Philippine Nurses Association (PNA)",
      "Must be at least 35 years of age at the time of appointment"
    ],
    correct_answer_index: 1,
    rationale: "RA 9173 Section 4 specifies that members of the BON must be registered nurses with a Master's degree in Nursing, at least ten (10) years of continuous practice, and the last two (2) years must be in the Philippines.",
    clinical_tip: "RA 9173 requires a Master's degree (not Doctorate) and at least 10 years of nursing practice.",
    subject: "Fundamentals & Ethics",
    topic: "RA 9173 & Law",
    difficulty: "Board-level"
  },
  {
    id: "fe-2",
    stem: "The emergency department triage nurse receives four clients simultaneously. Applying clinical prioritization frameworks, which client must be seen first?",
    options: [
      "A 45-year-old with acute stridor and angioedema following a bee sting",
      "A 60-year-old with severe 8/10 right upper quadrant abdominal pain and vomiting",
      "A 22-year-old with a compound tibia fracture with palpable pedal pulses",
      "A 30-year-old diabetic with blood glucose of 280 mg/dL without ketones"
    ],
    correct_answer_index: 0,
    rationale: "Stridor and angioedema indicate impending acute upper airway occlusion (Airway is priority #1). Airway compromise takes absolute precedence over pain, limb injury, or hyperglycemia.",
    clinical_tip: "Airway > Breathing > Circulation (ABCs) always trumps pain or stable vitals.",
    subject: "Fundamentals & Ethics",
    topic: "Prioritization Frameworks",
    difficulty: "Board-level"
  }
];

export class AIService {
  /**
   * Generates board exam questions using Google Gemini 3.8 Flash.
   * Can be generated from syllabus topics OR grounded in user's uploaded text.
   */
  static async generateQuestions(params: {
    subject: string;
    topic: string;
    difficulty: string;
    count: number;
    sourceText?: string;
  }): Promise<QuestionItem[]> {
    const { subject, topic, difficulty, count, sourceText } = params;

    try {
      const gemini = getGeminiClient();
      const model = gemini.getGenerativeModel({
        model: GEMINI_MODEL,
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const groundingContext = sourceText
        ? `GROUNDING INSTRUCTIONS:
You MUST base the questions strictly on the following study material provided by the student:
---
${sourceText.slice(0, 15000)}
---
Do not invent information outside this material. If specific values are in the text, use them.`
        : `Ground the questions strictly in official board competencies for nursing exams (NCLEX-RN Next Gen / Philippine PRC NLE).`;

      const prompt = `You are a clinical nursing exam specialist and board question writer.
Write exactly ${count} multiple-choice question(s) for nursing licensure candidates.

Subject: ${subject}
Topic: ${topic}
Difficulty Level: ${difficulty} (Options: Foundation, Board-level, Hard NGN)

${groundingContext}

REQUIREMENTS:
1. Every question stem must be a realistic clinical nursing scenario (client assessment, prioritization, acute intervention, drug toxicity, or ethical dilemma).
2. Exactly 4 plausible options (1 correct, 3 realistic clinical distractors).
3. "correct_answer_index": integer 0, 1, 2, or 3.
4. "rationale": Thorough explanation why the correct answer is clinical priority and why the distractors are incorrect.
5. "clinical_tip": A short high-yield memory tip or mnemonics.

OUTPUT FORMAT:
Return a valid JSON array of objects conforming to this schema:
[
  {
    "stem": "string",
    "options": ["string", "string", "string", "string"],
    "correct_answer_index": 0,
    "rationale": "string",
    "clinical_tip": "string"
  }
]`;

      const generatePromise = model.generateContent(prompt);
      let timeoutId: any;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("Gemini API network timeout after 12000ms")), 12000);
      });

      const result = (await Promise.race([generatePromise, timeoutPromise])) as any;
      clearTimeout(timeoutId);

      const responseText = result.response.text();
      let cleanText = responseText.trim();
      const jsonMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        cleanText = jsonMatch[1].trim();
      } else {
        const firstBracket = cleanText.indexOf("[");
        const lastBracket = cleanText.lastIndexOf("]");
        if (firstBracket !== -1 && lastBracket !== -1) {
          cleanText = cleanText.slice(firstBracket, lastBracket + 1);
        }
      }
      const parsed = JSON.parse(cleanText);
      const validated = questionsArraySchema.parse(parsed);

      return validated.map((q, idx) => ({
        id: `ai-q-${Date.now()}-${idx}`,
        stem: q.stem,
        options: q.options,
        correct_answer_index: q.correct_answer_index,
        rationale: q.rationale,
        clinical_tip: q.clinical_tip,
        subject,
        topic,
        difficulty,
      }));
    } catch (err: any) {
      console.warn("[AIService] Gemini question generation fallback:", err.message);

      // Intelligent topic-matched curriculum filtering
      const matchedBySubject = SEED_QUESTION_BANK.filter(
        (q) => q.subject.toLowerCase() === subject.toLowerCase()
      );

      const matchedByTopic = matchedBySubject.filter(
        (q) => q.topic.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(q.topic.toLowerCase())
      );

      const selectedPool = matchedByTopic.length > 0
        ? matchedByTopic
        : matchedBySubject.length > 0
        ? matchedBySubject
        : SEED_QUESTION_BANK;

      // Duplicate / adjust count if needed
      const result: QuestionItem[] = [];
      for (let i = 0; i < count; i++) {
        const base = selectedPool[i % selectedPool.length];
        result.push({
          ...base,
          id: `bank-q-${Date.now()}-${i}`,
          difficulty,
          subject,
          topic,
        });
      }

      return result;
    }
  }
}
