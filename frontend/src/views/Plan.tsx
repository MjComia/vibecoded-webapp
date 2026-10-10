import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, PageHead, Pill } from "../ui";

const examDate = new Date(2025, 10, 18);
const kinds = ["Flashcards", "Reading", "Practice test", "Quiz", "Rest"];
const tone = ["bg-teal-tint text-rosetext", "bg-lav text-indigo", "bg-[#ffe8cf] text-[#8d4b00]", "bg-lav-deep text-indigo", "bg-canvas text-ink-soft"];

export default function Plan() {
  const [month, setMonth] = useState(new Date(2025, 10, 1));
  const [sel, setSel] = useState(new Date(2025, 10, 6));
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first.getDay()).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const plan = (d: number) => (d % 7 === 0 ? 4 : d % 5 === 0 ? 2 : d % 3 === 0 ? 1 : d % 2 === 0 ? 0 : 3);
  const isExam = (d: number) => month.getMonth() === examDate.getMonth() && d === examDate.getDate();
  const k = plan(sel.getDate());
  const daysLeft = Math.ceil((examDate.getTime() - sel.getTime()) / 864e5);

  return (
    <div className="rise">
      <PageHead eyebrow="Backward-planned" title="Study plan & calendar" sub="Your schedule works backward from exam day, front-loading weak topics." />
      <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">{month.toLocaleString("en", { month: "long", year: "numeric" })}</h2>
            <div className="flex gap-2">{[-1, 1].map((d) => <button key={d} aria-label={d < 0 ? "Previous month" : "Next month"} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + d, 1))} className="size-10 grid place-items-center rounded-full bg-lav hover:bg-lav-deep">{d < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}</button>)}</div>
          </div>
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-ink-soft mb-2">{["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
          <div className="grid grid-cols-7 gap-2">
            {cells.map((d, i) => d === null ? <span key={i} /> : (
              <button key={i} onClick={() => setSel(new Date(month.getFullYear(), month.getMonth(), d))} className={`aspect-square rounded-2xl text-sm font-semibold flex flex-col items-center justify-center gap-1 transition-colors ${isExam(d) ? "bg-danger text-white" : sel.getDate() === d && sel.getMonth() === month.getMonth() ? "bg-teal text-ink" : tone[plan(d)] + " hover:ring-2 ring-teal/40"}`}>
                {d}{isExam(d) && <span className="text-[9px] uppercase tracking-wider">Exam</span>}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">{kinds.map((n, i) => <span key={n} className={`rounded-full px-3 py-1 text-xs font-semibold ${tone[i]}`}>{n}</span>)}</div>
        </Card>
        <Card className="p-8 h-fit">
          <p className="text-xs font-semibold uppercase tracking-wider text-rosetext">{sel.toLocaleDateString("en", { weekday: "long", month: "long", day: "numeric" })}</p>
          <h2 className="mt-2 text-2xl font-bold">{kinds[k]} day</h2>
          <p className="mt-2 text-sm text-ink-soft">{daysLeft > 0 ? `${daysLeft} days before exam` : daysLeft === 0 ? "Exam day. You've got this." : "Past exam date"}</p>
          <ul className="mt-6 space-y-3">
            {["Warm-up: 20 SRS cards", `Core: ${kinds[k].toLowerCase()} session · 45 min`, "Cooldown: review mistakes"].map((t) => <li key={t} className="rounded-2xl bg-canvas px-4 py-3.5 text-sm font-medium">{t}</li>)}
          </ul>
          <div className="mt-6"><Pill tone="teal">Auto-adjusted</Pill></div>
        </Card>
      </div>
    </div>
  );
}
