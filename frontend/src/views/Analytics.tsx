import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Card, PageHead, Bar, Pill } from "../ui";

const data = [
  { s: "Pharm", v: 72 }, { s: "Med-Surg", v: 42 }, { s: "Maternal", v: 81 }, { s: "Pediatrics", v: 68 },
  { s: "Psych", v: 51 }, { s: "Fundamentals", v: 88 }, { s: "Leadership", v: 63 },
];
export default function Analytics() {
  const sorted = [...data].sort((a, b) => a.v - b.v);
  return (
    <div className="rise">
      <PageHead eyebrow="Performance" title="Analytics" sub="Topic proficiency across 14,200 answered items." />
      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="p-8"><h2 className="text-xl font-bold mb-2">Proficiency radar</h2>
          <div className="h-80"><ResponsiveContainer><RadarChart data={data} outerRadius="75%"><PolarGrid stroke="#f8d7e4" /><PolarAngleAxis dataKey="s" tick={{ fontSize: 12, fill: "#3d4947" }} /><Radar dataKey="v" stroke="#e68fad" fill="#e68fad" fillOpacity={0.25} strokeWidth={2} /></RadarChart></ResponsiveContainer></div></Card>
        <Card className="p-8"><h2 className="text-xl font-bold mb-6">Mastery by topic</h2>
          <div className="space-y-5">{sorted.map((d) => <div key={d.s}><div className="flex justify-between text-sm mb-2"><span className="font-semibold">{d.s}</span><span className="flex items-center gap-2">{d.v < 55 && <Pill tone="red">Weak</Pill>}{d.v}%</span></div><Bar value={d.v} tone={d.v < 55 ? "red" : d.v < 70 ? "amber" : "teal"} /></div>)}</div></Card>
      </div>
    </div>
  );
}
