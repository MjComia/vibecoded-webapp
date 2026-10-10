import { ArrowRight, Flame, Hourglass, Layers, UploadCloud, Zap, Timer, CheckCircle2, Circle, FileText, Presentation, Calculator, FlaskConical } from "lucide-react";
import { useState } from "react";
import { Card, Btn, Pill, Bar, Ring } from "../ui";
import { useAuth } from "../context/AuthContext";

const initialPlan = [
  { t: "Review 25 cardiac pharmacology flashcards", time: "08:30", done: true },
  { t: "15 NGN case study questions on postpartum care", time: "10:15", done: true },
  { t: "25-min Pomodoro deep focus on ABG interpretation", time: "11:45", done: true },
  { t: "10-min timed quiz: pediatric milestones", time: "03:00 PM", done: false },
  { t: "Evening review: bookmarked NCLEX questions", time: "07:30 PM", done: false },
];

const focus = [
  { tag: "Med-Surg", t: "Dosage calculations & IV flow rates", m: 42, tone: "red" as const, cta: "Retake 10-item drill" },
  { tag: "Psychiatric", t: "Defense mechanisms & therapeutic communication", m: 51, tone: "amber" as const, cta: "Review 18 cards" },
  { tag: "Physiology", t: "Fluid & electrolyte imbalances", m: 56, tone: "teal" as const, cta: "Practice cases" },
];

