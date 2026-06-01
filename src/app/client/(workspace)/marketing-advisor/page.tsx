"use client";

import { useState } from "react";
import { useClient } from "@/components/client/client-context";
import { useLocalState } from "@/components/client/use-local-state";
import {
  SectionTitle,
  Panel,
  MetricCard,
  StatusBadge,
  FeatureTag,
  DemoModeNotice,
} from "@/components/client/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { Button } from "@/components/dashboard/ui";
import {
  ADVISOR_CAMPAIGNS,
  ADVISOR_BRIEFS,
  ADVISOR_STRATEGY,
} from "@/lib/client/mock";
import { CLIENT_KEYS } from "@/lib/client/config";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type AdvisorKind = "campaign" | "brief" | "strategy";

type Recommendation = {
  id: string;
  kind: AdvisorKind;
  title: string;
  body: string;
};

type SavedRecommendation = Recommendation & { savedLabel: string };

const KIND_META: Record<
  AdvisorKind,
  { label: string; icon: IconName; tone: "blue" | "cyan" | "green" | "gold" | "purple"; iconColor: string }
> = {
  campaign: { label: "Campaign idea", icon: "sparkles", tone: "cyan", iconColor: "text-aerial-cyan" },
  brief: { label: "Creative brief", icon: "file", tone: "gold", iconColor: "text-review-gold" },
  strategy: { label: "Monthly strategy", icon: "calendar", tone: "green", iconColor: "text-escrow-green" },
};

/* -------------------------------------------------------------------------- */
/*  Static helper content (prewritten chips / cards)                           */
/* -------------------------------------------------------------------------- */

const CONTENT_IDEAS: string[] = [
  "Suite reveal — slow push-in, warm grade",
  "Chef's pass POV — 15s vertical",
  "Golden-hour terrace dining",
  "Guest testimonial montage",
  "Behind-the-scenes shoot day",
  "Seasonal cocktail close-ups",
];

const POSTING_RECS: { day: string; slot: string; format: string }[] = [
  { day: "Tue", slot: "08:30", format: "Reel — hook-led" },
  { day: "Wed", slot: "12:00", format: "Carousel — editorial" },
  { day: "Thu", slot: "18:00", format: "Story — UGC repost" },
  { day: "Sat", slot: "10:00", format: "Hero film — feed" },
];

const POSITIONING: { label: string; value: string }[] = [
  { label: "Primary audience", value: "Design-led travellers, 28–45" },
  { label: "Secondary", value: "Corporate event planners" },
  { label: "Geo focus", value: "Nordics + key EU hubs" },
  { label: "Distinctive promise", value: "Effortless, on-time premium production" },
];

const BRAND_ANGLES: { title: string; body: string }[] = [
  { title: "Craft over volume", body: "Lead with one cinematic hero asset per drop, not ten rushed posts." },
  { title: "Editorial, never staged", body: "Natural light, real spaces, quiet confidence in every frame." },
  { title: "The Nordic point of view", body: "Lean into place — light, landscape and restraint as the signature." },
];

const SEASONAL_IDEAS: { season: string; idea: string; tone: "blue" | "cyan" | "gold" | "green" | "purple" }[] = [
  { season: "Summer", idea: "Terrace dining & midnight-sun reels", tone: "gold" },
  { season: "Autumn", idea: "Harvest menu + cosy-stay positioning", tone: "cyan" },
  { season: "Winter", idea: "'Nordic Winter Escapes' campaign", tone: "blue" },
  { season: "Spring", idea: "Fresh-look brand refresh shoot", tone: "green" },
];

/* -------------------------------------------------------------------------- */
/*  Generator card                                                             */
/* -------------------------------------------------------------------------- */

function GeneratorCard({
  kind,
  title,
  subtitle,
  count,
  onGenerate,
}: {
  kind: AdvisorKind;
  title: string;
  subtitle: string;
  count: number;
  onGenerate: () => void;
}) {
  const meta = KIND_META[kind];
  return (
    <Panel className="flex h-full flex-col">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[0.06] text-aerial-cyan ring-1 ring-white/10">
          <Icon name={meta.icon} size={20} />
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-tight text-white">{title}</h3>
          <p className="mt-1 text-xs leading-snug text-white/50">{subtitle}</p>
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <span className="text-[11px] text-white/40">
          {count} {count === 1 ? "draft" : "drafts"} in library
        </span>
        <Button tone="blue" onClick={onGenerate}>
          <Icon name="sparkles" size={15} /> Generate
        </Button>
      </div>
    </Panel>
  );
}

/* -------------------------------------------------------------------------- */
/*  Result card                                                                */
/* -------------------------------------------------------------------------- */

