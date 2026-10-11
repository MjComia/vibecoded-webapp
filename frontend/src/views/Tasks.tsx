import { useState, useEffect } from "react";
import {
  Plus,
  Layers,
  BookOpen,
  ClipboardCheck,
  Check,
  ArrowRight,
  Trash2,
  ListChecks,
  Sparkles,
  Timer,
  FileText,
} from "lucide-react";
import { Card, PageHead, Bar, Btn, Pill } from "../ui";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";

export interface StudyTask {
  id: string;
  title: string;
  kind: "cards" | "read" | "test";
  day: "Today" | "Tomorrow" | "Upcoming";
  done: boolean;
  linkView?: string;
}

const icons = { cards: Layers, read: BookOpen, test: ClipboardCheck };
const kindLabels = { cards: "Flashcards", read: "Reading", test: "Practice Test" };

const starterTaskTemplates: StudyTask[] = [
  {
    id: "task-start-1",
    title: "Complete 10-Item Diagnostic Baseline Drill",
    kind: "test",
    day: "Today",
    done: false,
    linkView: "quiz",
  },
  {
    id: "task-start-2",
    title: "Review 15 High-Yield Pharmacology Starter Cards",
    kind: "cards",
    day: "Today",
    done: false,
    linkView: "flashcards",
  },
  {
    id: "task-start-3",
    title: "Complete a 25-minute Pomodoro focus study block",
    kind: "read",
    day: "Today",
    done: false,
    linkView: "pomodoro",
  },
];

