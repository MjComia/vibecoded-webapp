import { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  LogIn,
  UserPlus,
  Stethoscope,
  Calendar,
  Eye,
  EyeOff,
  Check,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Card, Btn, Pill } from "../ui";
import { useAuth } from "../context/AuthContext";
import { getDefaultExamDate } from "../lib/planner";
import { validatePassword, validatePasswordMatch } from "../lib/auth-validation";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "signin" | "signup";
}

export default function AuthModal({ isOpen, onClose, initialMode = "signup" }: AuthModalProps) {
  const { signIn, signUp, profile } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [targetExam, setTargetExam] = useState<"NCLEX-RN" | "NLE">(profile.target_exam || "NCLEX-RN");
  const [examDate, setExamDate] = useState(profile.exam_date || getDefaultExamDate());
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError("");
      setNotice("");
      setPassword("");
      setConfirmPassword("");
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const passwordValidation = validatePassword(password);
  const matchValidation = validatePasswordMatch(password, confirmPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setNotice("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const res = await signIn(email, password);
        if (res.error) {
          if (res.error.toLowerCase().includes("email not confirmed")) {
            setError(
              "Email not confirmed. Please check your inbox or turn off 'Confirm email' in Supabase Auth -> Providers -> Email."
            );
          } else {
            setError(res.error);
          }
        } else {
          onClose();
        }
      } else {
        // Sign-up validations
        if (!fullName.trim()) {
          setError("Please enter your full name.");
          setLoading(false);
          return;
        }

        // Strong password enforcement
        if (!passwordValidation.isValid) {
          setError(
            `Password is too weak. Please meet all security requirements: ${passwordValidation.errors.join(", ")}.`
          );
          setLoading(false);
          return;
        }

        // Verify password match enforcement
        if (!matchValidation.matches) {
          setError(matchValidation.error || "Passwords do not match. Please verify your password.");
          setLoading(false);
          return;
        }

        const res = (await signUp(email, password, fullName, targetExam, examDate)) as any;
        if (res.error) {
          setError(res.error);
        } else if (res.notice) {
          setNotice(res.notice);
          setMode("signin");
          setPassword("");
          setConfirmPassword("");
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

  const getStrengthBarColor = (score: number) => {
    if (score <= 1) return "bg-red-500";
    if (score === 2) return "bg-amber-500";
    if (score === 3) return "bg-indigo-500";
    return "bg-teal";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
      <Card className="w-full max-w-lg p-6 sm:p-8 bg-white relative shadow-2xl border border-line max-h-[92vh] overflow-y-auto">
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
            onClick={() => {
              setMode("signup");
              setError("");
              setConfirmPassword("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-semibold transition-all ${
              mode === "signup" ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <UserPlus size={14} /> Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signin");
              setError("");
              setConfirmPassword("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-full text-xs font-semibold transition-all ${
              mode === "signin" ? "bg-white text-ink shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            <LogIn size={14} /> Sign In
          </button>
        </div>

        {notice && (
          <div className="mb-5 p-3.5 rounded-2xl bg-teal-tint text-rosetext text-xs font-semibold leading-relaxed border border-teal flex items-center gap-2">
            <ShieldCheck size={16} className="shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div className="mb-5 p-3.5 rounded-2xl bg-[#ffdad6] text-[#93000a] text-xs font-medium leading-relaxed flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
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

          {/* Password Input with Show/Hide toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-ink-soft">
                {mode === "signup" ? "Create Password" : "Password"}
              </label>
              {mode === "signup" && password.length > 0 && (
                <span
                  className={`text-[11px] font-bold ${
                    passwordValidation.score <= 1
                      ? "text-red-500"
                      : passwordValidation.score === 2
                      ? "text-amber-500"
                      : passwordValidation.score === 3
                      ? "text-indigo"
                      : "text-teal"
                  }`}
                >
                  Strength: {passwordValidation.strengthLabel}
                </span>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-line bg-canvas px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink p-1 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Live Password Strength Meter & Security Checklist for Sign-up */}
            {mode === "signup" && (
              <div className="mt-2.5 space-y-2">
                {/* 4-Segment Strength Indicator Bar */}
                <div className="grid grid-cols-4 gap-1.5 h-1.5">
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className={`h-full rounded-full transition-colors ${
                        passwordValidation.score >= seg
                          ? getStrengthBarColor(passwordValidation.score)
                          : "bg-line"
                      }`}
                    />
                  ))}
                </div>

                {/* Criteria Checklist */}
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      passwordValidation.criteria.minLength
                        ? "text-teal font-semibold"
                        : "text-ink-soft"
                    }`}
                  >
                    <span
                      className={`size-3.5 rounded-full grid place-items-center text-[9px] ${
                        passwordValidation.criteria.minLength
                          ? "bg-teal-tint text-rosetext"
                          : "bg-canvas border border-line text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span>8+ characters</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      passwordValidation.criteria.hasUppercase &&
                      passwordValidation.criteria.hasLowercase
                        ? "text-teal font-semibold"
                        : "text-ink-soft"
                    }`}
                  >
                    <span
                      className={`size-3.5 rounded-full grid place-items-center text-[9px] ${
                        passwordValidation.criteria.hasUppercase &&
                        passwordValidation.criteria.hasLowercase
                          ? "bg-teal-tint text-rosetext"
                          : "bg-canvas border border-line text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span>Uppercase & lowercase</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      passwordValidation.criteria.hasNumber
                        ? "text-teal font-semibold"
                        : "text-ink-soft"
                    }`}
                  >
                    <span
                      className={`size-3.5 rounded-full grid place-items-center text-[9px] ${
                        passwordValidation.criteria.hasNumber
                          ? "bg-teal-tint text-rosetext"
                          : "bg-canvas border border-line text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span>At least 1 number</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 transition-colors ${
                      passwordValidation.criteria.hasSpecial
                        ? "text-teal font-semibold"
                        : "text-ink-soft"
                    }`}
                  >
                    <span
                      className={`size-3.5 rounded-full grid place-items-center text-[9px] ${
                        passwordValidation.criteria.hasSpecial
                          ? "bg-teal-tint text-rosetext"
                          : "bg-canvas border border-line text-transparent"
                      }`}
                    >
                      ✓
                    </span>
                    <span>Special character (!@#$)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Type Again To Verify Password (Confirm Password Field) */}
          {mode === "signup" && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-ink-soft">
                  Type Again to Verify Password
                </label>
                {confirmPassword.length > 0 && (
                  <span
                    className={`text-[11px] font-bold flex items-center gap-1 ${
                      matchValidation.matches ? "text-teal" : "text-danger"
                    }`}
                  >
                    {matchValidation.matches ? (
                      <>
                        <Check size={12} /> Passwords match
                      </>
                    ) : (
                      <>
                        <X size={12} /> Passwords do not match
                      </>
                    )}
                  </span>
                )}
              </div>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full rounded-2xl border px-4 py-3 pr-11 text-sm focus:outline-none transition-colors ${
                    confirmPassword.length > 0
                      ? matchValidation.matches
                        ? "border-teal/60 bg-teal-tint/10 focus:ring-2 focus:ring-teal"
                        : "border-danger/60 bg-[#ffdad6]/20 focus:ring-2 focus:ring-danger"
                      : "border-line bg-canvas focus:ring-2 focus:ring-teal"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink p-1 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

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