function ResultCard({
  rec,
  onSave,
  onDismiss,
}: {
  rec: Recommendation;
  onSave: () => void;
  onDismiss: () => void;
}) {
  const meta = KIND_META[rec.kind];
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 transition-colors hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusBadge label={meta.label} tone={meta.tone} />
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss recommendation"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
      <h4 className="mt-3 text-sm font-semibold tracking-tight text-white">{rec.title}</h4>
      <p className="mt-1.5 text-sm leading-relaxed text-white/60">{rec.body}</p>
      <div className="mt-4">
        <Button tone="green" variant="dark" onClick={onSave}>
          <Icon name="bookmark" size={14} /> Save recommendation
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function MarketingAdvisorPage() {
  const { company, toast } = useClient();
  const [saved, setSaved] = useLocalState<SavedRecommendation[]>(CLIENT_KEYS.advisorSaved, []);

  // Generated results live for the session only (no persistence needed).
  const [results, setResults] = useState<Recommendation[]>([]);

  // Cycle counters per generator so each click pulls the next prewritten card.
  const [campaignIdx, setCampaignIdx] = useState(0);
  const [briefIdx, setBriefIdx] = useState(0);
  const [strategyIdx, setStrategyIdx] = useState(0);

  function generate(
    kind: AdvisorKind,
    source: { title: string; body: string }[],
    idx: number,
    setIdx: (n: number) => void,
  ) {
    const next = source[idx % source.length];
    const rec: Recommendation = {
      id: crypto.randomUUID(),
      kind,
      title: next.title,
      body: next.body,
    };
    setResults((prev) => [rec, ...prev]);
    setIdx(idx + 1);
    toast("Generated");
  }

  function saveRec(rec: Recommendation) {
    if (saved.some((s) => s.title === rec.title && s.kind === rec.kind)) {
      toast("Already saved");
      return;
    }
    const entry: SavedRecommendation = {
      ...rec,
      id: crypto.randomUUID(),
      savedLabel: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
    setSaved((prev) => [entry, ...prev]);
    toast("Saved");
  }

  function dismissResult(id: string) {
    setResults((prev) => prev.filter((r) => r.id !== id));
    toast("Dismissed");
  }

  function removeSaved(id: string) {
    setSaved((prev) => prev.filter((s) => s.id !== id));
    toast("Removed");
  }

  function clearResults() {
    setResults([]);
    toast("Cleared");
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-aerial-cyan">
            <Icon name="sparkles" size={12} /> AI Advisor
          </span>
          <FeatureTag feature="marketing-advisor" />
          <DemoModeNotice className="hidden sm:inline-flex" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Marketing Advisor</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
            On-brand campaign ideas, creative briefs and monthly strategy for{" "}
            <span className="text-white/80">{company.name}</span>. Generate a draft, then save the ones
            worth running. This is a demo — every output is prewritten.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Tone of voice" value={company.toneOfVoice.split(",")[0]} icon="sparkles" accent="text-aerial-cyan" />
          <MetricCard label="Visual style" value={company.visualStyle.split(",")[0]} icon="camera" accent="text-review-gold" />
          <MetricCard label="Generated" value={String(results.length)} sub="this session" icon="grid" accent="text-aerial-cyan" />
          <MetricCard label="Saved" value={String(saved.length)} sub="recommendations" icon="bookmark" accent="text-escrow-green" />
        </div>
      </header>

      {/* Generators */}
      <section>
        <SectionTitle
          title="Generate recommendations"
          subtitle="Each generator appends the next on-brand draft to your results below."
        />
        <div className="grid gap-4 md:grid-cols-3">
          <GeneratorCard
            kind="campaign"
            title="Campaign ideas"
            subtitle="Multi-week concepts to drive bookings and reach."
            count={results.filter((r) => r.kind === "campaign").length}
            onGenerate={() => generate("campaign", ADVISOR_CAMPAIGNS, campaignIdx, setCampaignIdx)}
          />
          <GeneratorCard
            kind="brief"
            title="Creative brief"
            subtitle="Production-ready briefs your creatives can shoot from."
            count={results.filter((r) => r.kind === "brief").length}
            onGenerate={() => generate("brief", ADVISOR_BRIEFS, briefIdx, setBriefIdx)}
          />
          <GeneratorCard
            kind="strategy"
            title="Monthly strategy"
            subtitle="A balanced content plan with cadence and channel split."
            count={results.filter((r) => r.kind === "strategy").length}
            onGenerate={() => generate("strategy", ADVISOR_STRATEGY, strategyIdx, setStrategyIdx)}
          />
        </div>
      </section>

      {/* Results + Saved */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Results stream */}
        <div className="lg:col-span-2">
          <SectionTitle
            title="Results"
            subtitle="Generated this session."
            action={
              results.length > 0 ? (
                <Button tone="white" variant="ghost" onClick={clearResults}>
                  Clear all
                </Button>
              ) : undefined
            }
          />
          {results.length === 0 ? (
            <Panel className="flex flex-col items-center justify-center px-6 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grid-blue/15 text-aerial-cyan ring-1 ring-grid-blue/25">
                <Icon name="sparkles" size={22} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-white">No recommendations yet</h3>
              <p className="mt-1.5 max-w-sm text-sm text-white/50">
                Use a generator above to draft your first campaign idea, brief or strategy.
              </p>
            </Panel>
          ) : (
            <div className="flex flex-col gap-3">
              {results.map((rec) => (
                <ResultCard
                  key={rec.id}
                  rec={rec}
                  onSave={() => saveRec(rec)}
                  onDismiss={() => dismissResult(rec.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Saved panel */}
        <div>
          <SectionTitle title="Saved" subtitle="Kept for your team." />
          <Panel>
            {saved.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-2 py-8 text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] text-escrow-green">
                  <Icon name="bookmark" size={18} />
                </span>
                <p className="mt-3 text-sm text-white/50">
                  Nothing saved yet. Hit <span className="text-white/75">Save recommendation</span> on a result.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-3">
                {saved.map((s) => {
                  const meta = KIND_META[s.kind];
                  return (
                    <li key={s.id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ${meta.iconColor}`}>
                          <Icon name={meta.icon} size={14} />
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSaved(s.id)}
                          aria-label="Remove saved recommendation"
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/[0.06] hover:text-urgent-red"
                        >
                          <Icon name="x" size={13} />
                        </button>
                      </div>
                      <h4 className="mt-2 text-sm font-semibold leading-snug tracking-tight text-white">{s.title}</h4>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/50">{s.body}</p>
                      <div className="mt-2.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-white/35">
                        <span>{meta.label}</span>
                        <span className="text-white/20">•</span>
                        <span>Saved {s.savedLabel}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
        </div>
      </section>

      {/* Helpful static sections */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Content ideas */}
        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <Icon name="grid" size={16} className="text-aerial-cyan" />
            <h3 className="text-sm font-semibold tracking-tight text-white">Content ideas</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {CONTENT_IDEAS.map((idea) => (
              <span
                key={idea}
                className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70"
              >
                {idea}
              </span>
            ))}
          </div>
        </Panel>

        {/* Posting recommendations */}
        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <Icon name="calendar" size={16} className="text-escrow-green" />
            <h3 className="text-sm font-semibold tracking-tight text-white">Posting recommendations</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[20rem] border-separate border-spacing-y-1.5 text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-white/35">
                  <th className="px-2 font-medium">Day</th>
                  <th className="px-2 font-medium">Time</th>
                  <th className="px-2 font-medium">Best format</th>
                </tr>
              </thead>
              <tbody>
                {POSTING_RECS.map((p) => (
                  <tr key={`${p.day}-${p.slot}`} className="bg-white/[0.03]">
                    <td className="rounded-l-xl px-2 py-2 font-medium text-white">{p.day}</td>
                    <td className="px-2 py-2 font-mono text-xs text-aerial-cyan">{p.slot}</td>
                    <td className="rounded-r-xl px-2 py-2 text-white/65">{p.format}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Audience positioning */}
        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <Icon name="target" size={16} className="text-aerial-cyan" />
            <h3 className="text-sm font-semibold tracking-tight text-white">Audience &amp; positioning</h3>
          </div>
          <dl className="flex flex-col divide-y divide-white/8">
            {POSITIONING.map((p) => (
              <div key={p.label} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="text-xs uppercase tracking-wider text-white/40">{p.label}</dt>
                <dd className="text-right text-sm font-medium text-white/80">{p.value}</dd>
              </div>
            ))}
          </dl>
        </Panel>

        {/* Brand angle */}
        <Panel>
          <div className="mb-4 flex items-center gap-2">
            <Icon name="star" size={16} className="text-review-gold" />
            <h3 className="text-sm font-semibold tracking-tight text-white">Brand angle</h3>
          </div>
          <ul className="flex flex-col gap-3">
            {BRAND_ANGLES.map((a) => (
              <li key={a.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3.5">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-review-gold/15 text-review-gold">
                    <Icon name="check" size={13} />
                  </span>
                  <span className="text-sm font-semibold tracking-tight text-white">{a.title}</span>
                </div>
                <p className="mt-1.5 pl-8 text-xs leading-relaxed text-white/55">{a.body}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </section>

      {/* Seasonal ideas */}
      <section>
        <SectionTitle
          title="Seasonal ideas"
          subtitle="A starting angle for each quarter — generate a full campaign from any of them above."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SEASONAL_IDEAS.map((s) => (
            <Panel key={s.season} className="flex flex-col gap-3">
              <StatusBadge label={s.season} tone={s.tone} />
              <p className="text-sm leading-relaxed text-white/70">{s.idea}</p>
            </Panel>
          ))}
        </div>
      </section>
    </div>
  );
}
