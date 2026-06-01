"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Surface, Button, Icon } from "@/components/dashboard/ui";
import { useSheet } from "@/components/dashboard/sheet";
import { PostJobSheet } from "@/components/dashboard/sheets";
import { GOALS, buildFor, money, type Deliverable } from "@/lib/clienthq";

export default function ProjectBuilderPage() {
  const router = useRouter();
  const { open } = useSheet();
  const [goal, setGoal] = useState<string | null>(null);
  const [items, setItems] = useState<Deliverable[]>([]);

  function pick(id: string) {
    setGoal(id);
    setItems(buildFor(id));
  }
  function setQty(id: string, qty: number) {
    setItems((prev) => prev.map((d) => (d.id === id ? { ...d, qty: Math.max(0, qty) } : d)));
  }

  const total = items.reduce((a, d) => a + d.qty * d.unit, 0);
  const active = items.filter((d) => d.qty > 0).length;

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Client HQ" tone="green" title="AI Project Builder™" subtitle="Tell GRID your goal — get a complete, costed scope." />
      </div>

      {/* Goal picker */}
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-white/40">What&apos;s your goal?</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {GOALS.map((g) => {
            const on = goal === g.id;
            return (
              <button
                key={g.id}
                onClick={() => pick(g.id)}
                className={`glass glass-hover rounded-2xl border p-4 text-left ${on ? "border-client-green/50 bg-client-green/[0.08]" : "border-white/10"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-white">{g.label}</span>
                  {on && <Icon name="check" size={16} className="text-escrow-green" />}
                </div>
                <p className="mt-1 text-xs leading-snug text-white/45">{g.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generated scope */}
      {items.length > 0 ? (
        <>
          <div className="rise grid gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ animationDelay: "120ms" }}>
            {items.map((d) => (
              <Surface key={d.id} radius="1.5rem" inner="p-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-client-green/12 text-escrow-green ring-1 ring-client-green/25">
                    <Icon name={d.icon} size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">{d.label}</div>
                    <div className="font-mono text-xs text-white/45">{money(d.unit)} each</div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(d.id, d.qty - 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition-colors hover:bg-white/12">−</button>
                    <span className="w-8 text-center font-mono text-sm font-semibold text-white">{d.qty}</span>
                    <button onClick={() => setQty(d.id, d.qty + 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] text-white/70 transition-colors hover:bg-white/12">+</button>
                  </div>
                  <span className="font-mono text-sm font-semibold text-white">{money(d.qty * d.unit)}</span>
                </div>
              </Surface>
            ))}
          </div>

          {/* Scope summary */}
          <div className="rise" style={{ animationDelay: "180ms" }}>
            <Surface radius="2rem" inner="p-6">
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">Total project scope</div>
                  <div className="mt-1 font-mono text-3xl font-semibold tracking-tight text-white">{money(total)}</div>
                  <div className="mt-1 text-sm text-white/45">{active} deliverable types · protected by Grid Escrow</div>
                </div>
                <div className="flex gap-2.5">
                  <Button variant="ghost" onClick={() => router.push("/dashboard/browse")}>Find creators</Button>
                  <Button tone="green" arrow onClick={() => open(<PostJobSheet />)}>Post as job</Button>
                </div>
              </div>
            </Surface>
          </div>
        </>
      ) : (
        <div className="rise" style={{ animationDelay: "120ms" }}>
          <Surface radius="2rem" inner="p-10">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-client-green/12 text-escrow-green ring-1 ring-client-green/25">
                <Icon name="layout" size={22} />
              </span>
              <p className="mt-4 text-sm text-white/55">Pick a goal above and GRID will build the deliverables and budget for you.</p>
            </div>
          </Surface>
        </div>
      )}
    </div>
  );
}
