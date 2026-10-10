import { createContext, useContext, useEffect, useState, useRef, type ReactNode } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "./AuthContext";

export const modes = { Focus: 25, "Short break": 5, "Long break": 15 } as const;
export type ModeKey = keyof typeof modes;

export interface PomodoroLogEntry {
  id: string;
  subject: string;
  durationMinutes: number;
  completedAt: string;
}

interface PomodoroContextType {
  mode: ModeKey;
  timeLeft: number;
  totalSeconds: number;
  isRunning: boolean;
  subject: string;
  sessions: number;
  history: PomodoroLogEntry[];
  toggleTimer: () => void;
  resetTimer: () => void;
  pickMode: (m: ModeKey) => void;
  setSubject: (s: string) => void;
  formattedTime: string;
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // Mode
  const [mode, setMode] = useState<ModeKey>(() => {
    const saved = localStorage.getItem("real_nurse_pomo_mode");
    return (saved as ModeKey) || "Focus";
  });

  // Subject
  const [subject, setSubject] = useState<string>(() => {
    return localStorage.getItem("real_nurse_pomo_subject") || "Pharmacology";
  });

  // Session count
  const [sessions, setSessions] = useState<number>(() => {
    const saved = localStorage.getItem("real_nurse_pomo_sessions");
    return saved ? parseInt(saved, 10) : 3;
  });

  // Completed history
  const [history, setHistory] = useState<PomodoroLogEntry[]>(() => {
    const saved = localStorage.getItem("real_nurse_pomo_history");
    return saved
      ? JSON.parse(saved)
      : [
          { id: "p-1", subject: "Pharmacology", durationMinutes: 25, completedAt: "10:15 AM" },
          { id: "p-2", subject: "Med-Surg", durationMinutes: 25, completedAt: "11:00 AM" },
          { id: "p-3", subject: "Maternal & Child", durationMinutes: 25, completedAt: "02:30 PM" },
        ];
  });

  const totalSeconds = modes[mode] * 60;

  // Initialize timeLeft and isRunning from persistent targetEndTime
  const [isRunning, setIsRunning] = useState<boolean>(() => {
    const target = localStorage.getItem("real_nurse_pomo_target_end");
    if (!target) return false;
    const remaining = Math.round((parseInt(target, 10) - Date.now()) / 1000);
    return remaining > 0;
  });

  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const target = localStorage.getItem("real_nurse_pomo_target_end");
    if (target) {
      const remaining = Math.round((parseInt(target, 10) - Date.now()) / 1000);
      if (remaining > 0) return remaining;
    }
    const savedPaused = localStorage.getItem("real_nurse_pomo_paused_time");
    if (savedPaused) {
      const parsed = parseInt(savedPaused, 10);
      if (parsed > 0) return parsed;
    }
    return modes[mode] * 60;
  });

  const targetEndRef = useRef<number | null>(() => {
    const target = localStorage.getItem("real_nurse_pomo_target_end");
    if (target) {
      const parsed = parseInt(target, 10);
      if (parsed > Date.now()) return parsed;
    }
    return null;
  });

  // Update subject in localStorage
  const handleSetSubject = (newSubject: string) => {
    setSubject(newSubject);
    localStorage.setItem("real_nurse_pomo_subject", newSubject);
  };

  // Change mode
  const pickMode = (newMode: ModeKey) => {
    setMode(newMode);
    localStorage.setItem("real_nurse_pomo_mode", newMode);
    localStorage.removeItem("real_nurse_pomo_target_end");
    localStorage.removeItem("real_nurse_pomo_paused_time");
    targetEndRef.current = null;
    setIsRunning(false);
    setTimeLeft(modes[newMode] * 60);
  };

  // Start or pause
  const toggleTimer = () => {
    if (!isRunning) {
      const target = Date.now() + timeLeft * 1000;
      targetEndRef.current = target;
      localStorage.setItem("real_nurse_pomo_target_end", String(target));
      localStorage.removeItem("real_nurse_pomo_paused_time");
      setIsRunning(true);
    } else {
      setIsRunning(false);
      localStorage.removeItem("real_nurse_pomo_target_end");
      localStorage.setItem("real_nurse_pomo_paused_time", String(timeLeft));
      targetEndRef.current = null;
    }
  };

  // Reset
  const resetTimer = () => {
    setIsRunning(false);
    localStorage.removeItem("real_nurse_pomo_target_end");
    localStorage.removeItem("real_nurse_pomo_paused_time");
    targetEndRef.current = null;
    setTimeLeft(modes[mode] * 60);
  };

  // Continuous timer ticker that runs at App level
  useEffect(() => {
    if (!isRunning) return;

    // Ensure targetEndRef is set
    if (!targetEndRef.current) {
      const saved = localStorage.getItem("real_nurse_pomo_target_end");
      if (saved) {
        targetEndRef.current = parseInt(saved, 10);
      } else {
        targetEndRef.current = Date.now() + timeLeft * 1000;
        localStorage.setItem("real_nurse_pomo_target_end", String(targetEndRef.current));
      }
    }

    const interval = setInterval(() => {
      if (!targetEndRef.current) return;
      const remaining = Math.max(0, Math.round((targetEndRef.current - Date.now()) / 1000));
      setTimeLeft(remaining);

      // Tab Title update
      const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
      const ss = String(remaining % 60).padStart(2, "0");
      document.title = `(${mm}:${ss}) Real Nurse - ${mode}`;

      if (remaining <= 0) {
        clearInterval(interval);
        setIsRunning(false);
        targetEndRef.current = null;
        localStorage.removeItem("real_nurse_pomo_target_end");
        localStorage.removeItem("real_nurse_pomo_paused_time");
        document.title = "Real Nurse";

        if (mode === "Focus") {
          const updatedSessions = sessions + 1;
          setSessions(updatedSessions);
          localStorage.setItem("real_nurse_pomo_sessions", String(updatedSessions));

          const newEntry: PomodoroLogEntry = {
            id: "p-" + Date.now(),
            subject,
            durationMinutes: modes.Focus,
            completedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };

          const updatedHistory = [newEntry, ...history];
          setHistory(updatedHistory);
          localStorage.setItem("real_nurse_pomo_history", JSON.stringify(updatedHistory));

          // Log to Supabase
          if (isSupabaseConfigured && user) {
            supabase
              .from("pomodoro_logs")
              .insert({
                user_id: user.id,
                duration_minutes: modes.Focus,
                mode: "Focus",
                completed_at: new Date().toISOString(),
              })
              .then(() => {});
          }

          // Suggest break
          pickMode("Short break");
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      if (!isRunning) {
        document.title = "Real Nurse";
      }
    };
  }, [isRunning, mode, subject, sessions, history, user, timeLeft]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");
  const formattedTime = `${mm}:${ss}`;

  return (
    <PomodoroContext.Provider
      value={{
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
        setSubject: handleSetSubject,
        formattedTime,
      }}
    >
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (!context) {
    throw new Error("usePomodoro must be used within a PomodoroProvider");
  }
  return context;
}
