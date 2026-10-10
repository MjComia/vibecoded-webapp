import { useRef, useState } from "react";
import { UploadCloud, FileText, Send, Sparkles, Layers, ListChecks } from "lucide-react";
import { Card, PageHead, Btn, Pill } from "../ui";

type Doc = { name: string; size: string; status: string };
const seed: Doc[] = [
  { name: "Saunders_Comprehensive_Pharm_Ch14.pdf", size: "18.4 MB", status: "Ready" },
  { name: "Brunner_Suddarth_Endocrine_Notes.pdf", size: "12.1 MB", status: "Ready" },
];
const excerpt = [
  "Digoxin has a narrow therapeutic index (0.5–2 ng/mL). Toxicity is more likely when serum potassium is low.",
  "Before administration, assess the apical pulse for a full minute. Hold the dose if the rate is below 60 bpm in adults and notify the provider.",
  "Early signs of toxicity include anorexia, nausea, vomiting, fatigue, and visual disturbances such as yellow-green halos. The antidote is digoxin immune fab.",
];

export default function Documents() {
  const [docs, setDocs] = useState(seed);
  const [cur, setCur] = useState(0);
  const [drag, setDrag] = useState(false);
  const [msgs, setMsgs] = useState([{ me: false, t: "Ask me anything about this document. I'll answer from its content." }]);
  const [q, setQ] = useState("");
  const [made, setMade] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  const add = (files: FileList | null) => {
    if (!files?.length) return;
    const nd = [...Array.from(files).map((f) => ({ name: f.name, size: (f.size / 1048576).toFixed(1) + " MB", status: "Scanning…" })), ...docs];
    setDocs(nd); setCur(0);
    setTimeout(() => setDocs((d) => d.map((x) => (x.status === "Scanning…" ? { ...x, status: "Ready" } : x))), 1800);
  };
  const ask = () => {
    if (!q.trim()) return;
    const ans = /digoxin|pulse|toxic/i.test(q) ? "Per page 2: hold digoxin if the apical pulse is below 60 bpm and notify the provider. Toxicity risk rises with low potassium." : "I couldn't find that in this document. Try a more specific term from the text.";
    setMsgs([...msgs, { me: true, t: q }, { me: false, t: ans }]); setQ("");
  };

  return (
    <div className="rise">
      <PageHead eyebrow="Document hub" title="Study from your own files" sub="Upload, read, generate flashcards and quizzes, and ask the AI about it." />
      <div className="grid gap-8 xl:grid-cols-[1fr_1.3fr]">
        <div className="space-y-8">
          <div onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }} className={`rounded-3xl border-2 border-dashed p-10 text-center transition-colors ${drag ? "border-teal bg-teal-tint" : "border-lav-deep bg-white"}`}>
            <div className="mx-auto size-14 rounded-2xl bg-lav grid place-items-center text-rosetext"><UploadCloud /></div>
            <h2 className="mt-5 text-lg font-bold">Drop PDFs, slides or notes</h2>
            <p className="mt-1 text-sm text-ink-soft">PDF, DOCX, PPTX, images · up to 50 MB</p>
            <input ref={ref} type="file" multiple hidden onChange={(e) => add(e.target.files)} />
            <Btn className="mt-6" onClick={() => ref.current?.click()}>Browse files</Btn>
          </div>
          <Card className="p-3">
            {docs.map((d, i) => (
              <button key={d.name + i} onClick={() => setCur(i)} className={`w-full flex items-center gap-4 rounded-2xl px-4 py-4 text-left transition-colors ${cur === i ? "bg-lav" : "hover:bg-canvas"}`}>
                <FileText size={20} className="text-rosetext shrink-0" /><span className="flex-1 min-w-0"><span className="block text-sm font-semibold truncate">{d.name}</span><span className="text-xs text-ink-soft">{d.size}</span></span><Pill tone={d.status === "Ready" ? "teal" : "indigo"}>{d.status}</Pill>
              </button>
            ))}
          </Card>
        </div>
        <div className="space-y-8">
          <Card className="p-8">
            <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="text-lg font-bold truncate max-w-sm">{docs[cur]?.name}</h2>
              <div className="flex gap-2"><Btn variant="soft" onClick={() => setMade("48 flashcards created")}><Layers size={15} /> Flashcards</Btn><Btn variant="soft" onClick={() => setMade("Easy → hard quiz (15 items) created")}><ListChecks size={15} /> Quiz</Btn></div></div>
            {made && <p className="mt-4 text-sm font-semibold text-rosetext flex items-center gap-2"><Sparkles size={14} /> {made}</p>}
            <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-ink-soft max-h-56 overflow-y-auto pr-2">{excerpt.map((p) => <p key={p}>{p}</p>)}</div>
          </Card>
          <Card className="p-8 flex flex-col">
            <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles size={18} className="text-indigo" /> Ask the document</h2>
            <div className="mt-5 space-y-3 max-h-64 overflow-y-auto">{msgs.map((m, i) => <div key={i} className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.me ? "ml-auto bg-teal text-ink" : "bg-lav"}`}>{m.t}</div>)}</div>
            <form onSubmit={(e) => { e.preventDefault(); ask(); }} className="mt-5 flex gap-3"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="When should I hold digoxin?" className="flex-1 rounded-full border border-line px-5 py-3 text-sm" /><Btn variant="indigo" type="submit" aria-label="Send"><Send size={16} /></Btn></form>
          </Card>
        </div>
      </div>
    </div>
  );
}
