import { useState } from "react";
import { Sparkles, Check, X } from "lucide-react";
import { Card, PageHead, Btn, Pill } from "../ui";

const subjects = ["Pharmacology", "Med-Surg", "Maternal & Child", "Psychiatric", "Fundamentals"];
const topics: Record<string, string[]> = {
  Pharmacology: ["Cardiac drugs", "Anticoagulants", "Insulin & hypoglycemics"],
  "Med-Surg": ["Fluid & electrolytes", "Respiratory", "Renal"],
  "Maternal & Child": ["Preeclampsia", "Labor complications", "Neonatal care"],
  Psychiatric: ["Defense mechanisms", "Therapeutic communication"],
  Fundamentals: ["Prioritization", "Infection control"],
};
const levels = ["Foundation", "Board-level", "Hard NGN"];
const bank = [
  { q: "A client on digoxin has an apical pulse of 54 and nausea. What is the nurse's priority action?", o: ["Administer the dose with food", "Hold the dose and notify the provider", "Recheck the pulse in 4 hours", "Encourage fluids"], a: 1, r: "Pulse < 60 with GI symptoms suggests toxicity; hold and notify." },
  { q: "Which lab finding requires immediate intervention in a client receiving furosemide?", o: ["Sodium 138", "Potassium 2.9", "Calcium 9.2", "Chloride 100"], a: 1, r: "Loop diuretics waste potassium; 2.9 mEq/L risks arrhythmia." },
  { q: "A postpartum client reports a headache with BP 162/108. Which medication should be anticipated?", o: ["Magnesium sulfate", "Oxytocin", "Methylergonovine", "Terbutaline"], a: 0, r: "Severe-range BP with headache signals preeclampsia; magnesium prevents seizures." },
];

export default function Quiz() {
  const [s, setS] = useState(subjects[0]);
  const [t, setT] = useState(topics[subjects[0]][0]);
  const [l, setL] = useState(levels[1]);
  const [phase, setPhase] = useState<"setup" | "loading" | "run" | "done">("setup");
  const [n, setN] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  const gen = () => { setPhase("loading"); setN(0); setScore(0); setPick(null); setTimeout(() => setPhase("run"), 1400); };
  const chip = (on: boolean) => `rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${on ? "bg-teal text-ink border-teal" : "bg-white border-line hover:bg-lav"}`;

  return (
    <div className="rise max-w-3xl mx-auto">
      <PageHead eyebrow="AI quiz maker" title="Generate a board-style quiz" sub="Choose a subject, topic and difficulty. Questions arrive with rationales." />
      {phase === "setup" && (
        <Card className="p-8 md:p-10 space-y-8">
          <div><p className="text-sm font-semibold mb-3">Subject</p><div className="flex flex-wrap gap-2">{subjects.map((x) => <button key={x} onClick={() => { setS(x); setT(topics[x][0]); }} className={chip(s === x)}>{x}</button>)}</div></div>
          <div><p className="text-sm font-semibold mb-3">Syllabus topic</p><div className="flex flex-wrap gap-2">{topics[s].map((x) => <button key={x} onClick={() => setT(x)} className={chip(t === x)}>{x}</button>)}</div></div>
          <div><p className="text-sm font-semibold mb-3">Difficulty</p><div className="flex flex-wrap gap-2">{levels.map((x) => <button key={x} onClick={() => setL(x)} className={chip(l === x)}>{x}</button>)}</div></div>
          <Btn onClick={gen} className="w-full py-4 text-base"><Sparkles size={18} /> Generate 3 questions</Btn>
        </Card>
      )}
      {phase === "loading" && <Card className="p-16 text-center"><div className="mx-auto size-12 rounded-full border-4 border-lav border-t-teal animate-spin" /><p className="mt-6 font-semibold">Writing {l.toLowerCase()} questions on {t}…</p></Card>}
      {phase === "run" && (
        <Card className="p-8 md:p-10">
          <div className="flex gap-2 mb-6"><Pill tone="teal">{s}</Pill><Pill>{t}</Pill><Pill tone="indigo">{l}</Pill></div>
          <p className="text-xs font-semibold text-ink-soft">Question {n + 1} of {bank.length}</p>
          <h2 className="mt-2 text-xl md:text-2xl font-bold leading-snug">{bank[n].q}</h2>
          <div className="mt-8 space-y-3">
            {bank[n].o.map((o, i) => {
              const state = pick === null ? "" : i === bank[n].a ? "border-teal bg-teal-tint" : i === pick ? "border-danger bg-[#ffdad6]" : "opacity-50";
              return (
                <button key={o} disabled={pick !== null} onClick={() => { setPick(i); if (i === bank[n].a) setScore((x) => x + 1); }} className={`w-full flex items-center justify-between gap-4 rounded-2xl border border-line px-5 py-4 text-left text-sm font-medium transition-colors ${pick === null ? "hover:bg-lav" : state}`}>
                  {o}{pick !== null && i === bank[n].a && <Check size={18} className="text-rosetext" />}{pick === i && i !== bank[n].a && <X size={18} className="text-danger" />}
                </button>
              );
            })}
          </div>
          {pick !== null && (
            <div className="mt-6 rounded-2xl bg-lav p-5 text-sm leading-relaxed"><b>Rationale: </b>{bank[n].r}</div>
          )}
          {pick !== null && <Btn className="mt-6" onClick={() => (n + 1 < bank.length ? (setN(n + 1), setPick(null)) : setPhase("done"))}>{n + 1 < bank.length ? "Next question" : "See results"}</Btn>}
        </Card>
      )}
      {phase === "done" && (
        <Card className="p-12 text-center"><p className="font-display text-6xl font-bold text-rosetext">{score}/{bank.length}</p><p className="mt-3 text-ink-soft">Results added to your analytics.</p><Btn className="mt-8" onClick={() => setPhase("setup")}>New quiz</Btn></Card>
      )}
    </div>
  );
}
