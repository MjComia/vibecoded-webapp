import { useState, useEffect } from "react";
import { Sparkles, Check, X, FileText, BookOpen, AlertCircle, RefreshCw, Bookmark, Zap } from "lucide-react";
import { Card, PageHead, Btn, Pill } from "../ui";
import { generateAIQuiz, recordStudyAttempt } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

const subjects = [
  "Pharmacology",
  "Med-Surg",
  "Maternal & Child",
  "Psychiatric",
  "Fundamentals & Ethics",
];

const topics: Record<string, string[]> = {
  Pharmacology: ["Cardiac Glycosides", "Anticoagulants", "Insulin & Hypoglycemics", "Emergency Antidotes"],
  "Med-Surg": ["Fluid & Electrolytes", "ABG Interpretation", "Renal & Dialysis", "Respiratory Distress"],
  "Maternal & Child": ["Preeclampsia & HELLP", "Labor Complications", "Neonatal Resuscitation", "Pediatric Milestones"],
  Psychiatric: ["Defense Mechanisms", "Therapeutic Communication", "Crisis Intervention", "Substance Withdrawal"],
  "Fundamentals & Ethics": ["RA 9173 & Law", "Prioritization Frameworks", "Infection Control", "Informed Consent"],
};

const levels = ["Foundation", "Board-level", "Hard NGN"];