export default function Tasks({ go }: { go?: (v: string) => void }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem("real_nurse_tasks");
    if (!saved) return [];
    try {
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const [txt, setTxt] = useState("");
  const [selectedKind, setSelectedKind] = useState<"cards" | "read" | "test">("cards");
  const [selectedDay, setSelectedDay] = useState<"Today" | "Tomorrow">("Today");

  // Fetch candidate's real tasks from Supabase on mount
  useEffect(() => {
    if (isSupabaseConfigured && user) {
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            const mapped: StudyTask[] = data.map((t) => ({
              id: t.id,
              title: t.title,
              kind: (t.kind as any) || "cards",
              day: "Today",
              done: Boolean(t.is_done),
              linkView: t.kind === "cards" ? "flashcards" : t.kind === "test" ? "quiz" : "docs",
            }));
            setTasks(mapped);
            localStorage.setItem("real_nurse_tasks", JSON.stringify(mapped));
          }
        });
    }
  }, [user]);

  const saveTasks = (newTasks: StudyTask[]) => {
    setTasks(newTasks);
    localStorage.setItem("real_nurse_tasks", JSON.stringify(newTasks));
  };

  const doneCount = tasks.filter((t) => t.done).length;

  const toggleTask = async (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    saveTasks(updated);

    if (isSupabaseConfigured && user) {
      const task = updated.find((t) => t.id === id);
      if (task) {
        try {
          await supabase.from("tasks").update({ is_done: task.done }).eq("id", id);
        } catch (err) {
          console.warn("Could not sync task toggle with Supabase:", err);
        }
      }
    }
  };

  const deleteTask = async (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);

    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("tasks").delete().eq("id", id);
      } catch (err) {
        console.warn("Could not delete task from Supabase:", err);
      }
    }
  };

  const clearCompleted = () => {
    const updated = tasks.filter((t) => !t.done);
    saveTasks(updated);
  };

  const addTaskItem = async (title: string, kind: "cards" | "read" | "test", day: "Today" | "Tomorrow") => {
    if (!title.trim()) return;

    const newTask: StudyTask = {
      id: "t-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      kind,
      day,
      done: false,
      linkView: kind === "cards" ? "flashcards" : kind === "test" ? "quiz" : "docs",
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);

    if (isSupabaseConfigured && user) {
      try {
        await supabase.from("tasks").insert({
          user_id: user.id,
          title: newTask.title,
          kind: newTask.kind,
          is_done: false,
        });
      } catch (err) {
        console.warn("Could not insert task into Supabase:", err);
      }
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTaskItem(txt, selectedKind, selectedDay);
    setTxt("");
  };

  const populateStarterTasks = () => {
    saveTasks(starterTaskTemplates);
  };

  return (
    <div className="rise max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <PageHead
          eyebrow="Daily checklist"
          title="Tasks"
          sub="Organize and track your daily clinical review tasks, linked directly to flashcards, practice drills, and reading modules."
        />

        {tasks.length > 0 && doneCount > 0 && (
          <button
            onClick={clearCompleted}
            className="text-xs font-semibold text-ink-soft hover:text-danger pb-1 transition-colors"
          >
            Clear completed ({doneCount})
          </button>
        )}
      </div>

      {/* Progress Card (only when tasks exist) */}
      {tasks.length > 0 && (
        <Card className="p-6 flex items-center gap-5">
          <div className="flex-1">
            <Bar value={(doneCount / tasks.length) * 100} />
          </div>
          <span className="text-sm font-semibold text-ink-soft shrink-0">
            {doneCount}/{tasks.length} completed
          </span>
        </Card>
      )}

      {/* Add Task Input & Config */}
      <Card className="p-6 space-y-4">
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="flex gap-3">
            <input
              value={txt}
              onChange={(e) => setTxt(e.target.value)}
              placeholder="Add a new clinical review task…"
              className="flex-1 rounded-2xl border border-line bg-canvas px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <Btn type="submit" disabled={!txt.trim()} className="px-5">
              <Plus size={16} /> Add
            </Btn>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-line">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-soft">Type:</span>
              {(["cards", "read", "test"] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setSelectedKind(k)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold border transition-all ${
                    selectedKind === k
                      ? "bg-teal text-ink border-teal font-bold"
                      : "bg-white text-ink-soft border-line hover:bg-lav"
                  }`}
                >
                  {kindLabels[k]}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-ink-soft">Due:</span>
              {(["Today", "Tomorrow"] as const).map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`text-xs px-3 py-1 rounded-full font-semibold border transition-all ${
                    selectedDay === d
                      ? "bg-lav-deep text-indigo border-lav-deep font-bold"
                      : "bg-white text-ink-soft border-line hover:bg-lav"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="pt-2 border-t border-line flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-ink-soft uppercase tracking-wider">
            Quick Add:
          </span>
          {[
            { t: "Review 20 Flashcards", k: "cards" as const, i: Layers },
            { t: "10-Item Practice Quiz", k: "test" as const, i: ClipboardCheck },
            { t: "25-min Pomodoro Focus", k: "read" as const, i: Timer },
            { t: "Read Study Document", k: "read" as const, i: FileText },
          ].map((item) => (
            <button
              key={item.t}
              type="button"
              onClick={() => addTaskItem(item.t, item.k, "Today")}
              className="rounded-full border border-line bg-canvas hover:bg-lav px-3 py-1 text-xs font-medium text-ink flex items-center gap-1.5 transition-all"
            >
              <item.i size={12} className="text-rosetext" />
              <span>+ {item.t}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Empty State when no tasks created yet */}
      {tasks.length === 0 && (
        <Card className="p-10 text-center space-y-4">
          <div className="size-14 rounded-full bg-lav text-indigo grid place-items-center mx-auto">
            <ListChecks size={26} />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg text-ink">No Study Tasks Yet</h3>
            <p className="text-xs sm:text-sm text-ink-soft max-w-md mx-auto mt-1">
              You haven't created any tasks yet. Create a custom checklist item above to stay on track, or populate high-yield starter tasks for your exam.
            </p>
          </div>
          <Btn onClick={populateStarterTasks} className="px-6 py-2.5 text-xs font-bold">
            <Sparkles size={14} /> Populate Suggested Daily Tasks
          </Btn>
        </Card>
      )}

      {/* Task Sections by Day */}
      {tasks.length > 0 &&
        (["Today", "Tomorrow"] as const).map((d) => {
          const groupTasks = tasks.filter((t) => t.day === d);
          if (groupTasks.length === 0) return null;

          return (
            <div key={d} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center justify-between">
                <span>{d}</span>
                <span className="text-[11px] font-normal text-ink-soft">
                  {groupTasks.filter((t) => t.done).length}/{groupTasks.length} done
                </span>
              </h2>

              <div className="space-y-2.5">
                {groupTasks.map((t) => {
                  const IconComponent = icons[t.kind];
                  return (
                    <div
                      key={t.id}
                      className="w-full flex items-center gap-4 rounded-2xl bg-white border border-line p-4 transition-all hover:border-teal/50 shadow-2xs"
                    >
                      <button
                        onClick={() => toggleTask(t.id)}
                        className={`size-6 rounded-full grid place-items-center border-2 transition-colors shrink-0 ${
                          t.done ? "bg-teal border-teal text-ink font-bold" : "border-line hover:border-teal"
                        }`}
                        aria-label="Toggle task"
                      >
                        {t.done && <Check size={14} />}
                      </button>

                      <span
                        onClick={() => toggleTask(t.id)}
                        className={`flex-1 text-xs sm:text-sm font-medium cursor-pointer ${
                          t.done ? "line-through text-ink-soft/60" : "text-ink"
                        }`}
                      >
                        {t.title}
                      </span>

                      <span className="shrink-0">
                        <Pill tone={t.kind === "cards" ? "teal" : t.kind === "test" ? "amber" : "lav"}>
                          <IconComponent size={12} /> {kindLabels[t.kind]}
                        </Pill>
                      </span>

                      {t.linkView && go && !t.done && (
                        <button
                          onClick={() => go(t.linkView!)}
                          className="text-xs font-semibold text-rosetext hover:underline flex items-center gap-1 shrink-0"
                          title="Open study activity"
                        >
                          Start <ArrowRight size={12} />
                        </button>
                      )}

                      <button
                        onClick={() => deleteTask(t.id)}
                        className="text-ink-soft/40 hover:text-danger p-1 rounded-full transition-colors shrink-0"
                        aria-label="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}
