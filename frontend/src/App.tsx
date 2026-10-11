import { useState } from "react";
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  CalendarDays,
  ListChecks,
  Timer,
  BarChart3,
  ClipboardCheck,
  FolderOpen,
  Users,
  Menu,
  X,
  Stethoscope,
  UserCircle,
  LogOut,
  ArrowRight,
} from "lucide-react";
import Landing from "./views/Landing";
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
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PomodoroProvider, usePomodoro } from "./context/PomodoroContext";
import AuthModal from "./components/AuthModal";
import { Pill, Btn } from "./ui";

const nav = [
  { id: "dash", l: "Dashboard", i: LayoutDashboard },
  { id: "flashcards", l: "Flashcards", i: Layers },
  { id: "quiz", l: "AI Quiz Maker", i: Sparkles },
  { id: "plan", l: "Study plan", i: CalendarDays },
  { id: "tasks", l: "Tasks", i: ListChecks },
  { id: "pomodoro", l: "Pomodoro", i: Timer },
  { id: "analytics", l: "Analytics", i: BarChart3 },
  { id: "mock", l: "Mock exam", i: ClipboardCheck },
  { id: "docs", l: "Documents & AI", i: FolderOpen },
  { id: "community", l: "Community", i: Users },
];

function AppContent() {
  const [view, setView] = useState("dash");
  const [open, setOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signup");
  const [demoMode, setDemoMode] = useState(() => sessionStorage.getItem("realnurse_demo") === "true");

  const { profile, isGuest, signOut, user } = useAuth();
  const { isRunning: isPomoRunning, formattedTime: pomoTime } = usePomodoro();

  const handleOpenAuth = (mode: "signin" | "signup" = "signup") => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  const handleEnterDemo = () => {
    sessionStorage.setItem("realnurse_demo", "true");
    setDemoMode(true);
    setView("dash");
    window.scrollTo({ top: 0 });
  };

  const handleExitDemo = () => {
    sessionStorage.removeItem("realnurse_demo");
    setDemoMode(false);
  };

  const go = (v: string) => {
    setView(v);
    setOpen(false);
    window.scrollTo({ top: 0 });
  };

  // If user is not logged in and not in demo mode, show the high-converting Landing Page!
  if (!user && !demoMode) {
    return (
      <>
        <Landing
          onGetStarted={() => handleOpenAuth("signup")}
          onSignIn={() => handleOpenAuth("signin")}
          onTryDemo={handleEnterDemo}
        />
        <AuthModal
          isOpen={showAuthModal}
          initialMode={authModalMode}
          onClose={() => setShowAuthModal(false)}
        />
      </>
    );
  }

  const V = {
    dash: <Dashboard go={go} />,
    flashcards: <Flashcards go={go} />,
    quiz: <Quiz go={go} />,
    plan: <Plan go={go} />,
    tasks: <Tasks go={go} />,
    pomodoro: <Pomodoro />,
    analytics: <Analytics go={go} />,
    mock: <Mock />,
    docs: <Documents go={go} />,
    community: <Community />,
  }[view];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Demo Mode Top Notification Banner */}
      {!user && demoMode && (
        <div className="bg-gradient-to-r from-teal-tint via-lav to-lav-deep px-5 py-2.5 border-b border-line flex flex-wrap items-center justify-between gap-3 text-xs z-50 sticky top-0">
          <span className="font-semibold text-rosetext flex items-center gap-1.5">
            <Sparkles size={14} /> You are exploring the <b>Interactive Demo</b> with sample candidate data.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAuth("signup")}
              className="font-bold text-rosetext hover:underline"
            >
              Create Free Account
            </button>
            <button
              onClick={handleExitDemo}
              className="text-ink-soft hover:text-ink font-semibold"
            >
              Exit Demo
            </button>
          </div>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[272px_1fr]">
        {/* Mobile Top Bar */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between bg-white/90 backdrop-blur border-b border-line px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-lg text-rosetext">Real Nurse</span>
            <Pill tone={profile.target_exam === "NLE" ? "amber" : "teal"}>{profile.target_exam}</Pill>
            {isPomoRunning && (
              <button
                onClick={() => go("pomodoro")}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rosetext text-white tabular-nums flex items-center gap-1"
              >
                <Timer size={10} /> {pomoTime}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenAuth("signin")}
              className="text-xs font-semibold px-3 py-1.5 rounded-full bg-lav text-ink flex items-center gap-1.5"
            >
              <UserCircle size={14} />
              {isGuest ? "Sign In" : profile.full_name.split(" ")[0]}
            </button>
            <button onClick={() => setOpen(!open)} aria-label="Menu" className="p-1">
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </header>

        {/* Sidebar Navigation */}
        <aside
          className={`${
            open ? "block" : "hidden"
          } lg:flex flex-col justify-between fixed lg:sticky inset-x-0 top-[61px] lg:top-0 bottom-0 lg:h-screen z-20 bg-white border-r border-line p-6 overflow-y-auto`}
        >
          <div>
            {/* Logo & Target Exam */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-teal text-ink grid place-items-center shadow-xs">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <span className="font-display font-extrabold text-lg text-rosetext tracking-tight block leading-tight">
                    Real Nurse
                  </span>
                  <span className="text-[11px] font-bold text-ink-soft">
                    {profile.target_exam} · 2025
                  </span>
                </div>
              </div>
            </div>

            <nav className="space-y-1.5">
              {nav.map((n) => (
                <button
                  key={n.id}
                  onClick={() => go(n.id)}
                  className={`w-full flex items-center gap-3.5 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors ${
                    view === n.id ? "bg-teal text-ink" : "text-ink-soft hover:bg-lav"
                  }`}
                >
                  <n.i size={18} />
                  <span className="flex-1 text-left">{n.l}</span>
                  {n.id === "pomodoro" && isPomoRunning && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-rosetext text-white tabular-nums animate-pulse">
                      {pomoTime}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* User Profile Card at Sidebar Footer */}
          <div className="pt-6 border-t border-line mt-6">
            <div className="rounded-2xl bg-canvas p-3.5 flex items-center justify-between gap-3">
              <button
                onClick={() => (!user ? handleOpenAuth("signin") : undefined)}
                className="flex items-center gap-2.5 min-w-0 text-left hover:opacity-80 transition-opacity"
              >
                <div className="size-9 rounded-full bg-lav-deep text-indigo font-display font-bold text-xs grid place-items-center shrink-0">
                  {profile.full_name.charAt(0)}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold truncate text-ink">{profile.full_name}</p>
                  <p className="text-[10px] text-ink-soft truncate">
                    {!user ? "Demo Mode · Tap to Sign In" : profile.email}
                  </p>
                </div>
              </button>
              {user ? (
                <button
                  onClick={() => signOut()}
                  className="size-7 rounded-full text-ink-soft hover:bg-lav grid place-items-center transition-colors"
                  title="Sign out"
                >
                  <LogOut size={13} />
                </button>
              ) : (
                <button
                  onClick={handleExitDemo}
                  className="text-[10px] font-bold text-rosetext hover:underline"
                  title="Exit demo"
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="px-5 sm:px-8 lg:px-14 py-10 lg:py-14 max-w-[1280px] w-full mx-auto">
          {V}
        </main>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        initialMode={authModalMode}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PomodoroProvider>
        <AppContent />
      </PomodoroProvider>
    </AuthProvider>
  );
}
