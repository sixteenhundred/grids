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
import { CONCIERGE_MATCHES, JOB_CATEGORIES } from "@/lib/client/mock";
import { CLIENT_KEYS } from "@/lib/client/config";

/* -------------------------------------------------------------------------- */
/*  Types                                                                      */
/* -------------------------------------------------------------------------- */

type Urgency = "Flexible" | "Standard" | "Priority" | "Urgent";
type Experience = "Any" | "Rising talent" | "Established" | "Elite / award-winning";

type ConciergeForm = {
  goal: string;
  budget: string;
  location: string;
  timeline: string;
  creativeType: string;
  style: string;
  urgency: Urgency;
  experience: Experience;
};

type SavedRequest = ConciergeForm & {
  id: string;
  savedLabel: string;
};

type Match = (typeof CONCIERGE_MATCHES)[number];

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const URGENCY_OPTIONS: Urgency[] = ["Flexible", "Standard", "Priority", "Urgent"];
const EXPERIENCE_OPTIONS: Experience[] = ["Any", "Rising talent", "Established", "Elite / award-winning"];

const TIMELINE_OPTIONS = ["Within 1 week", "2–4 weeks", "1–2 months", "Ongoing retainer"];
const STYLE_OPTIONS = ["Cinematic & moody", "Bright & editorial", "Natural & documentary", "Bold & graphic", "Warm & lifestyle"];

const URGENCY_TONE: Record<Urgency, "gray" | "blue" | "gold" | "red"> = {
  Flexible: "gray",
  Standard: "blue",
  Priority: "gold",
  Urgent: "red",
};

const EMPTY_FORM: ConciergeForm = {
  goal: "",
  budget: "$5,000",
  location: "Oslo, Norway",
  timeline: TIMELINE_OPTIONS[1],
  creativeType: JOB_CATEGORIES[0],
  style: STYLE_OPTIONS[0],
  urgency: "Standard",
  experience: "Established",
};

/* -------------------------------------------------------------------------- */
/*  Small field helpers (co-located)                                           */
/* -------------------------------------------------------------------------- */

