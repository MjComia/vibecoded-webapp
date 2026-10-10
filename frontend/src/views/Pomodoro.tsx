import { useEffect, useState } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Card, PageHead, Ring, Btn } from "../ui";

const modes = { Focus: 25, "Short break": 5, "Long break": 15 } as const;
export default function Pomodoro() {
  const [mode, setMode] = useState<keyof typeof modes>("Focus");
  const [left, setLeft] = useState(25 * 60);
  const [run, setRun] = useState(false);
  const [subject, setSubject] = useState("Pharmacology");
  const [sessions, setSessions] = useState(3);
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setLeft((l) => { if (l <= 1) { setRun(false); if (mode === "Focus") setSessions((s) => s + 1); return 0; } return l - 1; }), 1000);
    return () => clearInterval(id);
  }, [run, mode]);
  const total = modes[mode] * 60;
  const pick = (m: keyof typeof modes) => { setMode(m); setLeft(modes[m] * 60); setRun(false); };
  const mm = String(Math.floor(left / 60)).padStart(2, "0"), ss = String(left % 60).padStart(2, "0");
  return (
    <div className="rise max-w-2xl mx-auto">
      <PageHead eyebrow="Deep work" title="Pomodoro focus" />
      <Card className="p-10 md:p-14 flex flex-col items-center">
        <div className="flex gap-2 rounded-full bg-lav p-1.5">{(Object.keys(modes) as (keyof typeof modes)[]).map((m) => <button key={m} onClick={() => pick(m)} className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === m ? "bg-white shadow-sm" : "text-ink-soft"}`}>{m}</button>)}</div>
        <div className="my-10"><Ring size={280} stroke={14} value={(left / total) * 100} tone={mode === "Focus" ? "#e68fad" : "#4b41e1"} label={<span className="text-6xl tabular-nums">{mm}:{ss}</span>} /></div>
        <label className="text-sm text-ink-soft flex items-center gap-3">Studying <select value={subject} onChange={(e) => setSubject(e.target.value)} className="rounded-full border border-line bg-white px-4 py-2 text-ink font-semibold">{["Pharmacology", "Med-Surg", "Maternal & Child", "Psychiatric"].map((s) => <option key={s}>{s}</option>)}</select></label>
        <div className="mt-8 flex gap-3"><Btn onClick={() => setRun(!run)} className="px-8 py-3.5 text-base">{run ? <Pause size={18} /> : <Play size={18} />} {run ? "Pause" : "Start"}</Btn><Btn variant="ghost" onClick={() => { setLeft(total); setRun(false); }} aria-label="Reset"><RotateCcw size={16} /></Btn></div>
        <p className="mt-8 text-sm text-ink-soft">{sessions} focus sessions today · logged to {subject}</p>
      </Card>
    </div>
  );
}
