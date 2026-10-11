import { useState } from "react";
import {
  Users,
  Sparkles,
  Layers,
  ShieldCheck,
  Download,
  Bell,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react";
import { Card, PageHead, Btn, Pill } from "../ui";

export default function Community() {
  const [subscribed, setSubscribed] = useState(false);

  const previewHighlights = [
    {
      icon: Layers,
      title: "One-Click FSRS Queue Sync",
      desc: "Import community-created question banks directly into your active spaced repetition study cycle with zero manual setup.",
    },
    {
      icon: ShieldCheck,
      title: "Clinical Peer-Review & Moderation",
      desc: "Every shared card deck is vetted by topnotcher peers and clinical instructors for PRC NLE and NCLEX accuracy.",
    },
    {
      icon: BookOpen,
      title: "Curated PRC Topnotcher Decks",
      desc: "Access verified high-yield mnemonic decks, drug calculation banks, and NGN clinical judgment case sets.",
    },
  ];

  return (
    <div className="rise space-y-8 max-w-5xl mx-auto pb-12">
      <PageHead
        eyebrow="Peer Learning & Resources"
        title="Community & Shared Decks"
        sub="Share and import high-yield question banks, mnemonic sets, and flashcards curated by fellow board examinees."
      />

      {/* Main Coming Soon Hero Card */}
      <Card className="relative overflow-hidden p-8 sm:p-12 border-line bg-gradient-to-br from-white via-canvas to-lav/40">
        <div className="max-w-2xl space-y-6">
          <div className="flex items-center gap-2">
            <Pill tone="amber">
              <Clock size={12} className="inline mr-1" />
              Coming Soon
            </Pill>
            <span className="text-xs font-semibold text-ink-soft">
              Feature in Active Development
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-ink leading-tight">
            Peer Deck Exchange & Public Question Banks are coming soon.
          </h2>

          <p className="text-base text-ink-soft leading-relaxed">
            We are fine-tuning moderation controls, clinical verification protocols, and seamless
            two-way FSRS synchronization so that every deck you import meets the highest licensure standards.
          </p>

          {/* Early Access Notification Action */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {subscribed ? (
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-teal-tint text-rosetext text-sm font-semibold">
                <CheckCircle2 size={18} /> You're on the early-access notification list!
              </div>
            ) : (
              <Btn
                variant="primary"
                onClick={() => setSubscribed(true)}
                className="py-3 px-6 shadow-sm flex items-center justify-center gap-2"
              >
                <Bell size={16} /> Notify me when Community Decks launch
              </Btn>
            )}
          </div>
        </div>
      </Card>

      {/* Planned Capabilities Preview */}
      <div>
        <h3 className="text-lg font-bold text-ink mb-4 flex items-center gap-2">
          <Sparkles size={18} className="text-rosetext" /> What's in the works:
        </h3>
        <div className="grid gap-6 md:grid-cols-3">
          {previewHighlights.map((feat) => {
            const Icon = feat.icon;
            return (
              <Card key={feat.title} className="p-6 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-10 w-10 rounded-2xl bg-lav flex items-center justify-center text-rosetext">
                    <Icon size={20} />
                  </div>
                  <h4 className="font-bold text-base text-ink">{feat.title}</h4>
                  <p className="text-xs text-ink-soft leading-relaxed">{feat.desc}</p>
                </div>
                <div className="mt-6 pt-3 border-t border-line">
                  <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
                    Planned Release
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
