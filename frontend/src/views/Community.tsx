import { useState } from "react";
import { Star, Download, Check } from "lucide-react";
import { Card, PageHead, Btn, Pill } from "../ui";

const decks = [
  { t: "NCLEX-RN High-Yield Pharm", by: "Dr. Alma Reyes, RN", n: 640, r: 4.9, tag: "Flashcards" },
  { t: "NGN Case Study Bank", by: "BoardPrep Collective", n: 220, r: 4.8, tag: "Question bank" },
  { t: "Lab Values & Interpretation", by: "Marcus Tan, BSN", n: 180, r: 4.7, tag: "Flashcards" },
  { t: "Maternal-Newborn Rapid Review", by: "Priya Nair, MSN", n: 410, r: 4.6, tag: "Flashcards" },
  { t: "Prioritization & Delegation", by: "BoardPrep Collective", n: 300, r: 4.9, tag: "Question bank" },
  { t: "Psych-Mental Health Essentials", by: "Lena Okafor, RN", n: 275, r: 4.5, tag: "Flashcards" },
];
export default function Community() {
  const [got, setGot] = useState<string[]>([]);
  const [f, setF] = useState("All");
  return (
    <div className="rise">
      <PageHead eyebrow="Community" title="Shared decks" sub="Import vetted decks and question banks from other candidates." />
      <div className="flex gap-2 mb-8">{["All", "Flashcards", "Question bank"].map((x) => <button key={x} onClick={() => setF(x)} className={`rounded-full px-4 py-2 text-sm font-semibold border ${f === x ? "bg-teal text-ink border-teal" : "bg-white border-line"}`}>{x}</button>)}</div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {decks.filter((d) => f === "All" || d.tag === f).map((d) => (
          <Card key={d.t} className="p-7 flex flex-col"><Pill tone="indigo">{d.tag}</Pill><h3 className="mt-4 text-lg font-bold leading-snug">{d.t}</h3><p className="mt-1 text-sm text-ink-soft">{d.by}</p>
            <div className="mt-6 flex items-center justify-between"><span className="text-sm text-ink-soft flex items-center gap-1"><Star size={14} className="text-amber" fill="#ffb86b" /> {d.r} · {d.n} items</span>
              {got.includes(d.t) ? <Pill tone="teal"><Check size={12} /> Imported</Pill> : <Btn variant="soft" onClick={() => setGot([...got, d.t])}><Download size={14} /> Import</Btn>}</div></Card>
        ))}
      </div>
    </div>
  );
}
