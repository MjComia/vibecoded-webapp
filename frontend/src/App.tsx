import { useState } from "react";
import { LayoutDashboard, Layers, Sparkles, CalendarDays, ListChecks, Timer, BarChart3, ClipboardCheck, FolderOpen, Users, Menu, X, Stethoscope } from "lucide-react";
import Dashboard from "./views/Dashboard";
import Flashcards from "./views/Flashcards";
import Quiz from "./views/Quiz";
import Plan from "./views/Plan";
import Tasks from "./views/Tasks";
import Pomodoro from "./views/Pomodoro";
import Analytics from "./views/Analytics";
import Mock from "./views/Mock";
import Documents from "./views/Documents";
import Community from "./views/Community";

const nav = [
  { id: "dash", l: "Dashboard", i: LayoutDashboard }, { id: "flashcards", l: "Flashcards", i: Layers },
  { id: "quiz", l: "AI Quiz Maker", i: Sparkles }, { id: "plan", l: "Study plan", i: CalendarDays },
  { id: "tasks", l: "Tasks", i: ListChecks }, { id: "pomodoro", l: "Pomodoro", i: Timer },
  { id: "analytics", l: "Analytics", i: BarChart3 }, { id: "mock", l: "Mock exam", i: ClipboardCheck },
  { id: "docs", l: "Documents & AI", i: FolderOpen }, { id: "community", l: "Community", i: Users },
];

export default function App() {
  const [view, setView] = useState("dash");
  const [open, setOpen] = useState(false);
  const go = (v: string) => { setView(v); setOpen(false); window.scrollTo({ top: 0 }); };
  const V = { dash: <Dashboard go={go} />, flashcards: <Flashcards />, quiz: <Quiz />, plan: <Plan />, tasks: <Tasks />, pomodoro: <Pomodoro />, analytics: <Analytics />, mock: <Mock />, docs: <Documents />, community: <Community /> }[view];
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[272px_1fr]">
      <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur border-b border-line px-5 py-4">
        <span className="font-display font-extrabold text-lg text-rosetext">Real Nurse</span>
        <button onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
      </header>
      <aside className={`${open ? "block" : "hidden"} lg:block fixed lg:sticky inset-x-0 top-[61px] lg:top-0 bottom-0 lg:h-screen z-20 bg-white border-r border-line p-6 overflow-y-auto`}>
        <div className="hidden lg:flex items-center gap-3 px-3 mb-10">
          <div className="size-11 rounded-2xl bg-teal text-ink grid place-items-center"><Stethoscope size={22} /></div>
          <div><p className="font-display font-extrabold text-lg leading-none">Real Nurse</p><p className="text-[11px] text-ink-soft mt-1">NCLEX-RN candidate</p></div>
        </div>
        <nav className="space-y-1.5">
          {nav.map((n) => (
            <button key={n.id} onClick={() => go(n.id)} className={`w-full flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${view === n.id ? "bg-teal text-ink" : "text-ink-soft hover:bg-lav"}`}><n.i size={18} />{n.l}</button>
          ))}
        </nav>
      </aside>
      <main className="px-5 sm:px-8 lg:px-14 py-10 lg:py-14 max-w-[1280px] w-full mx-auto">{V}</main>
    </div>
  );
}
