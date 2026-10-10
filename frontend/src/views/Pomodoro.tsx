import { Play, Pause, RotateCcw, CheckCircle, Flame, Clock } from "lucide-react";
import { Card, PageHead, Ring, Btn } from "../ui";
import { usePomodoro, modes, type ModeKey } from "../context/PomodoroContext";

export default function Pomodoro() {
  const {
    mode,
    timeLeft,
    totalSeconds,
    isRunning,
    subject,
    sessions,
    history,
    toggleTimer,
    resetTimer,
    pickMode,
    setSubject,
    formattedTime,
  } = usePomodoro();

  return (
    <div className="rise max-w-3xl mx-auto space-y-8">
      <PageHead
        eyebrow="Deep clinical work"
        title="Pomodoro Focus Timer"
        sub="Targeted study blocks enhance active recall. Your timer runs continuously in the background across all views."
      />

      <Card className="p-8 md:p-12 flex flex-col items-center text-center">
        {/* Mode Selector */}
        <div className="flex gap-2 rounded-full bg-lav p-1.5 mb-8">
          {(Object.keys(modes) as ModeKey[]).map((m) => (
            <button
              key={m}
              onClick={() => pickMode(m)}
              className={`rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition-all ${
                mode === m ? "bg-white text-ink shadow-sm font-bold" : "text-ink-soft hover:text-ink"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Circular Countdown Ring */}
        <div className="my-6">
          <Ring
            size={270}
            stroke={14}
            value={totalSeconds > 0 ? (timeLeft / totalSeconds) * 100 : 0}
            tone={mode === "Focus" ? "#e68fad" : "#4b41e1"}
            label={
              <div className="flex flex-col items-center">
                <span className="text-5xl md:text-6xl font-display font-bold tabular-nums">
                  {formattedTime}
                </span>
                <span className="text-xs font-semibold text-ink-soft mt-2 uppercase tracking-wider">
                  {mode}
                </span>
              </div>
            }
          />
        </div>

        {/* Subject Dropdown */}
        <div className="mt-4 flex items-center gap-3">
          <label className="text-xs font-semibold text-ink-soft flex items-center gap-2">
            Active Study Subject:
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-full border border-line bg-canvas px-4 py-2 text-xs font-bold text-ink focus:outline-none focus:ring-2 focus:ring-teal"
            >
              {["Pharmacology", "Med-Surg", "Maternal & Child", "Psychiatric", "Fundamentals & Ethics"].map(
                (s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                )
              )}
            </select>
          </label>
        </div>

        {/* Play / Pause / Reset Controls */}
        <div className="mt-8 flex items-center gap-3">
          <Btn onClick={toggleTimer} className="px-8 py-3.5 text-sm font-bold">
            {isRunning ? <Pause size={16} /> : <Play size={16} />}
            {isRunning ? "Pause Focus" : "Start Focus"}
          </Btn>

          <Btn variant="ghost" onClick={resetTimer} aria-label="Reset timer">
            <RotateCcw size={16} />
          </Btn>
        </div>

        <p className="mt-6 text-xs font-medium text-ink-soft flex items-center gap-2">
          <Flame size={15} className="text-amber" /> {sessions} focus sessions logged today · linked to {subject}
        </p>
      </Card>

      {/* Completed Focus Sessions History */}
      <Card className="p-6 md:p-8">
        <h3 className="text-base font-bold font-display flex items-center gap-2 mb-4">
          <Clock size={16} className="text-rosetext" /> Today's Focus History
        </h3>

        <div className="space-y-2.5">
          {history.slice(0, 5).map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-canvas border border-line text-xs font-medium"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle size={15} className="text-rosetext" />
                <span className="font-bold text-ink">{h.subject}</span>
                <span className="text-ink-soft">· {h.durationMinutes} min block</span>
              </div>
              <span className="text-ink-soft font-semibold">{h.completedAt}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
