"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Surface, Card, Button, Icon, ACCENT } from "@/components/dashboard/ui";
import { CREW_ROLES } from "@/lib/grid-data";
import { generate as studioGenerate, loadCreations, saveCreations } from "@/lib/studio";
import {
  findCampaign,
  upsertCampaign,
  type SavedCampaign,
  type CampaignConcept,
  type TeamMember,
} from "@/lib/campaign";

/* ------------------------------ edit atoms ------------------------------- */

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white outline-none transition-colors placeholder:text-white/30 focus:border-ai-purple/50";

/** A bullet block that flips between read and edit. */
function Block({
  items,
  editing,
  numbered,
  tone,
  onChange,
}: {
  items: string[];
  editing: boolean;
  numbered?: boolean;
  tone: keyof typeof ACCENT;
  onChange: (next: string[]) => void;
}) {
  if (!editing) {
    return (
      <ul className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm leading-snug text-white/80">
            {numbered ? (
              <span className={`mt-px flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${ACCENT[tone].tint} ${ACCENT[tone].text}`}>{i + 1}</span>
            ) : (
              <Icon name="check" size={15} className={`mt-0.5 shrink-0 ${ACCENT[tone].text}`} />
            )}
            {item}
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={item} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} className={inputCls} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="shrink-0 text-white/30 hover:text-urgent-red" aria-label="Remove line">
            <Icon name="x" size={16} />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ""])} className="mt-1 inline-flex items-center gap-1.5 self-start rounded-full border border-white/12 px-3 py-1.5 text-xs text-white/60 hover:text-white">
        <Icon name="plus" size={14} /> Add line
      </button>
    </div>
  );
}

function Panel({ icon, title, children }: { icon: Parameters<typeof Icon>[0]["name"]; title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-white">
        <Icon name={icon} size={16} className="text-white/50" /> {title}
      </div>
      {children}
    </Card>
  );
}

