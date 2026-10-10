import { useEffect, useState } from "react";
import { RotateCw } from "lucide-react";
import { Card, PageHead, Pill, Bar } from "../ui";

const deck = [
  { q: "Antidote for heparin overdose?", a: "Protamine sulfate. Monitor aPTT; therapeutic range is 1.5–2.5× control." },
  { q: "Digoxin toxicity: early signs?", a: "Nausea, vomiting, anorexia, yellow-green visual halos. Hold if apical pulse < 60 and check potassium." },
  { q: "First-line treatment for anaphylaxis?", a: "IM epinephrine 0.3–0.5 mg (1:1000) in the anterolateral thigh, then airway support and fluids." },
  { q: "Normal serum potassium range?", a: "3.5–5.0 mEq/L. Hyperkalemia: peaked T waves, widened QRS." },
  { q: "Priority in preeclampsia with seizure risk?", a: "Magnesium sulfate; monitor reflexes, respirations ≥ 12/min, urine output ≥ 30 mL/hr." },
];
const rates = [
  { k: "Hard", d: "< 1 day", c: "bg-[#ffdad6] text-[#93000a] hover:bg-[#ffc5bf]" },
  { k: "Good", d: "3 days", c: "bg-lav text-indigo hover:bg-lav-deep" },
  { k: "Easy", d: "7 days", c: "bg-teal-tint text-rosetext hover:bg-[#f9d3e0]" },
];

export default function Flashcards() {
  const [i, setI] = useState(0);
  const [flip, setFlip] = useState(false);
  const [tally, setTally] = useState({ Hard: 0, Good: 0, Easy: 0 });
  const finished = i >= deck.length;
  const rate = (k: keyof typeof tally) => { setTally((t) => ({ ...t, [k]: t[k] + 1 })); setFlip(false); setI((n) => n + 1); };

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (finished) return;
      if (e.code === "Space") { e.preventDefault(); setFlip((f) => !f); }
      if (flip) { if (e.key === "1") rate("Hard"); if (e.key === "2") rate("Good"); if (e.key === "3") rate("Easy"); }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  });

  return (
    <div className="rise max-w-3xl mx-auto">
      <PageHead eyebrow="Spaced repetition" title="Pharmacology: cardiac drugs" sub="Flip the card, recall, then rate how it felt. Hard cards return sooner." />
      {finished ? (
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold">Session complete</h2>
          <p className="mt-2 text-ink-soft">Next review batch is scheduled by your ratings.</p>
          <div className="mt-8 grid grid-cols-3 gap-4">{rates.map((r) => <div key={r.k} className={`rounded-2xl p-5 ${r.c.split(" hover")[0]}`}><p className="text-3xl font-display font-bold">{tally[r.k as keyof typeof tally]}</p><p className="text-sm font-semibold">{r.k}</p></div>)}</div>
          <button onClick={() => { setI(0); setTally({ Hard: 0, Good: 0, Easy: 0 }); }} className="mt-8 rounded-full bg-teal text-ink px-6 py-3 text-sm font-semibold">Restart deck</button>
        </Card>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-6"><div className="flex-1"><Bar value={(i / deck.length) * 100} /></div><span className="text-sm text-ink-soft">{i + 1} / {deck.length}</span></div>
          <div className="flip-scene">
            <button onClick={() => setFlip(!flip)} className={`flip-card ${flip ? "flipped" : ""} relative block w-full h-[22rem] md:h-[26rem] text-left`} aria-label="Flip card">
              <div className="flip-face absolute inset-0 rounded-[2rem] bg-white border border-line shadow-[0_30px_60px_-30px_rgba(19,27,46,.3)] p-10 md:p-14 flex flex-col">
                <Pill tone="teal">Question</Pill>
                <p className="flex-1 grid place-items-center text-center font-display text-2xl md:text-3xl font-bold leading-snug">{deck[i].q}</p>
                <span className="self-center text-xs text-ink-soft flex items-center gap-2"><RotateCw size={12} /> Tap or press space to flip</span>
              </div>
              <div className="flip-face flip-back absolute inset-0 rounded-[2rem] bg-teal text-ink p-10 md:p-14 flex flex-col shadow-[0_30px_60px_-30px_rgba(230,143,173,.6)]">
                <span className="self-start rounded-full bg-white/50 px-3 py-1 text-xs font-semibold">Answer</span>
                <p className="flex-1 grid place-items-center text-center text-lg md:text-xl leading-relaxed">{deck[i].a}</p>
              </div>
            </button>
          </div>
          <div className={`mt-8 grid grid-cols-3 gap-4 transition-opacity ${flip ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
            {rates.map((r, n) => (
              <button key={r.k} onClick={() => rate(r.k as keyof typeof tally)} className={`rounded-2xl py-4 transition-colors ${r.c}`}>
                <span className="block font-bold">{r.k}</span><span className="block text-xs opacity-70 mt-1">{r.d} · key {n + 1}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
