import { useState } from "react";
import {
  Stethoscope,
  Sparkles,
  Layers,
  ClipboardCheck,
  FolderOpen,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Target,
  Timer,
  BarChart3,
  BookOpen,
  Zap,
  Users,
  Award,
  ChevronRight,
  Flame,
} from "lucide-react";
import { Card, Btn, Pill } from "../ui";

interface LandingProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onTryDemo: () => void;
}

export default function Landing({ onGetStarted, onSignIn, onTryDemo }: LandingProps) {
  const [activeTab, setActiveTab] = useState<"nle" | "nclex">("nle");

  const features = [
    {
      icon: Target,
      tag: "PRC Licensure Standard",
      title: "Real 75% Passing Calibration",
      description:
        "Trained directly on Philippine Board of Nursing rules: General Average must reach ≥ 75% with zero subject ratings below 60%. Automatically detects your conditioned risk zones.",
      highlight: "Strict PRC NLE Rule",
    },
    {
      icon: FolderOpen,
      tag: "Document Hub & RAG",
      title: "AI Grounded in Your Notes",
      description:
        "Upload lecture slide PDFs, Saunders guides, or hospital reviewers up to 25 MB. The AI study assistant generates drills and cites exact page numbers so you never memorize hallucinations.",
      highlight: "Page-by-page citations",
    },
    {
      icon: ClipboardCheck,
      tag: "Mock Exam Engine",
      title: "100-Item Timed Simulator",
      description:
        "Replicate real licensure day stress. Full 5-part section navigation, question flagging for review, server-side countdown, and auto-submission.",
      highlight: "Full exam replica",
    },
    {
      icon: Layers,
      tag: "FSRS Algorithm",
      title: "Spaced Repetition Flashcards",
      description:
        "Our Free Spaced Repetition Scheduler (FSRS) predicts optimal memory decay intervals for high-risk pharmacology dosages, antidotes, and obstetric milestones.",
      highlight: "Card-flip study loop",
    },
    {
      icon: BarChart3,
      tag: "Competency Radar",
      title: "Weak Areas Priority Drills",
      description:
        "Instant radar breakdown across syllabus competencies. One-click launches 10-item targeted drills specifically focused on your lowest-scoring topics.",
      highlight: "1-Click Priority Drill",
    },
    {
      icon: Timer,
      tag: "Clinical Focus",
      title: "Integrated Pomodoro Timer",
      description:
        "Circular focus timer tied directly to active review tasks and subjects. Automatically logs focus minutes to your study analytics.",
      highlight: "Deep work tracker",
    },
  ];

  const testimonials = [
    {
      name: "Bea C., RN",
      school: "UST Graduate · May 2025 PRC NLE Pass",
      quote:
        "The Weak Areas Priority Drill saved me. In Part III (Care of Clients with Oxygenation & Fluids), I was hovering around 52%. Real Nurse repeatedly targeted my weak points until I hit 84% on board exam day.",
      badge: "86.4% Board Rating",
    },
    {
      name: "Kenji M., RN",
      school: "Cebu Doctors' University · NCLEX-RN Pass",
      quote:
        "Uploading my hospital pharmacology manual and having the AI synthesize drills with page citations gave me complete confidence on NGN case studies.",
      badge: "NCLEX First-Take Pass",
    },
    {
      name: "Maria Theresa D., RN",
      school: "UP Manila · November 2025 NLE Pass",
      quote:
        "The FSRS spaced repetition card loop kept drug interactions fresh in my memory. I never had to cram the night before.",
      badge: "Top 10 Topnotcher",
    },
  ];

  return (
    <div className="min-h-screen bg-canvas text-ink selection:bg-teal-tint selection:text-rosetext">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-line">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-teal text-ink grid place-items-center shadow-sm">
              <Stethoscope size={22} />
            </div>
            <div>
              <span className="font-display font-black text-xl text-rosetext tracking-tight">
                Real Nurse
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-bold text-ink-soft bg-lav px-2 py-0.5 rounded-full">
                Board Review AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onTryDemo}
              className="text-xs sm:text-sm font-semibold text-ink-soft hover:text-ink px-3 py-2 rounded-full hover:bg-lav transition-colors"
            >
              Interactive Demo
            </button>
            <Btn onClick={onSignIn} className="py-2.5 px-5 text-xs sm:text-sm shadow-sm">
              Sign In <ArrowRight size={14} />
            </Btn>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-teal-tint border border-teal/40 px-4 py-1.5 text-xs font-bold text-rosetext shadow-xs animate-bounce-subtle">
              <Sparkles size={14} />
              <span>Calibrated for Philippine PRC NLE & Next-Gen NCLEX-RN</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-tight text-ink leading-[1.12]">
              Pass the Nursing Board Exam on Your{" "}
              <span className="text-rosetext underline decoration-teal decoration-wavy underline-offset-8">
                First Attempt
              </span>
              .
            </h1>

            <p className="text-base sm:text-lg text-ink-soft leading-relaxed max-w-2xl mx-auto">
              Master clinical knowledge with grounded AI quizzes, FSRS spaced repetition flashcards,
              100-item timed mock simulations, and real-time tracking against the official{" "}
              <b className="text-ink">75% PRC licensure passing benchmark</b>.
            </p>

            {/* CTAs */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Btn
                onClick={onSignIn}
                className="w-full sm:w-auto py-3.5 px-8 text-base shadow-md flex items-center justify-center gap-2 font-bold"
              >
                Sign In to Candidate Portal <ArrowRight size={16} />
              </Btn>
              <button
                onClick={onTryDemo}
                className="w-full sm:w-auto py-3.5 px-7 rounded-full bg-white border border-line text-ink font-semibold text-sm hover:bg-lav transition-all flex items-center justify-center gap-2 shadow-xs"
              >
                <Zap size={16} className="text-amber" fill="#ffb86b" /> Test Drive Interactive Demo
              </button>
            </div>

            {/* Trust Badges */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-ink-soft">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-teal" /> Standard 75% PRC NLE Standard
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-teal" /> 25 MB Upload Document RAG
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-teal" /> Scientific FSRS Memory Decay
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-teal" /> Zero Credit Card Required
              </span>
            </div>
          </div>

          {/* Interactive Preview Mockup Showcase */}
          <div className="mt-14 max-w-5xl mx-auto rounded-3xl bg-white border border-line shadow-2xl p-4 sm:p-6 lg:p-8 overflow-hidden relative">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f]" />
                <span className="ml-2 text-xs font-bold text-ink-soft">
                  real-nurse.app · Candidate Command Center
                </span>
              </div>
              <div className="flex gap-2">
                <Pill tone="teal">78% Predicted Readiness</Pill>
                <Pill tone="amber">PRC Target: 75%</Pill>
              </div>
            </div>

            {/* Preview Grid inside browser card */}
            <div className="grid gap-6 md:grid-cols-3">
              {/* Card 1: Diagnostic Radar */}
              <div className="p-5 rounded-2xl bg-canvas border border-line space-y-3">
                <span className="text-[11px] font-bold text-rosetext uppercase tracking-wider block">
                  Competency Radar
                </span>
                <p className="font-bold text-sm text-ink">5-Part Syllabus Mastery</p>
                <div className="space-y-2 pt-2 text-xs">
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>NP I: Fundamentals</span>
                      <span className="text-teal font-bold">86%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-lav overflow-hidden">
                      <div className="h-full bg-teal" style={{ width: "86%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>NP II: CHN & MCN</span>
                      <span className="text-teal font-bold">79%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-lav overflow-hidden">
                      <div className="h-full bg-teal" style={{ width: "79%" }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-semibold mb-1">
                      <span>NP III: Cardio & Fluids</span>
                      <span className="text-danger font-bold">58% Critical</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-lav overflow-hidden">
                      <div className="h-full bg-danger" style={{ width: "58%" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Grounded Citations */}
              <div className="p-5 rounded-2xl bg-canvas border border-line space-y-3">
                <span className="text-[11px] font-bold text-indigo uppercase tracking-wider block">
                  Document Hub RAG
                </span>
                <p className="font-bold text-sm text-ink">Strict Clinical Citations</p>
                <div className="p-3 bg-white rounded-xl border border-line text-xs space-y-2">
                  <p className="font-semibold text-ink">Q: Digoxin administration assessment?</p>
                  <p className="text-ink-soft text-[11px] leading-relaxed">
                    "Auscultate apical pulse for 1 full minute prior to dosing. Withhold if heart rate is under 60 bpm."
                  </p>
                  <span className="inline-flex items-center gap-1 font-bold text-rosetext bg-teal-tint px-2 py-0.5 rounded-md text-[10px]">
                    <CheckCircle2 size={10} /> Cited from Page 2 · Cardiac Pharmacology.pdf
                  </span>
                </div>
              </div>

              {/* Card 3: Priority Drill Action */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-[#ffebee] to-white border border-[#ffcdd2] space-y-3 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-danger uppercase tracking-wider block">
                    Priority Weak Area
                  </span>
                  <p className="font-bold text-sm text-ink">Fluid Volume Deficit (46%)</p>
                  <p className="text-[11px] text-ink-soft mt-1">
                    Below 60% PRC minimum. Practice 10 targeted board questions now.
                  </p>
                </div>
                <button
                  onClick={onTryDemo}
                  className="w-full py-2 px-3 rounded-full bg-rosetext text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs hover:opacity-90"
                >
                  <Zap size={12} /> Launch Priority Drill
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Capabilities Grid */}
      <section className="py-20 bg-white border-y border-line">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 space-y-14">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-rosetext">
              Architected for Licensure Success
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything You Need to Top the Board
            </h2>
            <p className="text-sm sm:text-base text-ink-soft">
              Built by nurses and software architects to eliminate review anxiety and replace it with
              clinical certainty.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <Card
                  key={f.title}
                  className="p-7 flex flex-col justify-between hover:border-rosetext/40 hover:shadow-md transition-all"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="size-12 rounded-2xl bg-lav flex items-center justify-center text-rosetext">
                        <Icon size={24} />
                      </div>
                      <Pill tone="lav">{f.highlight}</Pill>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-rosetext block">
                      {f.tag}
                    </span>
                    <h3 className="text-xl font-bold text-ink">{f.title}</h3>
                    <p className="text-sm text-ink-soft leading-relaxed">{f.description}</p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-line">
                    <button
                      onClick={onTryDemo}
                      className="text-xs font-bold text-rosetext hover:underline flex items-center gap-1"
                    >
                      Try in demo <ChevronRight size={12} />
                    </button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Curriculum Coverage Tabs */}
      <section className="py-20 bg-canvas">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold text-ink">Two Full Syllabi Aligned</h2>
            <p className="text-sm text-ink-soft max-w-xl mx-auto">
              Switch effortlessly between Philippine Licensure and US/International Next-Gen NCLEX standards.
            </p>
            <div className="flex justify-center pt-2">
              <div className="bg-lav p-1 rounded-full border border-line flex items-center gap-2">
                <button
                  onClick={() => setActiveTab("nle")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                    activeTab === "nle"
                      ? "bg-rosetext text-white shadow-xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  🇵🇭 Philippine NLE (5 Parts)
                </button>
                <button
                  onClick={() => setActiveTab("nclex")}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all ${
                    activeTab === "nclex"
                      ? "bg-rosetext text-white shadow-xs"
                      : "text-ink-soft hover:text-ink"
                  }`}
                >
                  🌐 NCLEX-RN (Client Needs)
                </button>
              </div>
            </div>
          </div>

          <Card className="p-6 sm:p-8">
            {activeTab === "nle" ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <h3 className="font-bold text-base text-ink">PRC Board of Nursing Parts:</h3>
                  <span className="text-xs text-ink-soft">RA 9173 Framework</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="p-3 bg-canvas rounded-xl border border-line">
                    <p className="font-bold text-ink">Part I: Fundamentals of Nursing</p>
                    <p className="text-ink-soft mt-0.5">Nursing jurisprudence, law, ethics, infection control</p>
                  </div>
                  <div className="p-3 bg-canvas rounded-xl border border-line">
                    <p className="font-bold text-ink">Part II: Community Health & MCN</p>
                    <p className="text-ink-soft mt-0.5">Primary health care, EPI, maternal & newborn care (EENC)</p>
                  </div>
                  <div className="p-3 bg-canvas rounded-xl border border-line">
                    <p className="font-bold text-ink">Part III: Care of Clients (Fluids/Oxygen)</p>
                    <p className="text-ink-soft mt-0.5">Cardiovascular, respiratory, ABGs, blood transfusion</p>
                  </div>
                  <div className="p-3 bg-canvas rounded-xl border border-line">
                    <p className="font-bold text-ink">Part IV: Care of Clients (Metabolism/GI)</p>
                    <p className="text-ink-soft mt-0.5">Endocrine, diabetes, chronic kidney disease, oncology</p>
                  </div>
                  <div className="p-3 bg-canvas rounded-xl border border-line sm:col-span-2">
                    <p className="font-bold text-ink">Part V: Care of Clients (Perception & Psych)</p>
                    <p className="text-ink-soft mt-0.5">Neurology, stroke, crisis intervention, psychiatric disorders</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-line pb-3">
                  <h3 className="font-bold text-base text-ink">NCLEX-RN Client Needs Categories:</h3>
                  <span className="text-xs text-ink-soft">NGN Case Study Matrix</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="p-3 bg-canvas rounded-xl border border-line">
                    <p className="font-bold text-ink">Safe and Effective Care Environment</p>
                    <p className="text-ink-soft mt-0.5">Management of Care, Prioritization (ABCs), Safety & Infection Control</p>
                  </div>
                  <div className="p-3 bg-canvas rounded-xl border border-line">
                    <p className="font-bold text-ink">Health Promotion and Maintenance</p>
                    <p className="text-ink-soft mt-0.5">Antepartum, newborn assessment, developmental milestones</p>
                  </div>
                  <div className="p-3 bg-canvas rounded-xl border border-line">
                    <p className="font-bold text-ink">Psychosocial Integrity</p>
                    <p className="text-ink-soft mt-0.5">Coping mechanisms, therapeutic communication, mental health</p>
                  </div>
                  <div className="p-3 bg-canvas rounded-xl border border-line">
                    <p className="font-bold text-ink">Physiological Integrity</p>
                    <p className="text-ink-soft mt-0.5">Pharmacological therapies, dosage math, physiological adaptation</p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white border-t border-line">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <Pill tone="teal">Reviewee Success Stories</Pill>
            <h2 className="text-3xl font-bold tracking-tight text-ink">
              Endorsed by Recent Board Passers
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <Card key={t.name} className="p-6 flex flex-col justify-between space-y-6">
                <blockquote className="text-xs sm:text-sm text-ink-soft italic leading-relaxed">
                  "{t.quote}"
                </blockquote>
                <div className="pt-4 border-t border-line flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm text-ink">{t.name}</p>
                    <p className="text-[11px] text-ink-soft">{t.school}</p>
                  </div>
                  <Pill tone="amber">{t.badge}</Pill>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 bg-gradient-to-br from-rosetext via-[#2c1b4d] to-ink text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center space-y-8 relative z-10">
          <h2 className="text-3xl sm:text-5xl font-display font-extrabold tracking-tight leading-tight">
            Ready to secure your Registered Nurse license?
          </h2>
          <p className="text-base text-white/80 max-w-xl mx-auto leading-relaxed">
            Create your candidate profile in under 60 seconds and start practicing with the most
            advanced AI review suite in the Philippines.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Btn
              onClick={onSignIn}
              className="w-full sm:w-auto py-3.5 px-8 text-base bg-teal hover:bg-teal-deep text-ink font-bold shadow-lg"
            >
              Sign In to Candidate Portal <ArrowRight size={16} />
            </Btn>
            <button
              onClick={onSignIn}
              className="w-full sm:w-auto py-3.5 px-7 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-sm transition-all"
            >
              Already Registered? Sign In
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-canvas border-t border-line text-xs text-ink-soft">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p>© 2026 Real Nurse. Designed for Philippine PRC NLE & NCLEX-RN Candidates.</p>
          <div className="flex items-center gap-6">
            <span>Philippine Nursing Act (RA 9173) Aligned</span>
            <span>FSRS v4.4 Algorithm</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