export default function Quiz() {
  const { user } = useAuth();
  const [sourceType, setSourceType] = useState<"syllabus" | "upload">("syllabus");
  const [s, setS] = useState(subjects[0]);
  const [t, setT] = useState(topics[subjects[0]][0]);
  const [l, setL] = useState(levels[1]);
  const [itemCount, setItemCount] = useState(3);
  const [customNotes, setCustomNotes] = useState("");
  const [priorityNotice, setPriorityNotice] = useState<string | null>(null);

  const [phase, setPhase] = useState<"setup" | "loading" | "run" | "done">("setup");
  const [questions, setQuestions] = useState<any[]>([]);
  const [n, setN] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);

  useEffect(() => {
    const drillTopic = sessionStorage.getItem("priority_drill_topic");
    const drillSubject = sessionStorage.getItem("priority_drill_subject");
    const drillCount = sessionStorage.getItem("priority_drill_count");

    if (drillTopic) {
      if (drillSubject) {
        // Match existing subject or fallback to Med-Surg
        const matched = subjects.find((subj) => subj.toLowerCase().includes(drillSubject.toLowerCase()) || drillSubject.toLowerCase().includes(subj.toLowerCase()));
        setS(matched || subjects[1]);
      }
      setT(drillTopic);
      setItemCount(drillCount ? parseInt(drillCount, 10) : 10);
      setPriorityNotice(`⚡ Weak Area Priority Drill Activated: 10 targeted questions on "${drillTopic}".`);
      sessionStorage.removeItem("priority_drill_topic");
      sessionStorage.removeItem("priority_drill_subject");
      sessionStorage.removeItem("priority_drill_count");
    }
  }, []);

  const toggleFlag = (id: string) => {
    setFlaggedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const generate = async () => {
    setPhase("loading");
    setN(0);
    setScore(0);
    setPick(null);
    setUserAnswers([]);
    setFlaggedIds([]);

    try {
      const generated = await generateAIQuiz({
        subject: s,
        topic: t,
        difficulty: l,
        count: itemCount,
        sourceText: sourceType === "upload" && customNotes.trim() ? customNotes : undefined,
      });

      setQuestions(generated);
      setPhase("run");
    } catch (err) {
      console.error("Quiz generation failed:", err);
      setPhase("setup");
    }
  };

  const handleSelectOption = (idx: number) => {
    if (pick !== null) return;
    setPick(idx);
    setUserAnswers([...userAnswers, idx]);

    if (idx === questions[n].correct_answer_index) {
      setScore((sc) => sc + 1);
    }
  };

  const handleNextOrFinish = async () => {
    if (n + 1 < questions.length) {
      setN((prev) => prev + 1);
      setPick(null);
    } else {
      setPhase("done");

      const finalScore = score + (pick === questions[n].correct_answer_index ? 1 : 0);
      recordStudyAttempt({
        type: "quiz",
        subject: s,
        topic: t,
        score: finalScore,
        total: questions.length,
      });

      // Log quiz result to Supabase if logged in
      if (isSupabaseConfigured && user) {
        try {
          await supabase.from("quiz_attempts").insert({
            user_id: user.id,
            score: finalScore,
            total_items: questions.length,
            answers: userAnswers,
          });
        } catch (err) {
          console.warn("Could not save quiz attempt:", err);
        }
      }
    }
  };

  const chip = (on: boolean) =>
    `rounded-full px-4 py-2 text-xs sm:text-sm font-semibold border transition-all ${
      on ? "bg-teal text-ink border-teal shadow-sm font-bold" : "bg-white text-ink-soft border-line hover:bg-lav"
    }`;

  const currentQ = questions[n];

  return (
    <div className="rise max-w-3xl mx-auto space-y-6">
      <PageHead
        eyebrow="AI Board Quiz Maker"
        title="Generate High-Yield Practice Drills"
        sub="Synthesize authentic NCLEX & NLE licensure questions grounded in board competencies or your uploaded study notes."
      />

      {priorityNotice && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#ffe8cf] to-[#fff3e0] border border-[#ffcc80] flex items-center justify-between gap-3 text-ink">
          <div className="flex items-center gap-2.5">
            <Zap size={18} className="text-amber shrink-0" fill="#ffb86b" />
            <p className="text-xs sm:text-sm font-bold">{priorityNotice}</p>
          </div>
          <button
            type="button"
            onClick={() => setPriorityNotice(null)}
            className="text-xs font-semibold text-ink-soft hover:text-ink px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {phase === "setup" && (
        <Card className="p-6 md:p-10 space-y-8">
          {/* Question Source Toggle */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">Question Source</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSourceType("syllabus")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  sourceType === "syllabus"
                    ? "border-teal bg-teal-tint ring-1 ring-teal text-rosetext font-bold"
                    : "border-line bg-canvas text-ink-soft hover:bg-lav"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpen size={16} />
                  <span className="text-sm font-bold">Official Syllabus Competencies</span>
                </div>
                <p className="text-xs font-normal text-ink-soft mt-1">
                  NLE 5 Parts & NCLEX Client Needs categories.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSourceType("upload")}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  sourceType === "upload"
                    ? "border-teal bg-teal-tint ring-1 ring-teal text-rosetext font-bold"
                    : "border-line bg-canvas text-ink-soft hover:bg-lav"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileText size={16} />
                  <span className="text-sm font-bold">Grounded in Uploaded Notes</span>
                </div>
                <p className="text-xs font-normal text-ink-soft mt-1">
                  Questions extracted strictly from your study materials.
                </p>
              </button>
            </div>
          </div>

          {sourceType === "upload" && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-2">
                Study Material Excerpt / Uploaded Notes:
              </p>
              <textarea
                rows={4}
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Paste an excerpt from your textbook, lecture slides, or review handout (e.g. Brunner & Suddarth endocrine chapter or Saunders pharmacology notes)..."
                className="w-full rounded-2xl border border-line bg-canvas p-3.5 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>
          )}

          {/* Subject & Topic */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">Clinical Subject</p>
            <div className="flex flex-wrap gap-2">
              {subjects.map((x) => (
                <button
                  key={x}
                  type="button"
                  onClick={() => {
                    setS(x);
                    setT(topics[x][0]);
                  }}
                  className={chip(s === x)}
                >
                  {x}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">Syllabus Topic</p>
            <div className="flex flex-wrap gap-2">
              {topics[s].map((x) => (
                <button key={x} type="button" onClick={() => setT(x)} className={chip(t === x)}>
                  {x}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Level & Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">Difficulty Level</p>
              <div className="flex flex-wrap gap-2">
                {levels.map((x) => (
                  <button key={x} type="button" onClick={() => setL(x)} className={chip(l === x)}>
                    {x}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3">Questions Count</p>
              <div className="flex gap-2">
                {[3, 5, 10].map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setItemCount(c)}
                    className={chip(itemCount === c)}
                  >
                    {c} Items
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Btn onClick={generate} className="w-full py-4 text-sm font-bold">
            <Sparkles size={16} /> Generate {itemCount} {l} Questions with Gemini AI
          </Btn>
        </Card>
      )}

      {/* Loading State */}
      {phase === "loading" && (
        <Card className="p-16 text-center space-y-5">
          <div className="mx-auto size-12 rounded-full border-4 border-lav border-t-teal animate-spin" />
          <h3 className="font-display font-bold text-lg text-ink">
            Synthesizing {l} questions on {t}…
          </h3>
          <p className="text-xs text-ink-soft max-w-sm mx-auto">
            {sourceType === "upload" && customNotes
              ? "Reading uploaded text and formulating clinical distractors & rationales."
              : "Grounding clinical scenarios in official board exam competencies."}
          </p>
        </Card>
      )}

      {/* Active Run Mode */}
      {phase === "run" && currentQ && (
        <Card className="p-6 md:p-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div className="flex gap-2">
              <Pill tone="teal">{s}</Pill>
              <Pill>{t}</Pill>
              <Pill tone="indigo">{l}</Pill>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleFlag(currentQ.id)}
                className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-full border transition-all ${
                  flaggedIds.includes(currentQ.id)
                    ? "bg-amber/15 text-[#8d4b00] border-amber font-bold"
                    : "bg-white text-ink-soft border-line hover:bg-lav"
                }`}
              >
                <Bookmark size={13} fill={flaggedIds.includes(currentQ.id) ? "#8d4b00" : "none"} />
                {flaggedIds.includes(currentQ.id) ? "Flagged" : "Flag Question"}
              </button>
              <span className="text-xs font-bold text-ink-soft">
                Question {n + 1} of {questions.length}
              </span>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl md:text-2xl font-bold font-display leading-snug text-ink">
            {currentQ.stem}
          </h2>

          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt: string, idx: number) => {
              const isSelected = pick === idx;
              const isCorrect = idx === currentQ.correct_answer_index;

              let style = "border-line bg-canvas hover:bg-lav text-ink";
              if (pick !== null) {
                if (isCorrect) {
                  style = "border-teal bg-teal-tint font-bold text-rosetext";
                } else if (isSelected) {
                  style = "border-danger bg-[#ffdad6] font-bold text-danger";
                } else {
                  style = "opacity-45 border-line bg-canvas";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={pick !== null}
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full flex items-center justify-between gap-4 rounded-2xl border p-4 text-left text-xs sm:text-sm font-medium transition-all ${style}`}
                >
                  <span>{opt}</span>
                  {pick !== null && isCorrect && <Check size={18} className="text-rosetext shrink-0" />}
                  {pick !== null && isSelected && !isCorrect && (
                    <X size={18} className="text-danger shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Rationale and Memory Tip */}
          {pick !== null && (
            <div className="space-y-3 pt-2 animate-fadeIn">
              <div className="rounded-2xl bg-lav p-5 text-xs sm:text-sm leading-relaxed text-ink">
                <b className="text-rosetext">Clinical Rationale: </b>
                {currentQ.rationale}
              </div>

              {currentQ.clinical_tip && (
                <div className="rounded-2xl bg-teal-tint p-4 text-xs font-semibold text-rosetext flex items-center gap-2">
                  <Sparkles size={14} className="shrink-0" />
                  <span>Clinical Memory Tip: {currentQ.clinical_tip}</span>
                </div>
              )}

              <Btn onClick={handleNextOrFinish} className="w-full py-3.5 text-xs font-bold mt-4">
                {n + 1 < questions.length ? "Next Question" : "View Quiz Results"}
              </Btn>
            </div>
          )}
        </Card>
      )}

      {/* Done State */}
      {phase === "done" && (
        <Card className="p-12 text-center space-y-6">
          <p className="text-xs font-bold uppercase tracking-wider text-rosetext">Quiz Completed</p>
          <div className="font-display text-6xl font-bold text-rosetext">
            {score}/{questions.length}
          </div>
          <p className="text-sm font-medium text-ink-soft">
            {score === questions.length
              ? "Flawless score! Clinical confidence on this topic is high."
              : score >= Math.ceil(questions.length * 0.75)
              ? "Great performance! You exceeded the 75% board passing threshold."
              : "Good practice drill. Review the rationales to reinforce your weak points."}
          </p>

          {flaggedIds.length > 0 && (
            <div className="text-left border-t border-line pt-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8d4b00]">
                <Bookmark size={14} fill="#8d4b00" />
                <span>Flagged Questions for Review ({flaggedIds.length})</span>
              </div>
              <div className="space-y-3">
                {questions
                  .filter((q) => flaggedIds.includes(q.id))
                  .map((q, idx) => (
                    <div key={q.id || idx} className="rounded-2xl border border-line bg-canvas p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-ink">{q.stem}</span>
                        <Pill tone="amber">Flagged</Pill>
                      </div>
                      <p className="text-rosetext font-semibold">
                        Correct Answer: {q.options[q.correct_answer_index]}
                      </p>
                      <p className="text-ink-soft leading-relaxed">{q.rationale}</p>
                      {q.clinical_tip && (
                        <p className="text-rosetext/85 font-medium italic">
                          Tip: {q.clinical_tip}
                        </p>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="flex justify-center gap-3 pt-4">
            <Btn onClick={() => setPhase("setup")} className="px-7">
              <RefreshCw size={14} /> New Practice Quiz
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}