const fieldLabel = "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-white/45";
const fieldBox =
  "w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-grid-blue/50 focus:bg-white/[0.05]";

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className={fieldLabel}>{label}</span>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={fieldBox}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className={fieldLabel}>{label}</span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${fieldBox} cursor-pointer appearance-none pr-10`}
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-[#0c1117] text-white">
              {o}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">
          <Icon name="chevron" size={16} />
        </span>
      </div>
    </label>
  );
}

/* -------------------------------------------------------------------------- */
/*  Match card                                                                 */
/* -------------------------------------------------------------------------- */

function MatchCard({ match, onContact }: { match: Match; onContact: () => void }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition-colors hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-grid-blue/15 text-aerial-cyan ring-1 ring-grid-blue/25">
            <Icon name="user" size={20} />
          </span>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold tracking-tight text-white">{match.name}</h4>
            <p className="mt-0.5 line-clamp-1 text-xs text-white/50">{match.type}</p>
          </div>
        </div>
        <span className="flex shrink-0 flex-col items-end">
          <span className="text-lg font-semibold tracking-tight text-escrow-green">{match.score}</span>
          <span className="text-[10px] uppercase tracking-wider text-white/35">match</span>
        </span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65">
          <Icon name="pin" size={12} className="text-aerial-cyan" /> {match.city}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/65">
          <Icon name="wallet" size={12} className="text-escrow-green" /> {match.rate}
        </span>
      </div>

      <div className="mt-5 flex-1" />
      <Button tone="blue" full onClick={onContact}>
        <Icon name="mail" size={15} /> Contact Recommended Creative
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Output summary tile                                                        */
/* -------------------------------------------------------------------------- */

function SummaryTile({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: IconName;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] ${iconColor}`}>
          <Icon name={icon} size={15} />
        </span>
        <span className="text-[11px] uppercase tracking-[0.14em] text-white/45">{label}</span>
      </div>
      <p className="mt-2.5 text-sm font-medium leading-snug text-white/85">{value}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CreativeConciergePage() {
  const { company, toast } = useClient();
  const [saved, setSaved] = useLocalState<SavedRequest[]>(CLIENT_KEYS.concierge, []);

  const [form, setForm] = useState<ConciergeForm>(EMPTY_FORM);
  const [submitted, setSubmitted] = useState<ConciergeForm | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);

  function update<K extends keyof ConciergeForm>(key: K, value: ConciergeForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function submitRequest() {
    const entry: SavedRequest = {
      ...form,
      id: crypto.randomUUID(),
      savedLabel: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
    setSaved((prev) => [entry, ...prev]);
    setSubmitted(form);
    toast("Request submitted");
  }

  function generateMatches() {
    setMatches(CONCIERGE_MATCHES);
    if (!submitted) setSubmitted(form);
    toast("Matches generated");
  }

  function saveRequest() {
    const entry: SavedRequest = {
      ...form,
      id: crypto.randomUUID(),
      savedLabel: new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    };
    setSaved((prev) => [entry, ...prev]);
    toast("Saved");
  }

  function removeSaved(id: string) {
    setSaved((prev) => prev.filter((s) => s.id !== id));
    toast("Removed");
  }

  function loadSaved(req: SavedRequest) {
    setForm({
      goal: req.goal,
      budget: req.budget,
      location: req.location,
      timeline: req.timeline,
      creativeType: req.creativeType,
      style: req.style,
      urgency: req.urgency,
      experience: req.experience,
    });
    toast("Loaded into form");
  }

  // Derived recommendation text (computed from the submitted form — no time/random).
  const active = submitted ?? form;
  const goalText = active.goal.trim() || `${active.creativeType.toLowerCase()} production for ${company.name}`;
  const suggestedStructure = `Milestone-based project: discovery & moodboard → ${active.creativeType.toLowerCase()} shoot → first edit → revisions → final delivery. Best run as a single funded project with staged escrow releases.`;
  const suggestedBudget = `${active.budget} total — split ~30% on booking, ~40% on shoot completion, ~30% on final delivery.`;
  const suggestedTimeline = `${active.timeline}${active.urgency === "Urgent" ? " — prioritised; concierge will expedite outreach today." : active.urgency === "Priority" ? " — fast-tracked shortlisting." : "."}`;
  const nextStep =
    active.urgency === "Urgent" || active.urgency === "Priority"
      ? `Contact the top match now and open a funded project in ${active.location}. The concierge team will line up a backup creative in parallel.`
      : `Review the matches below, contact your favourite, then convert the brief into a funded project in ${active.location} when you are ready.`;

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <header className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-escrow-green">
            <Icon name="sparkles" size={12} /> Concierge
          </span>
          <FeatureTag feature="creative-concierge" />
          <DemoModeNotice className="hidden sm:inline-flex" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Creative Concierge</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
            Tell us what you need and our concierge matches{" "}
            <span className="text-white/80">{company.name}</span> with the right creatives, a suggested project
            structure and budget split. This is a demo — every match is illustrative.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <MetricCard label="Match pool" value={String(CONCIERGE_MATCHES.length)} sub="curated creatives" icon="users" accent="text-aerial-cyan" />
          <MetricCard label="Avg. response" value={company.responseTime} icon="clock" accent="text-escrow-green" />
          <MetricCard label="Matches shown" value={String(matches.length)} sub="this session" icon="target" accent="text-aerial-cyan" />
          <MetricCard label="Saved requests" value={String(saved.length)} icon="bookmark" accent="text-review-gold" />
        </div>
      </header>

      {/* Request form */}
      <section>
        <SectionTitle
          title="Concierge request"
          subtitle="Describe the brief. Submit it to log the request, then generate matched creatives."
        />
        <Panel>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block">
                <span className={fieldLabel}>Project goal</span>
                <textarea
                  value={form.goal}
                  onChange={(e) => update("goal", e.target.value)}
                  placeholder="e.g. Launch our new flagship suite with a cinematic film and a set of editorial stills."
                  rows={3}
                  className={`${fieldBox} resize-none`}
                />
              </label>
            </div>

            <TextField label="Budget" value={form.budget} onChange={(v) => update("budget", v)} placeholder="$5,000" />
            <TextField label="Location" value={form.location} onChange={(v) => update("location", v)} placeholder="Oslo, Norway" />

            <SelectField label="Creative type needed" value={form.creativeType} onChange={(v) => update("creativeType", v)} options={JOB_CATEGORIES} />
            <SelectField label="Timeline" value={form.timeline} onChange={(v) => update("timeline", v)} options={TIMELINE_OPTIONS} />

            <SelectField label="Style preference" value={form.style} onChange={(v) => update("style", v)} options={STYLE_OPTIONS} />
            <SelectField
              label="Urgency level"
              value={form.urgency}
              onChange={(v) => update("urgency", v as Urgency)}
              options={URGENCY_OPTIONS}
            />

            <SelectField
              label="Preferred experience level"
              value={form.experience}
              onChange={(v) => update("experience", v as Experience)}
              options={EXPERIENCE_OPTIONS}
            />
            <div className="flex items-end">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] uppercase tracking-[0.14em] text-white/40">Urgency</span>
                <StatusBadge label={form.urgency} tone={URGENCY_TONE[form.urgency]} />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button tone="green" onClick={submitRequest}>
              <Icon name="send" size={15} /> Submit Concierge Request
            </Button>
            <Button tone="blue" variant="dark" onClick={generateMatches}>
              <Icon name="sparkles" size={15} /> Generate Matches
            </Button>
            <Button tone="white" variant="ghost" onClick={saveRequest}>
              <Icon name="bookmark" size={15} /> Save Request
            </Button>
          </div>
        </Panel>
      </section>

      {/* Output — only after a request is submitted */}
      {submitted && (
        <section className="flex flex-col gap-6">
          <SectionTitle
            title="Your concierge plan"
            subtitle={`Tailored to "${goalText}".`}
            action={<StatusBadge label={`${submitted.urgency} priority`} tone={URGENCY_TONE[submitted.urgency]} />}
          />

          {/* Suggested structure / budget / timeline / next step */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryTile icon="kanban" iconColor="text-aerial-cyan" label="Suggested structure" value={suggestedStructure} />
            <SummaryTile icon="wallet" iconColor="text-escrow-green" label="Suggested budget" value={suggestedBudget} />
            <SummaryTile icon="calendar" iconColor="text-review-gold" label="Suggested timeline" value={suggestedTimeline} />
            <SummaryTile icon="target" iconColor="text-aerial-cyan" label="Next step" value={nextStep} />
          </div>

          {/* Matches */}
          <div>
            <SectionTitle
              title="Recommended creatives"
              subtitle={
                matches.length > 0
                  ? `${matches.length} matches for ${submitted.creativeType.toLowerCase()} in ${submitted.location}.`
                  : "Generate matches to see recommended creatives for this brief."
              }
              action={
                matches.length === 0 ? (
                  <Button tone="blue" onClick={generateMatches}>
                    <Icon name="sparkles" size={15} /> Generate Matches
                  </Button>
                ) : undefined
              }
            />
            {matches.length === 0 ? (
              <Panel className="flex flex-col items-center justify-center px-6 py-14 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grid-blue/15 text-aerial-cyan ring-1 ring-grid-blue/25">
                  <Icon name="users" size={22} />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-white">No matches yet</h3>
                <p className="mt-1.5 max-w-sm text-sm text-white/50">
                  Hit <span className="text-white/75">Generate Matches</span> to surface curated creatives for this request.
                </p>
              </Panel>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {matches.map((m) => (
                  <MatchCard key={m.name} match={m} onContact={() => toast(`Message sent to ${m.name}`)} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Saved requests */}
      <section>
        <SectionTitle title="Saved requests" subtitle="Submitted and saved briefs, kept for your team." />
        <Panel>
          {saved.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-2 py-10 text-center">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-review-gold">
                <Icon name="bookmark" size={19} />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-white">No saved requests yet</h3>
              <p className="mt-1.5 max-w-sm text-sm text-white/50">
                Submit or save a concierge request above and it will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[44rem] border-separate border-spacing-y-2 text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-white/35">
                    <th className="px-3 font-medium">Brief</th>
                    <th className="px-3 font-medium">Type</th>
                    <th className="px-3 font-medium">Budget</th>
                    <th className="px-3 font-medium">Timeline</th>
                    <th className="px-3 font-medium">Urgency</th>
                    <th className="px-3 font-medium">Saved</th>
                    <th className="px-3" />
                  </tr>
                </thead>
                <tbody>
                  {saved.map((s) => (
                    <tr key={s.id} className="bg-white/[0.03]">
                      <td className="max-w-[16rem] rounded-l-2xl px-3 py-3">
                        <span className="block truncate font-medium text-white">
                          {s.goal.trim() || `${s.creativeType} brief`}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-white/45">
                          {s.location} • {s.style}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-white/70">{s.creativeType}</td>
                      <td className="px-3 py-3 font-medium text-escrow-green">{s.budget}</td>
                      <td className="px-3 py-3 text-white/65">{s.timeline}</td>
                      <td className="px-3 py-3">
                        <StatusBadge label={s.urgency} tone={URGENCY_TONE[s.urgency]} />
                      </td>
                      <td className="px-3 py-3 text-xs text-white/45">{s.savedLabel}</td>
                      <td className="rounded-r-2xl px-3 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => loadSaved(s)}
                            aria-label="Load request into form"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.06] hover:text-aerial-cyan"
                          >
                            <Icon name="upload" size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSaved(s.id)}
                            aria-label="Remove saved request"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 transition-colors hover:bg-white/[0.06] hover:text-urgent-red"
                          >
                            <Icon name="x" size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}
