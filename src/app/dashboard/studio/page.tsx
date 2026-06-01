"use client";

import { useEffect, useState, type ReactNode } from "react";
import { PageHeader, IconTile, Surface, Card, MediaTile, Button, Icon, SectionHeader } from "@/components/dashboard/ui";
import { useSheet, SheetHeader } from "@/components/dashboard/sheet";
import { STUDIO_TOOLS } from "@/lib/grid-data";
import type { IconName } from "@/components/dashboard/icons";
import {
  generate,
  loadCreations,
  saveCreations,
  relativeDate,
  TOOL_LABEL,
  SCRIPT_LENGTHS,
  SCRIPT_PACES,
  SCRIPT_MOODS,
  DEFAULT_SCRIPT_OPTIONS,
  MAX_ACTORS,
  type StudioCreation,
  type StudioSection,
  type StudioToolKey,
  type ScriptOptions,
} from "@/lib/studio";

/** Workflow chain: each tool offers to generate the next, so they work together. */
const NEXT_TOOL: Record<StudioToolKey, StudioToolKey | null> = {
  shotlist: "script",
  script: "moodboard",
  moodboard: "proposal",
  proposal: null,
};
const CHAIN_CTA: Record<StudioToolKey, string> = {
  shotlist: "Would you like a script with this?",
  script: "Add a matching mood board?",
  moodboard: "Turn this into a client proposal?",
  proposal: "",
};

const TOOL_ICONS: Record<string, IconName> = {
  shotlist: "list",
  script: "file",
  moodboard: "layout",
  proposal: "news",
};

/* -------------------------------------------------------------------------- */
/*  Shared renderer — turns a creation's sections into on-brand layout         */
/* -------------------------------------------------------------------------- */