export default function Dashboard({ go }: { go: (v: string) => void }) {
  const { profile } = useAuth();
  const [plan, setPlan] = useState(initialPlan);
  const done = plan.filter((p) => p.done).length;

  const firstName = profile.full_name?.split(" ")[0] || "Candidate";
  const examDateObj = new Date(profile.exam_date || "2025-11-18");
  const examDateFormatted = examDateObj.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const daysRemaining = Math.max(0, Math.ceil((examDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="space-y-10 rise">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Good morning, {firstName} 👋</h1>
          <p className="mt-3 text-ink-soft max-w-xl">
            Steady composure builds clinical confidence. Your target:{" "}
            <b className="text-rosetext">{profile.target_exam}</b> · {examDateFormatted} intake.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Btn onClick={() => go("docs")}><UploadCloud size={16} /> Upload notes</Btn>
          <Btn variant="soft" onClick={() => go("quiz")}><Zap size={16} /> Quick 10-item drill</Btn>
          <Btn variant="ghost" onClick={() => go("pomodoro")}><Timer size={16} /> Focus timer</Btn>
        </div>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-6 flex items-center gap-5">
          <Ring value={78} label={<span className="text-xl">78%</span>} />
          <div><p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Predicted readiness</p><div className="mt-2"><Pill tone="teal">Likely to pass</Pill></div></div>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Countdown</p>
          <p className="mt-3 font-display text-5xl font-bold">{daysRemaining} <span className="text-base font-medium text-ink-soft">days left</span></p>
          <p className="mt-3 text-sm text-rosetext font-semibold flex items-center gap-2"><Hourglass size={14} /> On schedule for {profile.target_exam}</p>
        </Card>
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Consistency streak</p>
          <p className="mt-3 font-display text-5xl font-bold flex items-center gap-2">{profile.streak_days} <Flame className="text-amber" fill="#ffb86b" size={30} /></p>
          <p className="mt-3 text-sm text-ink-soft">Personal best {Math.max(21, profile.streak_days)} days</p>
        </Card>
        <Card className="p-6 bg-indigo text-white border-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/70">SRS queue today</p>
          <p className="mt-3 font-display text-5xl font-bold">42 <span className="text-base font-medium text-white/70">cards due</span></p>
          <button onClick={() => go("flashcards")} className="mt-3 text-sm font-semibold inline-flex items-center gap-2 hover:gap-3 transition-all">Start review <ArrowRight size={14} /></button>
        </Card>
      </div>

      <Card className="p-8 md:p-10">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="max-w-xl">
            <Pill tone="indigo">New · Document hub</Pill>
            <h2 className="mt-4 text-2xl font-bold">Turn any clinical document into a study set</h2>
            <p className="mt-2 text-ink-soft leading-relaxed">Upload a PDF, slide deck or lecture notes. AI reads it, builds flashcards and graded quizzes, and answers your questions using only your file.</p>
          </div>
          <Btn onClick={() => go("docs")} className="px-7 py-3.5">Open document hub <ArrowRight size={16} /></Btn>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            { i: FileText, n: "Saunders_Pharm_Ch14.pdf", s: "Processed · 48 cards · 15 quizzes", p: 100 },
            { i: Presentation, n: "Maternal_Child_Preeclampsia.pptx", s: "Generating NGN case studies…", p: 78 },
            { i: FileText, n: "Brunner_Endocrine_Notes.pdf", s: "Ready · 32 cards", p: 100 },
          ].map((f) => (
            <div key={f.n} className="rounded-2xl bg-canvas p-5">
              <div className="flex items-center gap-3"><div className="grid place-items-center size-10 rounded-xl bg-white text-rosetext"><f.i size={18} /></div><p className="text-sm font-semibold truncate">{f.n}</p></div>
              <p className="mt-3 mb-3 text-xs text-ink-soft">{f.s}</p>
              <Bar value={f.p} tone={f.p < 100 ? "indigo" : "teal"} />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-8 xl:grid-cols-[1.5fr_1fr]">
        <div className="space-y-8">
          <div>
            <div className="flex items-center justify-between mb-5"><h2 className="text-xl font-bold">Continue studying</h2><button onClick={() => go("flashcards")} className="text-sm font-semibold text-rosetext">View all decks</button></div>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                { k: "Pharmacology", h: "Autonomic nervous system & cardiac drugs", d: "Beta-blockers, ACE inhibitors, digoxin toxicity benchmarks.", due: "28 cards due · ~12 min", cta: "Start review", go: "flashcards", v: "primary" as const },
                { k: "Maternal & Child", h: "Labor & delivery complications drill", d: "NGN case simulations: preeclampsia, cord prolapse, FHR.", due: "10 case simulations", cta: "Launch quiz", go: "quiz", v: "indigo" as const },
              ].map((c) => (
                <Card key={c.h} className="p-7 flex flex-col">
                  <Pill tone="lav">{c.k}</Pill>
                  <h3 className="mt-5 text-xl font-bold leading-snug">{c.h}</h3>
                  <p className="mt-2 text-sm text-ink-soft leading-relaxed flex-1">{c.d}</p>
                  <div className="mt-6 flex items-center justify-between gap-3"><span className="text-xs text-ink-soft">{c.due}</span><Btn variant={c.v} onClick={() => go(c.go)}>{c.cta}</Btn></div>
                </Card>
              ))}
            </div>
          </div>

          <Card className="p-8">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold">Focus areas needing polish</h2><p className="mt-1 text-sm text-ink-soft">Gaps detected from recent mock tests and spaced reviews.</p></div><Pill tone="red">3 priorities</Pill></div>
            <div className="mt-7 space-y-6">
              {focus.map((f) => (
                <div key={f.t} className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-3"><Pill>{f.tag}</Pill><p className="text-sm font-semibold">{f.t}</p></div>
                    <div className="mt-3 flex items-center gap-4"><div className="flex-1"><Bar value={f.m} tone={f.tone} /></div><span className="text-xs font-bold w-20">{f.m}% mastery</span></div>
                  </div>
                  <Btn variant="ghost" onClick={() => go("quiz")}>{f.cta}</Btn>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="p-7">
            <div className="flex items-center justify-between"><h2 className="text-xl font-bold">Today's plan</h2><span className="text-sm text-ink-soft">{done} of {plan.length}</span></div>
            <div className="mt-4"><Bar value={(done / plan.length) * 100} /></div>
            <ul className="mt-5 divide-y divide-line">
              {plan.map((p, i) => (
                <li key={p.t}>
                  <button onClick={() => setPlan(plan.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))} className="w-full flex items-start gap-3 py-3.5 text-left">
                    {p.done ? <CheckCircle2 className="text-rosetext shrink-0 mt-0.5" size={20} /> : <Circle className="text-ink-soft/50 shrink-0 mt-0.5" size={20} />}
                    <span className="flex-1"><span className={`block text-sm font-medium ${p.done ? "line-through text-ink-soft/60" : ""}`}>{p.t}</span><span className="text-xs text-ink-soft">{p.time}</span></span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="p-7">
            <h2 className="text-xl font-bold">Quick drills</h2>
            <div className="mt-5 space-y-3">
              {[{ i: Calculator, t: "Dosage & drip calculator" }, { i: FlaskConical, t: "Lab values cheat sheet" }, { i: Layers, t: "Prioritization frameworks" }].map((q) => (
                <button key={q.t} className="w-full flex items-center gap-4 rounded-2xl bg-canvas hover:bg-lav px-4 py-3.5 text-left transition-colors"><q.i size={18} className="text-rosetext" /><span className="text-sm font-semibold">{q.t}</span></button>
              ))}
            </div>
            <blockquote className="mt-6 rounded-2xl bg-lav p-5 text-sm italic leading-relaxed text-ink-soft"><b className="not-italic text-indigo text-xs uppercase tracking-wider block mb-2">Nurse coach tip</b>"Remember ABCs & Maslow: always treat acute before chronic, unstable before stable."</blockquote>
          </Card>
        </div>
      </div>
    </div>
  );
}
