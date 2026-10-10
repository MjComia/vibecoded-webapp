import { useState } from "react";
import { X, Sparkles, LogIn, UserPlus, Stethoscope, Calendar, Clock } from "lucide-react";
import { Card, Btn, Pill } from "../ui";
import { useAuth } from "../context/AuthContext";

export default function AuthModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { signIn, signUp, profile } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [targetExam, setTargetExam] = useState<"NCLEX-RN" | "NLE">(profile.target_exam || "NCLEX-RN");
  const [examDate, setExamDate] = useState("2025-11-18");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const res = await signIn(email, password);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      } else {
        if (!fullName.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }
        const res = await signUp(email, password, fullName, targetExam, examDate);
        if (res.error) {
          setError(res.error);
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
      <Card className="w-full max-w-lg p-6 sm:p-8 bg-white relative shadow-2xl border border-line">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 size-9 rounded-full bg-lav hover:bg-lav-deep grid place-items-center text-ink-soft transition-colors"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="size-11 rounded-2xl bg-teal text-ink grid place-items-center">
            <Stethoscope size={22} />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl leading-none">Real Nurse</h2>
            <p className="text-xs text-ink-soft mt-1">Clinical Board Prep & Spaced Repetition</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-full bg-lav p-1 mb-6">
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-semibold transition-all ${
              mode === "signup" ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <UserPlus size={14} /> Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-semibold transition-all ${
              mode === "signin" ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <LogIn size={14} /> Sign In
          </button>
        </div>

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-[#ffdad6] text-[#93000a] text-xs font-medium leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">Candidate Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maria Santos, RN"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5">Target Board Examination</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setTargetExam("NCLEX-RN")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      targetExam === "NCLEX-RN"
                        ? "border-teal bg-teal-tint ring-1 ring-teal text-rosetext font-bold"
                        : "border-line bg-white text-ink-soft hover:bg-lav"
                    }`}
                  >
                    <span className="block text-xs font-bold">NCLEX-RN</span>
                    <span className="block text-[10px] text-ink-soft mt-0.5">Next Generation / US Exam</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetExam("NLE")}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      targetExam === "NLE"
                        ? "border-teal bg-teal-tint ring-1 ring-teal text-rosetext font-bold"
                        : "border-line bg-white text-ink-soft hover:bg-lav"
                    }`}
                  >
                    <span className="block text-xs font-bold">Philippine NLE</span>
                    <span className="block text-[10px] text-ink-soft mt-0.5">5 Parts / PRC Licensure</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                  <Calendar size={13} className="text-rosetext" /> Target Exam Date
                </label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full rounded-2xl border border-line bg-canvas px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">Email Address</label>
            <input
              type="email"
              required
              placeholder="candidate@nursing.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1.5">Password</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>

          <Btn
            type="submit"
            disabled={loading}
            className="w-full py-3.5 text-sm mt-3"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="size-4 rounded-full border-2 border-ink border-t-transparent animate-spin" />
                Processing...
              </span>
            ) : mode === "signup" ? (
              <span className="inline-flex items-center gap-2">
                <Sparkles size={16} /> Begin Review Journey
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <LogIn size={16} /> Sign In & Sync Progress
              </span>
            )}
          </Btn>
        </form>
      </Card>
    </div>
  );
}
