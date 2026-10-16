import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Flame,
  Layers,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { Card, PageHead, Bar, Pill, Btn, Ring } from "../ui";
import { fetchAnalytics, resetAnalytics, AnalyticsSummary } from "../lib/api";
import { useAuth } from "../context/AuthContext";

interface AnalyticsProps {
  go?: (view: string) => void;
}

export default function Analytics({ go }: AnalyticsProps) {
  const { user } = useAuth();
  const [exam, setExam] = useState<"NLE" | "NCLEX-RN">("NLE");
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    fetchAnalytics(exam, user?.id).then((res) => {
      setData(res);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
  }, [exam, user?.id]);

  const handleReset = async () => {
    if (!confirm("Are you sure you want to reset all your analytics and study attempts back to a clean slate?")) return;
    await resetAnalytics(user?.id);
    loadData();
  };

  const handleLaunchPriorityDrill = (subject?: string, topic?: string) => {
    const targetTopic = topic || data?.primaryWeakArea?.topic || "Basic Nursing Skills & Infection Control";
    const targetSubject = subject || data?.primaryWeakArea?.subject || "Part I: Foundation";

    sessionStorage.setItem("priority_drill_topic", targetTopic);
    sessionStorage.setItem("priority_drill_subject", targetSubject);
    sessionStorage.setItem("priority_drill_count", "10");

    if (go) {
      go("quiz");
    }
  };

  const totalAnswered = data?.totalQuestionsAnswered ?? 0;
  const isZeroState = totalAnswered === 0;
  const readiness = data?.overallReadiness ?? 0;
  const passingThreshold = data?.passingThreshold ?? 75;
  const minSubjectThreshold = data?.minimumSubjectThreshold ?? 60;
  const isPassing = readiness >= passingThreshold;
  const primaryWeak = data?.primaryWeakArea;

  const toneForScore = (v: number): "red" | "amber" | "teal" => {
    if (v < minSubjectThreshold) return "red";
    if (v < passingThreshold) return "amber";
    return "teal";
  };

  return (
    <div className="rise space-y-8 max-w-6xl mx-auto pb-12">
      <PageHead
        eyebrow="Board Performance & Competencies"
        title="Analytics & Mastery Engine"
        sub="Continuous evaluation against Philippine PRC NLE 75% licensure passing standards and curriculum competencies."
        action={
          <div className="flex items-center gap-2 bg-lav p-1.5 rounded-full border border-line">
            <button
              onClick={() => setExam("NLE")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                exam === "NLE"
                  ? "bg-rosetext text-white shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              🇵🇭 Philippine NLE
            </button>
            <button
              onClick={() => setExam("NCLEX-RN")}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                exam === "NCLEX-RN"
                  ? "bg-rosetext text-white shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              🌐 NCLEX-RN
            </button>
          </div>
        }
      />

      {/* Primary Weak Area Priority Drill Banner OR Clean State Banner */}
      {isZeroState ? (
        <div className="relative overflow-hidden rounded-3xl bg-lav border border-line p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-tint text-rosetext">
                  <Sparkles size={16} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-rosetext">
                  Diagnostic Calibration
                </span>
                <Pill tone="teal">Clean Slate</Pill>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-ink">
                No Pre-existing Study Data — Ready for Your First Drill
              </h2>
              <p className="text-sm text-ink-soft">
                Your analytics are clean and ready. Take a 10-item diagnostic drill or practice quiz to calibrate your <b>PRC 75% Passing Standard</b> readiness score and identify priority focus areas.
              </p>
            </div>
            <Btn
              variant="indigo"
              onClick={() => handleLaunchPriorityDrill()}
              className="w-full md:w-auto shrink-0 shadow-md py-3 px-6 text-base flex items-center justify-center gap-2"
            >
              <Zap size={18} className="text-amber" fill="#ffb86b" />
              Begin 10-Item Diagnostic Drill
            </Btn>
          </div>
        </div>
      ) : primaryWeak ? (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#ffebee] via-[#fff0f3] to-white border border-[#ffcdd2] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#ffdad6] text-[#93000a]">
                  <AlertTriangle size={16} />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-[#93000a]">
                  Priority Weak Area Detected
                </span>
                <Pill tone="red">{primaryWeak.masteryPercentage}% Mastery</Pill>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-ink">
                {primaryWeak.topic}
              </h2>
              <p className="text-sm text-ink-soft">
                Subject: <span className="font-semibold text-ink">{primaryWeak.subject}</span>.
                Scoring below the <b>{minSubjectThreshold}% PRC NLE minimum threshold</b>.
                Reinforce this competency now to safeguard your general average.
              </p>
            </div>
            <Btn
              variant="indigo"
              onClick={() => handleLaunchPriorityDrill(primaryWeak.subject, primaryWeak.topic)}
              className="w-full md:w-auto shrink-0 shadow-md py-3 px-6 text-base flex items-center justify-center gap-2"
            >
              <Zap size={18} className="text-amber" fill="#ffb86b" />
              Launch 10-Item Priority Drill
            </Btn>
          </div>
        </div>
      ) : null}

      {/* Top Metric Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Board Readiness & 75% Rule */}
        <Card className="p-6 flex items-center gap-5 border-l-4 border-l-rosetext">
          <Ring
            value={readiness}
            size={88}
            tone={isZeroState ? "#3d4947" : isPassing ? "#006a6a" : readiness >= 70 ? "#ffb86b" : "#ba1a1a"}
            label={<span className="text-lg font-bold">{isZeroState ? "0%" : `${readiness}%`}</span>}
          />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
              Predicted Readiness
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Pill tone={isZeroState ? "lav" : isPassing ? "teal" : readiness >= 70 ? "amber" : "red"}>
                {isZeroState ? "Diagnostic Needed" : data?.passLikelihood || "Borderline"}
              </Pill>
            </div>
            <p className="text-[11px] text-ink-soft mt-1.5">
              {isZeroState ? "Take a drill to calibrate" : <>PRC Threshold: <b className="text-ink">{passingThreshold}% Target</b></>}
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
            <Target size={14} className="text-rosetext" /> Total Answered
          </p>
          <p className="mt-3 font-display text-4xl font-bold text-ink">
            {data?.totalQuestionsAnswered ?? 0}
          </p>
          <p className="mt-2 text-xs text-ink-soft">
            {isZeroState ? "No practice quizzes submitted yet" : <>Accuracy across drills: <b className="text-rosetext">{data?.accuracyRate ?? 0}%</b></>}
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
            <Layers size={14} className="text-teal" /> Flashcards Mastered
          </p>
          <p className="mt-3 font-display text-4xl font-bold text-ink">
            {data?.flashcardsMastered ?? 0}
          </p>
          <p className="mt-2 text-xs text-ink-soft">
            SRS Stability: <b className="text-teal">FSRS spaced repetition</b>
          </p>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
            <Award size={14} className="text-amber" /> Mock Exam High
          </p>
          <p className="mt-3 font-display text-4xl font-bold text-ink">
            {data?.mockExamHighestScore ? `${data.mockExamHighestScore}%` : "0%"}
          </p>
          <p className="mt-2 text-xs text-ink-soft">
            {data?.mockExamHighestScore ? "Simulated 100-item board exam" : "Complete a full mock exam"}
          </p>
        </Card>
      </div>

      {/* PRC NLE Passing Benchmark Guide Banner */}
      <div className="rounded-2xl bg-white border border-line p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-ink-soft">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-lav rounded-xl text-rosetext">
            <BookOpen size={18} />
          </div>
          <div>
            <p className="font-bold text-ink text-sm">Philippine PRC Licensure Benchmark Rules</p>
            <p className="text-ink-soft mt-0.5">
              Candidate must obtain a General Average of <b>≥ 75%</b>, with <b>no rating below 60%</b> in any subject.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-teal" /> ≥75% Passing
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-amber" /> 60–74% Borderline
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-danger" /> &lt;60% Conditioned
          </span>
        </div>
      </div>

      {/* Radar Chart & Topic Proficiency Breakdown */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Radar Chart */}
        <Card className="p-6 lg:p-8 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-ink">Competency Radar</h2>
              <Pill tone="lav">{exam}</Pill>
            </div>
            <p className="text-xs text-ink-soft mb-6">
              Balance of clinical knowledge across the 5 core curriculum areas.
            </p>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={data?.radarData || []} outerRadius="70%">
                  <PolarGrid stroke="#f8d7e4" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fontSize: 11, fill: "#3d4947", fontWeight: 600 }}
                  />
                  <Tooltip
                    formatter={(val: any) => [`${val}%`, "Mastery"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e0e0e0" }}
                  />
                  <Radar
                    name="Mastery"
                    dataKey="score"
                    stroke="#e68fad"
                    fill="#e68fad"
                    fillOpacity={0.35}
                    strokeWidth={2.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-line mt-4 flex items-center justify-between text-xs text-ink-soft">
            <span>Overall General Average:</span>
            <span className="font-bold text-ink text-sm">{readiness}%</span>
          </div>
        </Card>

        {/* Detailed Parts and Topics Mastery */}
        <Card className="p-6 lg:p-8 lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink">
              Curriculum Mastery Breakdown
            </h2>
            <span className="text-xs text-ink-soft font-semibold">
              {data?.parts.length || 0} Syllabus Sections
            </span>
          </div>

          <div className="space-y-6">
            {data?.parts.map((part) => {
              const tone = toneForScore(part.masteryPercentage);
              return (
                <div key={part.code} className="p-4 rounded-2xl bg-canvas border border-line space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-xs font-bold text-rosetext block mb-0.5">
                        {part.code}
                      </span>
                      <h3 className="font-bold text-sm text-ink">{part.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {part.masteryPercentage < minSubjectThreshold ? (
                        <Pill tone="red">&lt;60% Critical</Pill>
                      ) : part.masteryPercentage < passingThreshold ? (
                        <Pill tone="amber">Borderline</Pill>
                      ) : (
                        <Pill tone="teal">Passing</Pill>
                      )}
                      <span className="text-base font-bold tabular-nums text-ink">
                        {part.masteryPercentage}%
                      </span>
                    </div>
                  </div>

                  <Bar value={part.masteryPercentage} tone={tone} />

                  {/* Subtopics */}
                  {part.topics && part.topics.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-line/60 space-y-2">
                      {part.topics.map((t) => (
                        <div
                          key={t.code}
                          className="flex items-center justify-between text-xs py-1 hover:bg-lav/30 px-2 rounded-lg transition-colors"
                        >
                          <span className="text-ink-soft font-medium flex items-center gap-1.5">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                t.masteryPercentage < 60
                                  ? "bg-danger"
                                  : t.masteryPercentage < 75
                                  ? "bg-amber"
                                  : "bg-teal"
                              }`}
                            />
                            {t.topic}
                          </span>
                          <div className="flex items-center gap-3">
                            <span className="text-ink-soft tabular-nums">
                              {t.totalAnswered} items
                            </span>
                            <span className="font-bold text-ink tabular-nums">
                              {t.masteryPercentage}%
                            </span>
                            <button
                              onClick={() => handleLaunchPriorityDrill(part.shortName, t.topic)}
                              className="text-[11px] font-semibold text-rosetext hover:underline flex items-center"
                              title="Start targeted quiz"
                            >
                              Drill <ChevronRight size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Weak Areas Summary List Card */}
      <Card className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-ink">Identified Weak Areas (&lt;75%)</h2>
            <p className="text-xs text-ink-soft mt-1">
              Topics needing remediation before test day. Ranked by lowest mastery percentage.
            </p>
          </div>
          <Btn
            variant="soft"
            onClick={() => handleLaunchPriorityDrill()}
            className="text-xs py-2 px-4 flex items-center gap-1.5"
          >
            <Sparkles size={14} className="text-rosetext" /> Quick 10-Item Weak Areas Drill
          </Btn>
        </div>

        {(!data?.weakAreas || data.weakAreas.length === 0) ? (
          <div className="p-8 rounded-2xl border border-line bg-canvas text-center space-y-2">
            <CheckCircle2 size={28} className="mx-auto text-rosetext opacity-80" />
            <h4 className="font-bold text-sm text-ink">No Weak Areas Flagged Yet</h4>
            <p className="text-xs text-ink-soft max-w-md mx-auto">
              Your analytics will automatically identify and rank topics requiring remediation as you complete quizzes, flashcards, or mock exams.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.weakAreas.map((item) => (
              <div
                key={item.code}
                className="p-4 rounded-2xl border border-line bg-white flex flex-col justify-between hover:shadow-sm transition-all"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Pill tone={item.masteryPercentage < 60 ? "red" : "amber"}>
                      {item.masteryPercentage}%
                    </Pill>
                    <span className="text-[11px] text-ink-soft font-semibold">{item.subject}</span>
                  </div>
                  <h4 className="font-bold text-sm text-ink line-clamp-2">{item.topic}</h4>
                </div>
                <div className="mt-4 pt-3 border-t border-line flex items-center justify-between text-xs">
                  <span className="text-ink-soft">{item.totalAnswered} items answered</span>
                  <button
                    onClick={() => handleLaunchPriorityDrill(item.subject, item.topic)}
                    className="font-bold text-rosetext hover:underline flex items-center gap-0.5"
                  >
                    Target <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
