import { useState, useEffect } from "react";
import { Plus, Layers, BookOpen, ClipboardCheck, Check, ArrowRight, Trash2 } from "lucide-react";
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

const seedTasks: StudyTask[] = [
  { id: "t-1", title: "Review 25 Cardiac pharmacology flashcards", kind: "cards", day: "Today", done: true, linkView: "flashcards" },
  { id: "t-2", title: "Read: Maternal-child preeclampsia guidelines", kind: "read", day: "Today", done: false, linkView: "docs" },
  { id: "t-3", title: "Timed quiz: Pediatric developmental milestones", kind: "test", day: "Today", done: false, linkView: "quiz" },
  { id: "t-4", title: "Fluid & electrolytes FSRS deck (30 cards)", kind: "cards", day: "Tomorrow", done: false, linkView: "flashcards" },
  { id: "t-5", title: "Practice test: Med-Surg 75 items drill", kind: "test", day: "Tomorrow", done: false, linkView: "mock" },
];

export default function Tasks({ go }: { go?: (v: string) => void }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>(() => {
    const saved = localStorage.getItem("real_nurse_tasks");
    return saved ? JSON.parse(saved) : seedTasks;
  });

  const [txt, setTxt] = useState("");
  const [selectedKind, setSelectedKind] = useState<"cards" | "read" | "test">("cards");
  const [selectedDay, setSelectedDay] = useState<"Today" | "Tomorrow">("Today");

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

  const deleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    saveTasks(updated);
  };

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txt.trim()) return;

    const newTask: StudyTask = {
      id: "t-" + Date.now(),
      title: txt.trim(),
      kind: selectedKind,
      day: selectedDay,
      done: false,
      linkView: selectedKind === "cards" ? "flashcards" : selectedKind === "test" ? "quiz" : "docs",
    };

    const updated = [newTask, ...tasks];
    saveTasks(updated);
    setTxt("");

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

  return (
    <div className="rise max-w-3xl mx-auto space-y-8">
      <PageHead
        eyebrow="Daily checklist"
        title="Tasks"
        sub="Each review task links directly to a flashcard set, reading module, or practice exam."
      />

      {/* Progress Card */}
      <Card className="p-6 flex items-center gap-5">
        <div className="flex-1">
          <Bar value={tasks.length > 0 ? (doneCount / tasks.length) * 100 : 0} />
        </div>
        <span className="text-sm font-semibold text-ink-soft">
          {doneCount}/{tasks.length} completed
        </span>
      </Card>

      {/* Add Task Input & Config */}
      <Card className="p-6">
        <form onSubmit={addTask} className="space-y-4">
          <div className="flex gap-3">
            <input
              value={txt}
              onChange={(e) => setTxt(e.target.value)}
              placeholder="Add a new clinical review task…"
              className="flex-1 rounded-2xl border border-line bg-canvas px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <Btn type="submit" className="px-5">
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
                      ? "bg-teal text-ink border-teal"
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
                      ? "bg-lav-deep text-indigo border-lav-deep"
                      : "bg-white text-ink-soft border-line hover:bg-lav"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </form>
      </Card>

      {/* Task Sections by Day */}
      {(["Today", "Tomorrow"] as const).map((d) => {
        const groupTasks = tasks.filter((t) => t.day === d);
        if (groupTasks.length === 0) return null;

        return (
          <div key={d} className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{d}</h2>
            <div className="space-y-2.5">
              {groupTasks.map((t) => {
                const IconComponent = icons[t.kind];
                return (
                  <div
                    key={t.id}
                    className="w-full flex items-center gap-4 rounded-2xl bg-white border border-line p-4 transition-all hover:border-teal/50"
                  >
                    <button
                      onClick={() => toggleTask(t.id)}
                      className={`size-6 rounded-full grid place-items-center border-2 transition-colors shrink-0 ${
                        t.done ? "bg-teal border-teal text-ink" : "border-line hover:border-teal"
                      }`}
                      aria-label="Toggle task"
                    >
                      {t.done && <Check size={14} />}
                    </button>

                    <span
                      onClick={() => toggleTask(t.id)}
                      className={`flex-1 text-sm font-medium cursor-pointer ${
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
