import { useState } from "react";
import { Plus, Layers, BookOpen, ClipboardCheck, Check } from "lucide-react";
import { Card, PageHead, Bar, Btn } from "../ui";

type T = { id: number; t: string; kind: "cards" | "read" | "test"; day: string; done: boolean };
const icons = { cards: Layers, read: BookOpen, test: ClipboardCheck };
const seed: T[] = [
  { id: 1, t: "Cardiac pharmacology deck (25 cards)", kind: "cards", day: "Today", done: true },
  { id: 2, t: "Read: Maternal-child module 4", kind: "read", day: "Today", done: false },
  { id: 3, t: "Timed quiz: pediatric milestones", kind: "test", day: "Today", done: false },
  { id: 4, t: "Fluid & electrolytes deck (30 cards)", kind: "cards", day: "Tomorrow", done: false },
  { id: 5, t: "Practice test: Med-Surg 75 items", kind: "test", day: "Tomorrow", done: false },
];

export default function Tasks() {
  const [tasks, setTasks] = useState(seed);
  const [txt, setTxt] = useState("");
  const done = tasks.filter((t) => t.done).length;
  const add = () => { if (!txt.trim()) return; setTasks([...tasks, { id: Date.now(), t: txt, kind: "read", day: "Today", done: false }]); setTxt(""); };
  return (
    <div className="rise max-w-3xl mx-auto">
      <PageHead eyebrow="Daily checklist" title="Tasks" sub="Each task links to a scheduled study day." />
      <Card className="p-6 mb-8 flex items-center gap-5"><div className="flex-1"><Bar value={(done / tasks.length) * 100} /></div><span className="text-sm font-semibold">{done}/{tasks.length} done</span></Card>
      <form onSubmit={(e) => { e.preventDefault(); add(); }} className="flex gap-3 mb-10"><input value={txt} onChange={(e) => setTxt(e.target.value)} placeholder="Add a review task…" className="flex-1 rounded-full border border-line bg-white px-6 py-3.5 text-sm" /><Btn type="submit"><Plus size={16} /> Add</Btn></form>
      {["Today", "Tomorrow"].map((d) => (
        <div key={d} className="mb-8"><h2 className="text-sm font-semibold uppercase tracking-wider text-ink-soft mb-4">{d}</h2>
          <div className="space-y-3">{tasks.filter((t) => t.day === d).map((t) => { const I = icons[t.kind]; return (
            <button key={t.id} onClick={() => setTasks(tasks.map((x) => (x.id === t.id ? { ...x, done: !x.done } : x)))} className="w-full flex items-center gap-4 rounded-2xl bg-white border border-line px-5 py-4 text-left hover:border-teal/50 transition-colors">
              <span className={`size-6 rounded-full grid place-items-center border-2 ${t.done ? "bg-teal border-teal text-ink" : "border-line"}`}>{t.done && <Check size={14} />}</span>
              <span className={`flex-1 text-sm font-medium ${t.done ? "line-through text-ink-soft/60" : ""}`}>{t.t}</span><I size={16} className="text-ink-soft" />
            </button>); })}</div></div>
      ))}
    </div>
  );
}