/* --------------------------------- page ---------------------------------- */

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [campaign, setCampaign] = useState<SavedCampaign | null | undefined>(undefined);
  const [active, setActive] = useState(0);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // team add
  const [teamName, setTeamName] = useState("");
  const [teamRole, setTeamRole] = useState<string>(CREW_ROLES[0]);
  const [showTeam, setShowTeam] = useState(false);

  useEffect(() => setCampaign(findCampaign(id)), [id]);

  function note(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  function persist(next: SavedCampaign) {
    setCampaign(next);
    upsertCampaign(next);
  }

  if (campaign === undefined) {
    return <div className="flex min-h-[50vh] items-center justify-center text-white/40">Loading…</div>;
  }
  if (campaign === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">Campaign not found</h1>
          <div className="mt-6">
            <Button href="/dashboard/campaign" arrow>New campaign</Button>
          </div>
        </Card>
      </div>
    );
  }

  const concept = campaign.concepts[active];
  const tone = concept.accent;
  const a = ACCENT[tone];

  function patch(p: Partial<CampaignConcept>) {
    const concepts = campaign!.concepts.map((c, i) => (i === active ? { ...c, ...p } : c));
    persist({ ...campaign!, concepts });
  }

  function addTeam() {
    if (!teamName.trim()) return;
    const m: TeamMember = { id: `tm${Date.now().toString(36)}`, name: teamName.trim(), role: teamRole };
    persist({ ...campaign!, team: [...campaign!.team, m] });
    setTeamName("");
    setShowTeam(false);
    note(`${m.name} added to the team`);
  }

  function addToProjects() {
    persist({ ...campaign!, inProject: true });
    note("Added to Projects in Collab");
  }

  function openInStudio() {
    const creation = studioGenerate("moodboard", campaign!.brief.brand);
    saveCreations([creation, ...loadCreations().filter((c) => c.id !== creation.id)]);
    router.push("/dashboard/studio");
  }

  const b = campaign.brief;

  return (
    <div className="flex flex-col gap-8">
      {/* header */}
      <div className="rise">
        <Link href="/dashboard/campaign" className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white">
          <Icon name="chevron" size={15} className="rotate-180" /> All campaigns
        </Link>
        <span className={`inline-flex items-center rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] ring-1 ${a.text} ${a.ring}`}>Campaign</span>
        <h1 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">{b.brand}</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-white/45">
          <span className="rounded-full border border-white/10 px-3 py-1">Age {b.ageMin}–{b.ageMax}</span>
          <span className="rounded-full border border-white/10 px-3 py-1">€{b.budget.toLocaleString()}</span>
          <span className="rounded-full border border-white/10 px-3 py-1">{b.weeks} {b.weeks === 1 ? "week" : "weeks"}</span>
          {b.interests.map((i) => (
            <span key={i} className="rounded-full border border-white/10 px-3 py-1">{i}</span>
          ))}
        </div>
      </div>

      {/* concept tabs (segmented control) */}
      <div className="rise sticky top-[4.2rem] z-20 -mx-1 rounded-full" style={{ animationDelay: "60ms" }}>
        <div className="flex gap-1 rounded-full border border-white/10 bg-[#0a0b0e]/80 p-1 backdrop-blur-xl">
          {campaign.concepts.map((c, i) => {
            const sel = i === active;
            return (
              <button
                key={c.id}
                onClick={() => { setActive(i); setEditing(false); }}
                className={`flex-1 truncate rounded-full px-3 py-2 text-sm font-medium tracking-tight transition-colors ${sel ? `${ACCENT[c.accent].solid}` : "text-white/55 hover:text-white"}`}
              >
                <span className="hidden sm:inline">{c.name}</span>
                <span className="sm:hidden">{i + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* concept body */}
      <div key={concept.id} className="rise flex flex-col gap-5">
        {/* hero */}
        <Surface radius="2rem" inner="p-6 sm:p-8">
          {editing ? (
            <div className="flex flex-col gap-3">
              <input value={concept.name} onChange={(e) => patch({ name: e.target.value })} className={`${inputCls} text-lg font-semibold`} />
              <input value={concept.tagline} onChange={(e) => patch({ tagline: e.target.value })} className={inputCls} placeholder="Tagline" />
              <textarea value={concept.bigIdea} onChange={(e) => patch({ bigIdea: e.target.value })} rows={3} className={`${inputCls} resize-none`} />
            </div>
          ) : (
            <>
              <div className={`text-xs font-medium uppercase tracking-[0.18em] ${a.text}`}>{concept.tagline}</div>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">{concept.name}</h2>
              <p className="mt-4 text-pretty text-base leading-relaxed text-white/80">{concept.bigIdea}</p>
              <div className="mt-5 flex items-start gap-2.5 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                <Icon name="target" size={16} className={`mt-0.5 shrink-0 ${a.text}`} />
                <p className="text-sm leading-relaxed text-white/65">{concept.rationale}</p>
              </div>
            </>
          )}
        </Surface>

        {/* inspired by */}
        <div>
          <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Inspired by proven campaigns</div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {concept.references.map((r) => (
              <Card key={r.name} className="flex gap-3 p-4">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${a.tint} ${a.text}`}>{r.name.slice(0, 2)}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{r.name}</span>
                    <span className="truncate text-[11px] text-white/40">{r.platform} · {r.handle}</span>
                  </div>
                  <p className="mt-1 text-xs leading-snug text-white/60">{r.takeaway}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* styles */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Panel icon="video" title="Video style">
            <Block items={concept.videoStyle} editing={editing} tone={tone} onChange={(v) => patch({ videoStyle: v })} />
          </Panel>
          <Panel icon="camera" title="Photo style">
            <Block items={concept.photoStyle} editing={editing} tone={tone} onChange={(v) => patch({ photoStyle: v })} />
          </Panel>
        </div>

        {/* formats */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Panel icon="play" title="Short form">
            <Block items={concept.shortForm} editing={editing} tone={tone} onChange={(v) => patch({ shortForm: v })} />
          </Panel>
          <Panel icon="news" title="Long form">
            <Block items={concept.longForm} editing={editing} tone={tone} onChange={(v) => patch({ longForm: v })} />
          </Panel>
        </div>

        {/* strategy */}
        <Panel icon="sparkles" title="Genius marketing strategy">
          <Block items={concept.strategy} editing={editing} numbered tone={tone} onChange={(v) => patch({ strategy: v })} />
        </Panel>

        {/* channels + budget + timeline */}
        <div className="grid gap-3 lg:grid-cols-3">
          <Panel icon="send" title="Channels">
            <div className="flex flex-wrap gap-2">
              {concept.channels.map((c) => (
                <span key={c} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/70">{c}</span>
              ))}
            </div>
          </Panel>
          <Panel icon="wallet" title="Budget split">
            <div className="flex flex-col gap-2.5">
              {concept.budgetSplit.map((s) => (
                <div key={s.label}>
                  <div className="mb-1 flex justify-between text-xs text-white/65">
                    <span>{s.label}</span>
                    <span className="text-white/45">€{Math.round((b.budget * s.pct) / 100).toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className={`h-full rounded-full ${a.dot}`} style={{ width: `${s.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Panel>
          <Panel icon="calendar" title="Timeline">
            <ol className="flex flex-col gap-2.5">
              {concept.timeline.map((t) => (
                <li key={t.week} className="flex gap-3 text-sm">
                  <span className={`w-20 shrink-0 font-mono text-xs ${a.text}`}>{t.week}</span>
                  <span className="text-white/75">{t.focus}</span>
                </li>
              ))}
            </ol>
          </Panel>
        </div>
      </div>

      {/* team */}
      {campaign.team.length > 0 && (
        <div className="rise">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">Team</div>
          <div className="flex flex-wrap gap-2">
            {campaign.team.map((m) => (
              <span key={m.id} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pl-2 pr-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-[10px] font-semibold text-white">{m.name.slice(0, 1).toUpperCase()}</span>
                <span className="text-xs text-white">{m.name}</span>
                <span className="text-[11px] text-white/40">{m.role}</span>
                <button onClick={() => persist({ ...campaign, team: campaign.team.filter((x) => x.id !== m.id) })} className="text-white/30 hover:text-urgent-red" aria-label="Remove">
                  <Icon name="x" size={13} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* inline add-team */}
      {showTeam && (
        <Card className="rise flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <input autoFocus value={teamName} onChange={(e) => setTeamName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTeam()} placeholder="Teammate name" className={`${inputCls} sm:flex-1`} />
          <select value={teamRole} onChange={(e) => setTeamRole(e.target.value)} className={`${inputCls} sm:w-44`}>
            {CREW_ROLES.map((r) => (
              <option key={r} value={r} className="bg-[#101114]">{r}</option>
            ))}
          </select>
          <Button tone="purple" onClick={addTeam}>Add</Button>
        </Card>
      )}

      {/* action bar */}
      <div className="rise sticky bottom-4 z-20">
        <div className="mx-auto flex max-w-xl flex-wrap items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#0a0b0e]/85 p-2 backdrop-blur-xl">
          <Action icon={editing ? "check" : "file"} label={editing ? "Done" : "Customize"} active={editing} onClick={() => setEditing((v) => !v)} />
          <Action icon="users" label="Team" onClick={() => setShowTeam((v) => !v)} />
          <Action icon="kanban" label={campaign.inProject ? "In Projects" : "Add to Projects"} active={campaign.inProject} onClick={addToProjects} />
          <Action icon="sparkles" label="AI Studio" onClick={openInStudio} />
        </div>
      </div>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full border border-escrow-green/30 bg-escrow-green/15 px-5 py-2.5 text-sm font-medium text-escrow-green backdrop-blur-md">
          {toast}
        </div>
      )}
    </div>
  );
}

function Action({ icon, label, onClick, active }: { icon: Parameters<typeof Icon>[0]["name"]; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
        active ? "bg-ai-purple/15 text-ai-purple" : "text-white/65 hover:bg-white/[0.06] hover:text-white"
      }`}
    >
      <Icon name={icon} size={17} /> <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
