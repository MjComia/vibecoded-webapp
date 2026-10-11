import {
  ArrowRight,
  Flame,
  Hourglass,
  Layers,
  UploadCloud,
  Zap,
  Timer,
  CheckCircle2,
  Circle,
  FileText,
  Presentation,
  Calculator,
  FlaskConical,
  Sparkles,
  Calendar,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card, Btn, Pill, Bar, Ring } from "../ui";
import { useAuth } from "../context/AuthContext";
import { fetchAnalytics, AnalyticsSummary } from "../lib/api";
import { getDefaultExamDate } from "../lib/planner";

const newCandidatePlan = [
  { id: "dc-1", t: "Complete 10-item diagnostic drill to set your baseline", time: "Day 1", done: false },
  { id: "dc-2", t: "Review 15 high-yield pharmacology starter cards", time: "Day 1", done: false },
  { id: "dc-3", t: "Set up backward-planned study calendar in Study Plan", time: "Day 1", done: false },
  { id: "dc-4", t: "Complete a 25-minute Pomodoro focus study block", time: "Day 1", done: false },
];

export default function Dashboard({ go }: { go: (v: string) => void }) {
  const { profile, isGuest, user, updateProfile } = useAuth();
  const isNewAccount = !isGuest && Boolean(user) && (profile.streak_days <= 1);

  const getInitialPlan = () => {
    try {
      const savedTasks = localStorage.getItem("real_nurse_tasks");
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const todayTasks = parsed.filter((t: any) => t.day === "Today" || !t.day);
          if (todayTasks.length > 0) {
            return todayTasks.map((t: any) => ({
              id: t.id,
              t: t.title,
              time: t.kind === "cards" ? "Flashcards" : t.kind === "test" ? "Quiz Drill" : "Study",
              done: Boolean(t.done),
            }));
          }
        }
      }
    } catch {}
    return isNewAccount ? newCandidatePlan : [];
  };

  const [plan, setPlan] = useState(getInitialPlan);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [editingDate, setEditingDate] = useState(false);
  const done = plan.filter((p) => p.done).length;

  useEffect(() => {
    const examType = profile.target_exam === "NCLEX-RN" ? "NCLEX-RN" : "NLE";
    fetchAnalytics(examType).then(setAnalytics);
  }, [profile.target_exam]);

  useEffect(() => {
    setPlan(getInitialPlan());
  }, [isNewAccount]);

  const handleTogglePlanItem = (idx: number) => {
    const target = plan[idx];
    if (!target) return;
    const newDone = !target.done;
    const updatedPlan = plan.map((p, j) => (j === idx ? { ...p, done: newDone } : p));
    setPlan(updatedPlan);

    // Sync with real_nurse_tasks in localStorage if matching ID exists
    try {
      const savedTasks = localStorage.getItem("real_nurse_tasks");
      if (savedTasks) {
        const parsed = JSON.parse(savedTasks);
        if (Array.isArray(parsed)) {
          const updatedTasks = parsed.map((t: any) => (t.id === target.id ? { ...t, done: newDone } : t));
          localStorage.setItem("real_nurse_tasks", JSON.stringify(updatedTasks));
        }
      }
    } catch {}
  };

  const firstName = profile.full_name?.split(" ")[0] || "Candidate";

  // Dynamic exam date calculation with future fallback
  const defaultDate = getDefaultExamDate();
  const rawDate = profile.exam_date || defaultDate;
  const parsedDate = new Date(rawDate);
  const examDateObj = isNaN(parsedDate.getTime()) || parsedDate.getTime() < Date.now()
    ? new Date(defaultDate)
    : parsedDate;

  const examDateFormatted = examDateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const examDateInputValue = examDateObj.toISOString().split("T")[0];
  const daysRemaining = Math.max(0, Math.ceil((examDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const readinessScore = isNewAccount ? 0 : (analytics?.overallReadiness ?? 74);
  const isLikelyPassing = readinessScore >= 75;

  const handleStartDrill = (subject?: string, topic?: string) => {
    if (topic) {
      sessionStorage.setItem("priority_drill_topic", topic);
      sessionStorage.setItem("priority_drill_subject", subject || "Med-Surg");
      sessionStorage.setItem("priority_drill_count", "10");
    }
    go("quiz");
  };

  return (
    <div className="space-y-10 rise max-w-6xl mx-auto">
      {/* Top Welcome Header */}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Good morning, {firstName} 👋</h1>
          <p className="mt-3 text-ink-soft max-w-xl">
            {isNewAccount ? (
              <span>
                Welcome to your review journey! Target: <b className="text-rosetext">{profile.target_exam}</b> · {examDateFormatted} intake.
              </span>
            ) : (
              <span>
                Steady composure builds clinical confidence. Target: <b className="text-rosetext">{profile.target_exam}</b> · {examDateFormatted} intake.
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Btn onClick={() => go("docs")}><UploadCloud size={16} /> Upload notes</Btn>
          <Btn variant="soft" onClick={() => handleStartDrill()}><Zap size={16} /> Quick 10-item drill</Btn>
          <Btn variant="ghost" onClick={() => go("pomodoro")}><Timer size={16} /> Focus timer</Btn>
        </div>
      </header>

      {/* Top Overview Cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {/* Predicted Readiness Card */}
        <Card
          className="p-6 flex items-center gap-5 cursor-pointer hover:border-rosetext/50 transition-all"
          onClick={() => (isNewAccount ? handleStartDrill() : go("analytics"))}
        >
          <Ring
            value={readinessScore}
            size={88}
            tone={isNewAccount ? "#3d4947" : isLikelyPassing ? "#006a6a" : readinessScore >= 70 ? "#ffb86b" : "#ba1a1a"}
            label={<span className="text-xl font-bold">{isNewAccount ? "New" : `${readinessScore}%`}</span>}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Predicted readiness
            </p>
            <div className="mt-2">
              <Pill tone={isNewAccount ? "amber" : isLikelyPassing ? "teal" : readinessScore >= 70 ? "amber" : "red"}>
                {isNewAccount ? "Diagnostic Needed" : (analytics?.passLikelihood || "Borderline")}
              </Pill>
            </div>
            <p className="text-[11px] text-ink-soft mt-1">
              {isNewAccount ? "Tap to take first drill" : "PRC 75% Standard"}
            </p>
          </div>
        </Card>

        {/* Countdown Card (Interactive & Editable) */}
        <Card className="p-6 relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Exam countdown</p>
            <button
              onClick={() => setEditingDate(!editingDate)}
              className="text-[11px] font-bold text-rosetext hover:underline flex items-center gap-1"
              title="Change exam target date"
            >
              <Calendar size={12} /> {editingDate ? "Save" : "Edit date"}
            </button>
          </div>

          {editingDate ? (
            <div className="mt-3 space-y-2">
              <input
                type="date"
                min={new Date().toISOString().split("T")[0]}
                value={examDateInputValue}
                onChange={(e) => {
                  if (e.target.value) {
                    updateProfile({ exam_date: e.target.value });
                  }
                }}
                className="w-full text-xs font-semibold rounded-xl border border-line bg-canvas p-2 text-ink focus:outline-none focus:ring-1 focus:ring-teal"
              />
              <p className="text-[10px] text-ink-soft">
                Calendar & study plan will automatically reschedule.
              </p>
            </div>
          ) : (
            <div>
              <p className="mt-3 font-display text-5xl font-bold">
                {daysRemaining} <span className="text-base font-medium text-ink-soft">days left</span>
              </p>
              <p className="mt-3 text-xs text-rosetext font-semibold flex items-center gap-1.5">
                <Hourglass size={14} /> {examDateFormatted} intake · {profile.target_exam}
              </p>
            </div>
          )}
        </Card>

        {/* Streak Card */}
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Consistency streak</p>
          <p className="mt-3 font-display text-5xl font-bold flex items-center gap-2">
            {isNewAccount ? 1 : profile.streak_days}{" "}
            <Flame className="text-amber" fill="#ffb86b" size={30} />
          </p>
          <p className="mt-3 text-sm text-ink-soft">
            {isNewAccount ? "Day 1 of your prep!" : `Personal best ${Math.max(21, profile.streak_days)} days`}
          </p>
        </Card>

        {/* SRS Flashcards Queue Card */}
        <Card className="p-6 bg-indigo text-white border-0 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/70">SRS queue today</p>
            <p className="mt-3 font-display text-5xl font-bold">
              {isNewAccount ? "15" : "42"}{" "}
              <span className="text-base font-medium text-white/70">
                {isNewAccount ? "starter cards" : "cards due"}
              </span>
            </p>
          </div>
          <button
            onClick={() => go("flashcards")}
            className="mt-4 text-sm font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all text-white/90"
          >
            {isNewAccount ? "Begin first deck" : "Start review"} <ArrowRight size={14} />
          </button>
        </Card>
      </div>

      {/* Document Hub Showcase / Onboarding */}
      <Card className="p-8 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <Pill tone="indigo">Document Hub & AI Assistant</Pill>
            <h2 className="mt-4 text-2xl font-bold">Turn any clinical document into a study set</h2>
            <p className="mt-2 text-ink-soft leading-relaxed">
              Upload a PDF, lecture slides or notes (up to 25 MB). AI reads it, builds flashcards and graded quizzes, and answers your questions using only your file.
            </p>
          </div>
          <Btn onClick={() => go("docs")} className="px-7 py-3.5">
            Open document hub <ArrowRight size={16} />
          </Btn>
        </div>

        {isNewAccount ? (
          <div className="mt-8 p-6 rounded-2xl bg-canvas border border-dashed border-line text-center space-y-3">
            <div className="size-12 rounded-2xl bg-white border border-line text-rosetext grid place-items-center mx-auto shadow-xs">
              <UploadCloud size={22} />
            </div>
            <div>
              <p className="font-bold text-sm text-ink">No documents uploaded yet</p>
              <p className="text-xs text-ink-soft mt-1">
                Upload your first lecture notes, pharmacology tables, or PDF reviewers to generate grounded quizzes.
              </p>
            </div>
            <Btn variant="soft" onClick={() => go("docs")}>
              Upload First Document
            </Btn>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              { i: FileText, n: "Saunders_Pharm_Ch14.pdf", s: "Processed · 48 cards · 15 quizzes", p: 100 },
              { i: Presentation, n: "Maternal_Child_Preeclampsia.pptx", s: "Generating NGN case studies…", p: 78 },
              { i: FileText, n: "Brunner_Endocrine_Notes.pdf", s: "Ready · 32 cards", p: 100 },
            ].map((f) => (
              <div key={f.n} className="rounded-2xl bg-canvas p-5">
                <div className="flex items-center gap-3">
                  <div className="grid place-items-center size-10 rounded-xl bg-white text-rosetext">
                    <f.i size={18} />
                  </div>
                  <p className="text-sm font-semibold truncate">{f.n}</p>
                </div>
                <p className="mt-3 mb-3 text-xs text-ink-soft">{f.s}</p>
                <Bar value={f.p} tone={f.p < 100 ? "indigo" : "teal"} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Main Study Section Grid */}
      <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          {/* Continue Studying Decks */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold">
                {isNewAccount ? "Recommended starter decks" : "Continue studying"}
              </h2>
              <button onClick={() => go("flashcards")} className="text-sm font-semibold text-rosetext hover:underline">
                View all decks
              </button>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  k: "Pharmacology",
                  h: "Autonomic nervous system & cardiac drugs",
                  d: "Beta-blockers, ACE inhibitors, digoxin toxicity benchmarks.",
                  due: isNewAccount ? "15 starter cards" : "28 cards due · ~12 min",
                  cta: "Start review",
                  go: "flashcards",
                  v: "primary" as const,
                },
                {
                  k: "Maternal & Child",
                  h: "Labor & delivery complications drill",
                  d: "NGN case simulations: preeclampsia, cord prolapse, FHR.",
                  due: "10 case simulations",
                  cta: "Launch quiz",
                  go: "quiz",
                  v: "indigo" as const,
                },
              ].map((c) => (
                <Card key={c.h} className="p-7 flex flex-col justify-between">
                  <div>
                    <Pill tone="lav">{c.k}</Pill>
                    <h3 className="mt-5 text-xl font-bold leading-snug">{c.h}</h3>
                    <p className="mt-2 text-sm text-ink-soft leading-relaxed">{c.d}</p>
                  </div>
                  <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-line">
                    <span className="text-xs text-ink-soft">{c.due}</span>
                    <Btn variant={c.v} onClick={() => go(c.go)}>{c.cta}</Btn>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Focus Areas Needing Polish */}
          {isNewAccount ? (
            <Card className="p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Diagnostic baseline</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    Take a 10-question diagnostic quiz to calibrate your Weak Areas Priority Radar.
                  </p>
                </div>
                <Pill tone="teal">Ready to calibrate</Pill>
              </div>
              <div className="mt-6 p-6 rounded-2xl bg-canvas border border-line flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-bold text-sm text-ink">10-Item Baseline Diagnostic Drill</p>
                  <p className="text-xs text-ink-soft">
                    Covers core syllabus areas for {profile.target_exam}. Results identify your priority weak areas.
                  </p>
                </div>
                <Btn onClick={() => handleStartDrill()}>
                  <Zap size={16} /> Begin Diagnostic Drill
                </Btn>
              </div>
            </Card>
          ) : (
            <Card className="p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold">Focus areas needing polish</h2>
                  <p className="mt-1 text-sm text-ink-soft">
                    Priority topics scoring below 75% PRC passing benchmark.
                  </p>
                </div>
                <button onClick={() => go("analytics")}>
                  <Pill tone="red">
                    {analytics?.weakAreas.length || 3} priorities
                  </Pill>
                </button>
              </div>
              <div className="mt-7 space-y-6">
                {(analytics?.weakAreas?.slice(0, 3) || [
                  { subject: "Med-Surg", topic: "Fluid Volume Deficit & IV Flow Rates", masteryPercentage: 46, status: "critical" },
                  { subject: "Med-Surg", topic: "Oxygenation & ABG Interpretation", masteryPercentage: 55, status: "critical" },
                  { subject: "Psychiatric", topic: "Defense mechanisms & therapeutic communication", masteryPercentage: 64, status: "borderline" },
                ]).map((f: any) => {
                  const tone = f.masteryPercentage < 60 ? "red" : f.masteryPercentage < 75 ? "amber" : "teal";
                  return (
                    <div key={f.topic} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <Pill tone={tone}>{f.subject}</Pill>
                          <p className="text-sm font-semibold">{f.topic}</p>
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <div className="flex-1"><Bar value={f.masteryPercentage} tone={tone} /></div>
                          <span className="text-xs font-bold w-20">{f.masteryPercentage}% mastery</span>
                        </div>
                      </div>
                      <Btn
                        variant="ghost"
                        onClick={() => handleStartDrill(f.subject, f.topic)}
                      >
                        Target 10-Item Drill
                      </Btn>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        {/* Right Sidebar: Plan & Quick Drills */}
        <div className="space-y-8">
          <Card className="p-7">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{isNewAccount ? "Day 1 checklist" : "Today's plan"}</h2>
              <button
                onClick={() => go("tasks")}
                className="text-xs font-semibold text-rosetext hover:underline"
              >
                Tasks Hub
              </button>
            </div>

            {plan.length > 0 ? (
              <>
                <div className="flex items-center justify-between mt-3 text-xs text-ink-soft">
                  <span>Progress</span>
                  <span className="font-semibold">{done} of {plan.length} completed</span>
                </div>
                <div className="mt-2"><Bar value={(done / plan.length) * 100} /></div>
                <ul className="mt-5 divide-y divide-line">
                  {plan.map((p, i) => (
                    <li key={p.t || i}>
                      <button
                        onClick={() => handleTogglePlanItem(i)}
                        className="w-full flex items-start gap-3 py-3 text-left hover:bg-lav/30 px-2 rounded-xl transition-colors"
                      >
                        {p.done ? (
                          <CheckCircle2 className="text-rosetext shrink-0 mt-0.5" size={18} />
                        ) : (
                          <Circle className="text-ink-soft/50 shrink-0 mt-0.5" size={18} />
                        )}
                        <span className="flex-1">
                          <span className={`block text-xs sm:text-sm font-medium ${p.done ? "line-through text-ink-soft/60" : "text-ink"}`}>
                            {p.t}
                          </span>
                          <span className="text-[11px] text-ink-soft">{p.time}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="mt-5 py-6 text-center space-y-3 rounded-2xl bg-canvas border border-dashed border-line">
                <p className="text-xs font-bold text-ink">No tasks scheduled for today</p>
                <p className="text-[11px] text-ink-soft max-w-xs mx-auto">
                  Add custom review items or populate recommended daily drill tasks.
                </p>
                <Btn variant="soft" onClick={() => go("tasks")} className="text-xs py-1.5 px-3">
                  Open Tasks
                </Btn>
              </div>
            )}
          </Card>

          <Card className="p-7">
            <h2 className="text-xl font-bold">Quick clinical drills</h2>
            <div className="mt-5 space-y-3">
              {[
                { i: Calculator, t: "Dosage & drip calculations", act: () => handleStartDrill("Pharmacology", "Dosage calculations & IV flow rates") },
                { i: FlaskConical, t: "Lab values cheat sheet", act: () => handleStartDrill("Med-Surg", "Fluid & Electrolyte Imbalances") },
                { i: Layers, t: "Prioritization frameworks", act: () => handleStartDrill("Fundamentals & Ethics", "Prioritization Frameworks") },
              ].map((q) => (
                <button
                  key={q.t}
                  onClick={q.act}
                  className="w-full flex items-center gap-4 rounded-2xl bg-canvas hover:bg-lav px-4 py-3.5 text-left transition-colors"
                >
                  <q.i size={18} className="text-rosetext" />
                  <span className="text-sm font-semibold">{q.t}</span>
                </button>
              ))}
            </div>
            <blockquote className="mt-6 rounded-2xl bg-lav p-5 text-sm italic leading-relaxed text-ink-soft">
              <b className="not-italic text-indigo text-xs uppercase tracking-wider block mb-2">
                Nurse coach tip
              </b>
              "Remember ABCs & Maslow: always treat acute before chronic, unstable before stable."
            </blockquote>
          </Card>
        </div>
      </div>
    </div>
  );
}
