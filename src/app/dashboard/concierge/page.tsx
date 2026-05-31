"use client";

import { useState } from "react";
import { PageHeader, Surface, Card, Avatar, Stars, Button, Icon, StatusPill, Verified } from "@/components/dashboard/ui";
import { useSheet } from "@/components/dashboard/sheet";
import { QuickProfileSheet } from "@/components/dashboard/sheets";
import { findCreative, money } from "@/lib/grid-data";
import { conciergePlan, CONCIERGE_EXAMPLES, type ConciergePlan } from "@/lib/clienthq";

export default function ConciergePage() {
  const { open } = useSheet();
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState<"idle" | "thinking" | "done">("idle");
  const [plan, setPlan] = useState<ConciergePlan | null>(null);

  function ask(text?: string) {
    const value = (text ?? prompt).trim();
    if (!value) return;
    if (text) setPrompt(text);
    setPhase("thinking");
    setTimeout(() => {
      setPlan(conciergePlan(value));
      setPhase("done");
    }, 1100);
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Client HQ" tone="green" title="Creative Concierge™" subtitle="Describe what you need. GRID assembles the plan and the team." />
      </div>

      {/* Concierge console */}
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <Surface radius="2rem" inner="p-6 sm:p-8">
          <div className="flex items-center gap-2.5 text-sm font-medium text-aerial-cyan">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-aerial-cyan/12 ring-1 ring-aerial-cyan/25">
              <Icon name="sparkles" size={16} />
            </span>
            GRID Concierge
          </div>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="e.g. We're opening a luxury restaurant and need launch content…"
            className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-base leading-relaxed text-white outline-none transition-colors placeholder:text-white/35 focus:border-client-green/50"
          />
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {CONCIERGE_EXAMPLES.map((ex) => (
              <button key={ex} onClick={() => ask(ex)} className="rounded-full bg-white/[0.05] px-3 py-1.5 text-xs text-white/55 transition-colors hover:text-white">
                {ex}
              </button>
            ))}
          </div>
          <div className="mt-5">
            <Button tone="green" arrow disabled={!prompt.trim() || phase === "thinking"} onClick={() => ask()}>
              {phase === "thinking" ? "Assembling your plan…" : "Ask GRID"}
            </Button>
          </div>
        </Surface>
      </div>

      {/* Result */}
      {phase === "done" && plan && (
        <div className="flex flex-col gap-5">
          <div className="rise grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            {/* Brief */}
            <Surface radius="2rem" inner="p-6">
              <div className="mb-2 flex items-center gap-2">
                <StatusPill tone="escrow">Project brief</StatusPill>
                <span className="text-sm font-semibold text-white">{plan.headline}</span>
              </div>
              <p className="text-sm leading-relaxed text-white/65">{plan.brief}</p>

              <div className="mt-5">
                <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/40">Suggested deliverables</div>
                <div className="flex flex-col gap-2">
                  {plan.deliverables.map((d) => (
                    <div key={d.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-sm text-white/85">
                        <Icon name="check" size={14} className="text-escrow-green" /> {d.label}
                      </span>
                      <span className="font-mono text-xs text-white/55">{d.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Surface>

            {/* Budget */}
            <Surface radius="2rem" inner="p-6">
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Suggested budget</div>
              <div className="mt-1 font-mono text-3xl font-semibold tracking-tight text-white">
                {money(plan.budgetLow)}<span className="text-white/35"> – {money(plan.budgetHigh)}</span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-client-green to-escrow-green" style={{ width: "72%" }} />
              </div>
              <p className="mt-2 text-xs text-white/45">Protected by Grid Escrow · released on approval.</p>
              <div className="mt-5">
                <Button full tone="green" arrow onClick={() => open(<QuickProfileSheet creative={findCreative(plan.creatorIds[0])!} />)}>
                  Build shortlist
                </Button>
              </div>
            </Surface>
          </div>

          {/* Recommended creators */}
          <div className="rise">
            <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-white/40">Recommended creators</div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plan.creatorIds.map((id) => {
                const c = findCreative(id);
                if (!c) return null;
                return (
                  <Card key={id} hover className="overflow-hidden">
                    <button type="button" onClick={() => open(<QuickProfileSheet creative={c} />)} className="block w-full p-5 text-left">
                      <div className="flex items-center gap-3">
                        <Avatar id={c.id} name={c.name} size={44} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate font-semibold text-white">{c.name}</span>
                            {c.verified && <Verified size={14} className="text-grid-blue" />}
                          </div>
                          <span className="block truncate text-xs text-white/50">{c.type} · {c.city}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
                        <Stars rating={c.rating} size={12} />
                        <span className="font-mono text-sm font-medium text-white">{money(c.rate)}/day</span>
                      </div>
                    </button>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
