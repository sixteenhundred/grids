"use client";

import { useState } from "react";
import { CREW, COLLAB_PROJECT, type CrewMember } from "@/lib/grid-data";
import { PageHeader, Surface, Card, Avatar, Progress, StatusPill, Button } from "@/components/dashboard/ui";
import { Icon } from "@/components/dashboard/icons";
import { useSheet } from "@/components/dashboard/sheet";
import { AddCrewSheet, ManageCrewSheet } from "@/components/dashboard/sheets";

export default function CollabPage() {
  const { open } = useSheet();
  const [crew, setCrew] = useState<CrewMember[]>(CREW);

  const total = crew.reduce((a, c) => a + c.pay, 0);
  const lead = Math.max(0, 100 - total);

  const addMember = (m: CrewMember) => setCrew((prev) => [...prev, m]);
  const updateMember = (m: CrewMember) => setCrew((prev) => prev.map((c) => (c.id === m.id ? m : c)));
  const removeMember = (id: string) => setCrew((prev) => prev.filter((c) => c.id !== id));

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Grid Collab"
          tone="blue"
          title="Build a production team."
          subtitle="Named roles and revenue share — no extra accounts needed."
        />
      </div>

      <div className="rise" style={{ animationDelay: "60ms" }}>
        <Surface radius="2rem" inner="p-6">
          <span className="text-xs uppercase tracking-[0.14em] text-white/45">Project</span>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-white">{COLLAB_PROJECT}</h2>

          <div className="mt-6 flex flex-col gap-3">
            {/* You (lead) */}
            <div className="flex items-center gap-3 rounded-2xl border border-grid-blue/30 bg-grid-blue/[0.06] p-4">
              <Avatar name="You" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">You</div>
                <div className="text-sm text-white/55">Lead</div>
              </div>
              <div className="ml-auto">
                <StatusPill tone="blue">{lead}%</StatusPill>
              </div>
            </div>

            {/* Crew — tap a member to manage role & split */}
            {crew.map((c) => (
              <Card key={c.id} className="p-0">
                <button
                  type="button"
                  onClick={() =>
                    open(
                      <ManageCrewSheet
                        member={c}
                        available={lead + c.pay}
                        onUpdate={updateMember}
                        onRemove={removeMember}
                      />,
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-[inherit] p-4 text-left transition-colors hover:bg-white/[0.03]"
                >
                  <Avatar id={undefined} name={c.name} />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white">{c.name}</div>
                    <div className="text-sm text-white/55">{c.role}</div>
                  </div>
                  <span className="ml-auto flex items-center gap-2">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/65">
                      {c.pay}%
                    </span>
                    <Icon name="chevron" size={16} className="text-white/35" />
                  </span>
                </button>
              </Card>
            ))}
          </div>

          {/* Revenue split */}
          <div className="mt-7">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-aerial-cyan">You {lead}%</span>
              <span className="text-white/55">Crew {total}%</span>
            </div>
            <Progress value={lead} tone="blue" />
          </div>

          <div className="mt-6">
            <Button variant="ghost" onClick={() => open(<AddCrewSheet available={lead} onAdd={addMember} />)}>
              + Add crew
            </Button>
          </div>
        </Surface>
      </div>
    </div>
  );
}
