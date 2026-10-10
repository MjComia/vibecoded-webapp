import type { ReactNode, ButtonHTMLAttributes } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-white border border-line shadow-[0_1px_2px_rgba(19,27,46,.04),0_12px_32px_-18px_rgba(19,27,46,.12)] ${className}`}>{children}</section>;
}

export function PageHead({ eyebrow, title, sub, action }: { eyebrow?: string; title: string; sub?: string; action?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-6 mb-10">
      <div className="max-w-2xl">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rosetext mb-3">{eyebrow}</p>}
        <h1 className="text-3xl md:text-4xl font-bold leading-tight">{title}</h1>
        {sub && <p className="mt-3 text-base text-ink-soft leading-relaxed">{sub}</p>}
      </div>
      {action}
    </header>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "soft" | "ghost" | "indigo" | "danger" };
export function Btn({ variant = "primary", className = "", ...p }: BtnProps) {
  const v = {
    primary: "bg-teal text-ink hover:bg-teal-deep",
    soft: "bg-lav text-ink hover:bg-lav-deep",
    ghost: "bg-white border border-line text-ink hover:bg-lav",
    indigo: "bg-indigo text-white hover:bg-[#3323cc]",
    danger: "bg-danger text-white hover:bg-[#93000a]",
  }[variant];
  return <button {...p} className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-40 ${v} ${className}`} />;
}

export function Pill({ children, tone = "lav" }: { children: ReactNode; tone?: "lav" | "teal" | "red" | "amber" | "indigo" }) {
  const t = { lav: "bg-lav text-ink-soft", teal: "bg-teal-tint text-rosetext", red: "bg-[#ffdad6] text-[#93000a]", amber: "bg-[#ffe8cf] text-[#8d4b00]", indigo: "bg-lav-deep text-indigo" }[tone];
  return <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${t}`}>{children}</span>;
}

export function Bar({ value, tone = "teal" }: { value: number; tone?: "teal" | "red" | "amber" | "indigo" }) {
  const c = { teal: "bg-teal", red: "bg-danger", amber: "bg-amber", indigo: "bg-indigo" }[tone];
  return (
    <div className="h-2 w-full rounded-full bg-lav overflow-hidden">
      <div className={`h-full rounded-full ${c} transition-all duration-700`} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Ring({ value, size = 96, stroke = 9, label, tone = "#e68fad" }: { value: number; size?: number; stroke?: number; label?: ReactNode; tone?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#fdeaf1" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={tone} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset .8s" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center font-display font-bold">{label}</div>
    </div>
  );
}
