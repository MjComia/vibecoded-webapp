import { useEffect, useState } from "react";
import { Clock, ShieldCheck } from "lucide-react";
import { Card, PageHead, Btn } from "../ui";

const qs = [
  { q: "Which client should the nurse assess first?", o: ["Post-op day 2 with pain 4/10", "COPD client with SpO2 86%", "Diabetic with glucose 160", "Client awaiting discharge"], a: 1 },
  { q: "A client taking lithium reports vomiting and tremors. The nurse should suspect:", o: ["Dehydration only", "Lithium toxicity", "Anxiety", "Hypoglycemia"], a: 1 },
  { q: "Normal fetal heart rate baseline range?", o: ["60–100", "110–160", "160–200", "80–120"], a: 1 },
];
export default function Mock() {
  const [phase, setPhase] = useState<"intro" | "run" | "done">("intro");
  const [n, setN] = useState(0);
  const [ans, setAns] = useState<number[]>([]);
  const [left, setLeft] = useState(15 * 60);
  useEffect(() => { if (phase !== "run") return; const id = setInterval(() => setLeft((l) => (l <= 1 ? (setPhase("done"), 0) : l - 1)), 1000); return () => clearInterval(id); }, [phase]);
  const score = ans.filter((a, i) => a === qs[i].a).length;
  return (
    <div className="rise max-w-3xl mx-auto">
      <PageHead eyebrow="Full-length simulator" title="Mock exam" />
      {phase === "intro" && <Card className="p-10"><h2 className="text-2xl font-bold">NCLEX-RN simulation</h2><ul className="mt-6 space-y-3 text-ink-soft text-sm"><li className="flex gap-3"><Clock size={18} className="text-rosetext" /> Timed. No pausing once started.</li><li className="flex gap-3"><ShieldCheck size={18} className="text-rosetext" /> No going back to previous questions.</li></ul><Btn className="mt-8 py-3.5 px-8" onClick={() => setPhase("run")}>Begin exam</Btn></Card>}
      {phase === "run" && <Card className="p-8 md:p-10"><div className="flex justify-between text-sm font-semibold mb-8"><span>Item {n + 1} of {qs.length}</span><span className={`tabular-nums ${left < 120 ? "text-danger" : "text-rosetext"}`}>{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</span></div>
        <h2 className="text-xl font-bold leading-snug">{qs[n].q}</h2>
        <div className="mt-6 space-y-3">{qs[n].o.map((o, i) => <button key={o} onClick={() => { const a = [...ans, i]; setAns(a); n + 1 < qs.length ? setN(n + 1) : setPhase("done"); }} className="w-full text-left rounded-2xl border border-line px-5 py-4 text-sm font-medium hover:bg-lav transition-colors">{o}</button>)}</div></Card>}
      {phase === "done" && <Card className="p-12 text-center"><p className="font-display text-6xl font-bold text-rosetext">{score}/{qs.length}</p><p className="mt-3 text-ink-soft">Exam submitted.</p><Btn className="mt-8" onClick={() => { setPhase("intro"); setN(0); setAns([]); setLeft(900); }}>Retake</Btn></Card>}
    </div>
  );
}
