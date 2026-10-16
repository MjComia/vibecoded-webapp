import { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Settings2,
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  RotateCcw,
} from "lucide-react";
import { Card, PageHead, Pill, Btn } from "../ui";
import {
  generateStudyPlan,
  KIND_TONES,
  defaultSubjects,
  getDefaultExamDate,
  type PlannerConfig,
  type StudyDayKind,
  type DaySchedule,
} from "../lib/planner";
import { useAuth } from "../context/AuthContext";

export default function Plan({ go }: { go?: (v: string) => void }) {
  const { profile } = useAuth();

  // Planner Configuration
  const [config, setConfig] = useState<PlannerConfig>(() => {
    const saved = localStorage.getItem("real_nurse_planner_config");
    if (saved) return JSON.parse(saved);

    return {
      examDate: profile.exam_date || getDefaultExamDate(),
      hoursPerDay: Math.max(1, Math.round((profile.daily_goal_minutes || 60) / 60)),
      restDayMode: "sunday",
      customRestDays: [0], // Sunday
      weakSubjects: ["Pharmacology", "Med-Surg"],
      mockSprintWeeks: 2,
      examType: profile.target_exam || "NCLEX-RN",
    };
  });

  // Manual Overrides (e.g. specific rescheduled days)
  const [overrides, setOverrides] = useState<Record<string, StudyDayKind>>(() => {
    const saved = localStorage.getItem("real_nurse_planner_overrides");
    return saved ? JSON.parse(saved) : {};
  });

  // Plan Activation toggle (defaults to false for new users so calendar starts clean)
  const [isPlanActive, setIsPlanActive] = useState<boolean>(() => {
    return localStorage.getItem("real_nurse_plan_active") === "true";
  });

  // Calendar view navigation
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  // Selected date
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  // Modal toggle for custom plan options
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Generate backward schedule only when activated by user
  const studyPlan = useMemo(() => {
    if (!isPlanActive) {
      // Clean slate: only explicit user manual overrides if any
      const manualOnly: Record<string, DaySchedule> = {};
      for (const [dateStr, kind] of Object.entries(overrides)) {
        manualOnly[dateStr] = {
          dateStr,
          dayNumber: parseInt(dateStr.split("-")[2], 10) || 1,
          kind,
          subject: kind === "Rest" ? "Rest & Recovery" : "Self-Scheduled Review",
          topic: kind === "Rest" ? "Memory consolidation" : "Custom Focus Area",
          targetMinutes: kind === "Rest" ? 0 : config.hoursPerDay * 60,
          activities: [
            kind === "Rest"
              ? "Recharge and consolidate memory"
              : `Focus session: ${kind}`,
          ],
          isExamDay: dateStr === config.examDate,
          isRescheduled: true,
        };
      }
      return manualOnly;
    }
    return generateStudyPlan(config, new Date(), overrides);
  }, [config, overrides, isPlanActive]);

  const saveConfig = (newConfig: PlannerConfig) => {
    setConfig(newConfig);
    localStorage.setItem("real_nurse_planner_config", JSON.stringify(newConfig));
  };

  const saveOverrides = (newOverrides: Record<string, StudyDayKind>) => {
    setOverrides(newOverrides);
    localStorage.setItem("real_nurse_planner_overrides", JSON.stringify(newOverrides));
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  // Month grid calculations
  const year = currentMonth.getFullYear();
  const monthIdx = currentMonth.getMonth();
  const firstDayOfWeek = new Date(year, monthIdx, 1).getDay();
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const cells = [...Array(firstDayOfWeek).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  // Active selected day schedule (undefined if no activity scheduled yet)
  const selectedDaySchedule: DaySchedule | undefined = studyPlan[selectedDateStr];

  const examDateObj = new Date(config.examDate + "T00:00:00");
  const selectedDateObj = new Date(selectedDateStr + "T00:00:00");
  const daysLeft = Math.ceil((examDateObj.getTime() - selectedDateObj.getTime()) / (1000 * 60 * 60 * 24));

  // Handle rescheduling active day
  const handleRescheduleKind = (newKind: StudyDayKind) => {
    const updated = { ...overrides, [selectedDateStr]: newKind };
    saveOverrides(updated);
  };

  const handleResetSchedule = () => {
    saveOverrides({});
  };

  // Action launcher mapping
  const launchActivity = (kind: StudyDayKind) => {
    if (!go) return;
    if (kind === "Flashcards") go("flashcards");
    else if (kind === "Quiz" || kind === "Practice test") go("quiz");
    else if (kind === "Mock exam") go("mock");
    else if (kind === "Reading") go("docs");
  };

  return (
    <div className="rise space-y-8">
      <PageHead
        eyebrow="Customizable Backward-Planning"
        title="Study Plan & Calendar"
        sub="Your personal review roadmap engineered backward from exam day. Custom tailored to your daily available hours and weak subjects."
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {!isPlanActive ? (
              <Btn
                onClick={() => {
                  setIsPlanActive(true);
                  localStorage.setItem("real_nurse_plan_active", "true");
                }}
                className="flex items-center gap-2 text-xs font-bold shadow-sm"
              >
                <Sparkles size={15} /> Generate Study Roadmap
              </Btn>
            ) : (
              <button
                onClick={() => {
                  if (confirm("Are you sure you want to clear your study calendar back to an unmarked slate?")) {
                    setIsPlanActive(false);
                    localStorage.removeItem("real_nurse_plan_active");
                    saveOverrides({});
                  }
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-ink-soft hover:text-danger hover:bg-lav transition-colors flex items-center gap-1.5 border border-line"
              >
                <RotateCcw size={14} /> Clear Calendar
              </button>
            )}
            <Btn onClick={() => setShowConfigModal(true)} variant="soft" className="flex items-center gap-2 text-xs">
              <Settings2 size={16} /> Customize Schedule
            </Btn>
          </div>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[1.6fr_1fr]">
        {/* Left Calendar Grid Card */}
        <Card className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold font-display">
                {currentMonth.toLocaleString("en-US", { month: "long", year: "numeric" })}
              </h2>
              <p className="text-xs text-ink-soft mt-0.5">
                Target: {config.examType} on {new Date(config.examDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                aria-label="Previous month"
                onClick={() => setCurrentMonth(new Date(year, monthIdx - 1, 1))}
                className="size-9 grid place-items-center rounded-full bg-lav hover:bg-lav-deep text-ink-soft transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                aria-label="Next month"
                onClick={() => setCurrentMonth(new Date(year, monthIdx + 1, 1))}
                className="size-9 grid place-items-center rounded-full bg-lav hover:bg-lav-deep text-ink-soft transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Weekday Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-ink-soft mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          {/* Calendar Cells */}
          <div className="grid grid-cols-7 gap-2">
            {cells.map((d, i) => {
              if (d === null) return <span key={i} className="aspect-square" />;

              const mmStr = String(monthIdx + 1).padStart(2, "0");
              const ddStr = String(d).padStart(2, "0");
              const cellDateStr = `${year}-${mmStr}-${ddStr}`;
              const daySchedule = studyPlan[cellDateStr];

              const isSelected = selectedDateStr === cellDateStr;
              const isExam = cellDateStr === config.examDate;
              const isToday = cellDateStr === todayStr;
              const hasSchedule = Boolean(daySchedule);
              const kind = daySchedule?.kind;
              const isRescheduled = daySchedule?.isRescheduled;

              let cellStyle = "bg-canvas text-ink-soft hover:bg-lav hover:text-ink border border-transparent";
              if (isExam) {
                cellStyle = "bg-danger text-white ring-2 ring-danger font-bold";
              } else if (isSelected) {
                cellStyle = "bg-teal text-ink ring-2 ring-rosetext/80 shadow-md scale-105 z-10 font-bold";
              } else if (hasSchedule && kind) {
                cellStyle = `${KIND_TONES[kind]} hover:ring-2 hover:ring-teal/50 font-semibold`;
              } else if (isToday) {
                cellStyle = "bg-white border-2 border-rosetext/70 text-rosetext font-bold";
              }

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDateStr(cellDateStr)}
                  className={`aspect-square rounded-2xl text-xs sm:text-sm flex flex-col items-center justify-center relative transition-all ${cellStyle}`}
                >
                  <span className="font-bold">{d}</span>
                  {isExam ? (
                    <span className="text-[8px] uppercase tracking-wider font-extrabold mt-0.5">EXAM</span>
                  ) : hasSchedule && kind ? (
                    <span className="text-[9px] opacity-80 truncate max-w-[90%] font-medium">
                      {kind === "Practice test" ? "Test" : kind === "Mock exam" ? "Mock" : kind}
                    </span>
                  ) : isToday ? (
                    <span className="text-[8px] uppercase tracking-wider font-extrabold text-rosetext mt-0.5">TODAY</span>
                  ) : null}
                  {isRescheduled && (
                    <span className="absolute top-1 right-1.5 size-1.5 rounded-full bg-indigo" title="Custom scheduled" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-8 pt-6 border-t border-line flex flex-wrap gap-2.5 items-center justify-between">
            <div className="flex flex-wrap gap-2.5">
              {(Object.keys(KIND_TONES) as StudyDayKind[]).map((k) => (
                <span key={k} className={`rounded-full px-3 py-1 text-xs font-semibold ${KIND_TONES[k]}`}>
                  {k}
                </span>
              ))}
            </div>
            {!isPlanActive && (
              <span className="text-xs text-ink-soft italic">
                Calendar is clean. Click &quot;Generate Study Roadmap&quot; anytime to populate days.
              </span>
            )}
          </div>
        </Card>

        {/* Right Detail & Reschedule Inspector */}
        <Card className="p-6 md:p-8 flex flex-col justify-between h-fit min-h-[460px]">
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-rosetext">
                {selectedDateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
              {selectedDaySchedule ? (
                <Pill tone={selectedDaySchedule.kind === "Rest" ? "lav" : "teal"}>
                  {selectedDaySchedule.kind}
                </Pill>
              ) : (
                <Pill tone="lav">Clean Day</Pill>
              )}
            </div>

            <h2 className="mt-3 text-2xl font-bold font-display leading-snug">
              {selectedDateStr === config.examDate
                ? "Official Board Exam Day"
                : selectedDaySchedule
                ? selectedDaySchedule.subject
                : "No Study Session Scheduled"}
            </h2>

            {selectedDaySchedule && !selectedDaySchedule.isExamDay && selectedDaySchedule.kind !== "Rest" && (
              <p className="text-xs font-semibold text-rosetext mt-1">
                Topic Focus: {selectedDaySchedule.topic}
              </p>
            )}

            {!selectedDaySchedule && selectedDateStr !== config.examDate && (
              <p className="text-xs text-ink-soft mt-1">
                This day has no assigned curriculum yet. You can schedule an activity below or generate an automated study roadmap.
              </p>
            )}

            <div className="mt-3 flex items-center gap-3 text-xs text-ink-soft">
              <span className="flex items-center gap-1 font-semibold">
                <Clock size={13} className="text-rosetext" />
                {selectedDaySchedule ? `${selectedDaySchedule.targetMinutes} minutes planned` : "0 minutes planned"}
              </span>
              <span>·</span>
              <span className="font-semibold text-rosetext">
                {daysLeft > 0 ? `${daysLeft} days until exam` : daysLeft === 0 ? "Exam Day" : "Past Exam"}
              </span>
            </div>

            {/* Curriculum Activities or Clean Prompt */}
            {selectedDaySchedule ? (
              <div className="mt-6 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-ink-soft">Scheduled Curriculum</p>
                {selectedDaySchedule.activities.map((act, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-canvas border border-line flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-rosetext shrink-0 mt-0.5" />
                    <span className="text-xs font-medium leading-relaxed text-ink">{act}</span>
                  </div>
                ))}
              </div>
            ) : selectedDateStr !== config.examDate ? (
              <div className="mt-6 p-4 rounded-2xl bg-canvas border border-line space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-ink">
                  <Sparkles size={15} className="text-rosetext" />
                  <span>Unscheduled Slate</span>
                </div>
                <p className="text-xs text-ink-soft">
                  Click any activity button below to schedule this individual day, or generate a full backward roadmap up to your exam.
                </p>
              </div>
            ) : null}

            {/* Quick Reschedule / Schedule Options */}
            {selectedDateStr !== config.examDate && (
              <div className="mt-6 pt-5 border-t border-line">
                <label className="block text-xs font-semibold text-ink-soft mb-2">
                  {selectedDaySchedule ? "Reschedule This Day:" : "Schedule Activity for This Day:"}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(["Flashcards", "Reading", "Quiz", "Practice test", "Rest"] as StudyDayKind[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => handleRescheduleKind(k)}
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-all ${
                        selectedDaySchedule?.kind === k
                          ? "bg-teal text-ink border-teal font-bold"
                          : "bg-white text-ink-soft border-line hover:bg-lav"
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Launch Button */}
          <div className="mt-8 pt-5 border-t border-line flex flex-col gap-2.5">
            {selectedDaySchedule && !selectedDaySchedule.isExamDay && selectedDaySchedule.kind !== "Rest" ? (
              <Btn
                onClick={() => launchActivity(selectedDaySchedule.kind)}
                className="w-full py-3 text-xs font-bold"
              >
                Launch {selectedDaySchedule.kind} Session <ArrowRight size={14} />
              </Btn>
            ) : selectedDaySchedule?.kind === "Rest" ? (
              <span className="text-xs font-medium text-ink-soft italic w-full text-center">
                Rest days are critical for memory consolidation.
              </span>
            ) : !isPlanActive && selectedDateStr !== config.examDate ? (
              <Btn
                onClick={() => {
                  setIsPlanActive(true);
                  localStorage.setItem("real_nurse_plan_active", "true");
                }}
                className="w-full py-3 text-xs font-bold flex items-center justify-center gap-2"
              >
                <Sparkles size={14} /> Generate Smart Study Roadmap
              </Btn>
            ) : null}
          </div>
        </Card>
      </div>

      {/* Customize Study Schedule Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fadeIn">
          <Card className="w-full max-w-lg p-6 sm:p-8 bg-white relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowConfigModal(false)}
              className="absolute top-5 right-5 size-8 rounded-full bg-lav hover:bg-lav-deep grid place-items-center text-ink-soft"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={18} className="text-rosetext" />
              <h3 className="font-display font-bold text-xl">Customize Study Plan</h3>
            </div>
            <p className="text-xs text-ink-soft mb-6">
              Tailor the backward-planning engine to your daily routine, work schedule, and weak clinical areas.
            </p>

            <div className="space-y-5">
              {/* Exam Date */}
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1.5 flex items-center gap-1.5">
                  <CalendarIcon size={13} className="text-rosetext" /> Target Board Exam Date
                </label>
                <input
                  type="date"
                  value={config.examDate}
                  onChange={(e) => setConfig({ ...config, examDate: e.target.value })}
                  className="w-full rounded-2xl border border-line bg-canvas p-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal font-medium"
                />
              </div>

              {/* Hours per day */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-ink-soft">Daily Study Time Target</label>
                  <span className="text-xs font-bold text-rosetext">{config.hoursPerDay} hours / day</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={config.hoursPerDay}
                  onChange={(e) => setConfig({ ...config, hoursPerDay: parseInt(e.target.value, 10) })}
                  className="w-full accent-teal cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-ink-soft mt-1">
                  <span>1 hr (Light review)</span>
                  <span>4 hrs (Full prep)</span>
                  <span>8 hrs (Intensive bootcamp)</span>
                </div>
              </div>

              {/* Rest Day Options */}
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-2">Rest Day Schedule</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: "sunday", label: "Sundays Off (1 day/wk)" },
                    { id: "saturday", label: "Saturdays Off (1 day/wk)" },
                    { id: "none", label: "7 Days Continuous (No Rest)" },
                    { id: "custom", label: "Custom Schedule" },
                  ].map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setConfig({ ...config, restDayMode: opt.id as any })}
                      className={`p-3 rounded-2xl border text-left font-semibold transition-all ${
                        config.restDayMode === opt.id
                          ? "bg-teal-tint border-teal text-rosetext ring-1 ring-teal"
                          : "bg-canvas border-line text-ink-soft hover:bg-lav"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Rest Days Picker (When custom selected) */}
              {config.restDayMode === "custom" && (
                <div className="p-3 rounded-2xl bg-canvas border border-line">
                  <p className="text-[11px] font-semibold text-ink-soft mb-2">Select Days You Want Off:</p>
                  <div className="flex justify-between gap-1">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName, idx) => {
                      const isOff = config.customRestDays.includes(idx);
                      return (
                        <button
                          key={dayName}
                          type="button"
                          onClick={() => {
                            const newDays = isOff
                              ? config.customRestDays.filter((d) => d !== idx)
                              : [...config.customRestDays, idx];
                            setConfig({ ...config, customRestDays: newDays });
                          }}
                          className={`size-9 rounded-full text-xs font-bold transition-all ${
                            isOff ? "bg-rosetext text-white shadow-sm" : "bg-white border border-line text-ink-soft"
                          }`}
                        >
                          {dayName.charAt(0)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Weak Subjects Front-Loading */}
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-2">
                  Weak Clinical Areas to Prioritize (Front-Loaded in Early Weeks):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {defaultSubjects.map((subj) => {
                    const isSelected = config.weakSubjects.includes(subj);
                    return (
                      <button
                        type="button"
                        key={subj}
                        onClick={() => {
                          const updated = isSelected
                            ? config.weakSubjects.filter((s) => s !== subj)
                            : [...config.weakSubjects, subj];
                          setConfig({ ...config, weakSubjects: updated });
                        }}
                        className={`p-2.5 rounded-2xl border text-left text-xs font-semibold transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-teal-tint border-teal text-rosetext font-bold"
                            : "bg-canvas border-line text-ink-soft hover:bg-lav"
                        }`}
                      >
                        <span>{subj}</span>
                        {isSelected && <Pill tone="teal">Priority</Pill>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reset Overrides Action */}
              {Object.keys(overrides).length > 0 && (
                <button
                  type="button"
                  onClick={handleResetSchedule}
                  className="text-xs text-danger font-semibold flex items-center gap-1.5 hover:underline"
                >
                  <RotateCcw size={13} /> Reset {Object.keys(overrides).length} custom rescheduled days
                </button>
              )}

              <Btn
                onClick={() => {
                  setIsPlanActive(true);
                  localStorage.setItem("real_nurse_plan_active", "true");
                  saveConfig(config);
                  setShowConfigModal(false);
                }}
                className="w-full py-3.5 text-xs font-bold mt-2"
              >
                Save & Generate Backward Plan
              </Btn>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