function Sections({ sections }: { sections: StudioSection[] }) {
  return (
    <div className="flex flex-col gap-6">
      {sections.map(({ heading, block }) => (
        <div key={heading}>
          <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-ai-purple">{heading}</div>

          {block.type === "steps" && (
            <ol className="flex flex-col gap-2.5">
              {block.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ai-purple/12 text-xs font-semibold text-ai-purple ring-1 ring-ai-purple/25">
                    {i + 1}
                  </span>
                  <span className="text-sm leading-snug text-white/85">{item}</span>
                </li>
              ))}
            </ol>
          )}

          {block.type === "bullets" && (
            <ul className="flex flex-col gap-2">
              {block.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm leading-snug text-white/80">
                  <Icon name="check" size={15} className="mt-0.5 shrink-0 text-ai-purple" />
                  {item}
                </li>
              ))}
            </ul>
          )}

          {block.type === "paras" && (
            <div className="flex flex-col gap-3">
              {block.items.map((item, i) => (
                <p key={i} className="text-sm leading-relaxed text-white/75">
                  {item}
                </p>
              ))}
            </div>
          )}

          {block.type === "swatches" && (
            <div className="grid grid-cols-3 gap-2.5">
              {block.items.map((t) => (
                <MediaTile key={t.title} tile={t} label={t.title} ratio="1 / 1" />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Create flow — brief → generate → save                                      */
/* -------------------------------------------------------------------------- */

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${on ? "border-ai-purple/50 bg-ai-purple/[0.12] text-white" : "border-white/10 text-white/55 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

function CreateSheet({ tool, onSave }: { tool: StudioToolKey; onSave: (c: StudioCreation) => void }) {
  const { close } = useSheet();
  const [brief, setBrief] = useState("");
  const [opts, setOpts] = useState<ScriptOptions>(DEFAULT_SCRIPT_OPTIONS);
  const [result, setResult] = useState<StudioCreation | null>(null);

  if (result) {
    const next = NEXT_TOOL[result.tool];
    return (
      <div>
        <SheetHeader title={result.title} subtitle="Review your draft, then save it to Studio." />
        <Sections sections={result.sections} />
        <div className="mt-7 flex flex-col gap-2.5">
          {next && (
            <button
              type="button"
              onClick={() => {
                onSave(result); // keep this step, then chain into the next tool
                setResult(generate(next, result.brief, next === "script" ? { description: result.brief } : undefined));
              }}
              className="flex items-center justify-center gap-2 rounded-2xl border border-dashed border-ai-purple/40 bg-ai-purple/[0.06] py-3 text-sm font-medium text-ai-purple transition-colors hover:bg-ai-purple/[0.12]"
            >
              <Icon name="sparkles" size={15} /> {CHAIN_CTA[result.tool]}
            </button>
          )}
          <Button full tone="purple" arrow onClick={() => { onSave(result); close(); }}>
            Save to Studio
          </Button>
          <Button full variant="ghost" onClick={() => setResult(null)}>
            Back &amp; edit brief
          </Button>
        </div>
      </div>
    );
  }

  const isScript = tool === "script";
  return (
    <div>
      <SheetHeader
        title={TOOL_LABEL[tool]}
        subtitle={isScript ? "Set the brief and filters — Grid Studio writes the full script." : "Describe the project — Grid Studio drafts the rest."}
      />
      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">{isScript ? "Description" : "Brief"}</label>
      <textarea
        value={brief}
        onChange={(e) => setBrief(e.target.value)}
        rows={4}
        autoFocus
        placeholder={isScript ? "What's the film about? e.g. A spot for a new running shoe, city at dawn…" : "e.g. Cliffside villa listing film, golden hour, drone + interiors"}
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-ai-purple/50"
      />

      {isScript && (
        <div className="mt-5 flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Category</label>
            <div className="flex flex-wrap gap-2">
              {SCRIPT_MOODS.map((m) => (
                <Chip key={m.key} on={opts.mood === m.key} onClick={() => setOpts((o) => ({ ...o, mood: m.key }))}>{m.label}</Chip>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Length</label>
            <div className="flex flex-wrap gap-2">
              {SCRIPT_LENGTHS.map((l) => (
                <Chip key={l.key} on={opts.length === l.key} onClick={() => setOpts((o) => ({ ...o, length: l.key }))}>{l.label}</Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-4">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Pace</label>
              <div className="flex gap-2">
                {SCRIPT_PACES.map((p) => (
                  <Chip key={p.key} on={opts.pace === p.key} onClick={() => setOpts((o) => ({ ...o, pace: p.key }))}>{p.label}</Chip>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Actors</label>
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                <button type="button" onClick={() => setOpts((o) => ({ ...o, actors: Math.max(1, o.actors - 1) }))} aria-label="Fewer actors" className="text-white/55 transition-colors hover:text-white">
                  <Icon name="chevron" size={14} className="rotate-180" />
                </button>
                <span className="w-4 text-center font-mono text-sm text-white">{opts.actors}</span>
                <button type="button" onClick={() => setOpts((o) => ({ ...o, actors: Math.min(MAX_ACTORS, o.actors + 1) }))} aria-label="More actors" className="text-white/55 transition-colors hover:text-white">
                  <Icon name="chevron" size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <Button
          full
          tone="purple"
          arrow
          disabled={!brief.trim()}
          onClick={() => setResult(generate(tool, brief, isScript ? { ...opts, description: brief } : undefined))}
        >
          <Icon name="sparkles" size={15} /> Generate
        </Button>
      </div>
    </div>
  );
}

function ViewSheet({ creation, onDelete }: { creation: StudioCreation; onDelete: (id: string) => void }) {
  const { close } = useSheet();
  return (
    <div>
      <SheetHeader title={creation.title} subtitle={`${TOOL_LABEL[creation.tool]} · ${relativeDate(creation.createdAt)}`} />
      <Sections sections={creation.sections} />
      <div className="mt-7">
        <Button
          full
          variant="ghost"
          onClick={() => { onDelete(creation.id); close(); }}
          className="!text-urgent-red hover:!bg-urgent-red/10"
        >
          Delete creation
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function StudioPage() {
  const { open } = useSheet();
  const [creations, setCreations] = useState<StudioCreation[]>([]);

  // Load saved creations once on mount (localStorage is client-only).
  useEffect(() => setCreations(loadCreations()), []);

  function persist(next: StudioCreation[]) {
    setCreations(next);
    saveCreations(next);
  }
  const addCreation = (c: StudioCreation) => persist([c, ...creations]);
  const deleteCreation = (id: string) => persist(creations.filter((c) => c.id !== id));

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Grid Studio"
          tone="purple"
          title="Generate the boring parts."
          subtitle="AI tools for shot lists, scripts, mood boards and proposals — saved as projects you can reopen."
        />
      </div>

      {/* Tools */}
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STUDIO_TOOLS.map((tool) => (
            <IconTile
              key={tool.key}
              icon={TOOL_ICONS[tool.key] ?? "sparkles"}
              tone="purple"
              label={tool.label}
              desc={tool.desc}
              onClick={() => open(<CreateSheet tool={tool.key as StudioToolKey} onSave={addCreation} />)}
            />
          ))}
        </div>
      </div>

      {/* Saved creations */}
      <div className="rise" style={{ animationDelay: "120ms" }}>
        <SectionHeader title="Your creations" />
        {creations.length === 0 ? (
          <Surface radius="2rem" inner="p-10">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai-purple/12 text-ai-purple ring-1 ring-ai-purple/25">
                <Icon name="sparkles" size={22} />
              </span>
              <p className="mt-4 text-sm text-white/55">Pick a tool above to create your first draft. It’ll be saved here.</p>
            </div>
          </Surface>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {creations.map((c) => (
              <Card key={c.id} className="p-0">
                <button
                  type="button"
                  onClick={() => open(<ViewSheet creation={c} onDelete={deleteCreation} />)}
                  className="flex h-full w-full flex-col gap-3 rounded-[inherit] p-5 text-left transition-colors hover:bg-white/[0.04]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ai-purple/12 text-ai-purple ring-1 ring-ai-purple/25">
                    <Icon name={TOOL_ICONS[c.tool] ?? "sparkles"} size={19} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{c.title}</div>
                    <div className="mt-0.5 text-xs text-white/45">{TOOL_LABEL[c.tool]} · {relativeDate(c.createdAt)}</div>
                  </div>
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
