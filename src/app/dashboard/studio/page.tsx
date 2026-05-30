"use client";

import { PageHeader, IconTile, Surface, Icon } from "@/components/dashboard/ui";
import { STUDIO_TOOLS } from "@/lib/grid-data";
import type { IconName } from "@/components/dashboard/icons";

const TOOL_ICONS: Record<string, IconName> = {
  shotlist: "list",
  script: "file",
  moodboard: "layout",
  proposal: "news",
};

const SAMPLE_SHOTS = [
  "Exterior establishing — drone orbit at golden hour",
  "Entry & foyer — wide, natural light",
  "Kitchen — counters at eye level",
  "Primary suite — window light",
  "Twilight hero — front elevation",
];

export default function StudioPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Grid Studio"
          tone="purple"
          title="Generate the boring parts."
          subtitle="AI tools for shot lists, scripts, mood boards and proposals."
        />
      </div>

      <div className="rise" style={{ animationDelay: "60ms" }}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STUDIO_TOOLS.map((tool) => (
            <IconTile
              key={tool.key}
              icon={TOOL_ICONS[tool.key] ?? "sparkles"}
              tone="purple"
              label={tool.label}
              desc={tool.desc}
              onClick={() => {}}
            />
          ))}
        </div>
      </div>

      <div className="rise" style={{ animationDelay: "120ms" }}>
        <Surface radius="2rem" inner="p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ai-purple/12 text-ai-purple ring-1 ring-ai-purple/25">
              <Icon name="sparkles" size={21} />
            </span>
            <div>
              <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ai-purple">
                Sample output
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-white">
                Shot list · Cliffside villa
              </h2>
            </div>
          </div>

          <ol className="mt-6 flex flex-col gap-2.5">
            {SAMPLE_SHOTS.map((shot, i) => (
              <li
                key={shot}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ai-purple/12 text-xs font-semibold text-ai-purple ring-1 ring-ai-purple/25">
                  {i + 1}
                </span>
                <span className="text-sm leading-snug text-white/85">{shot}</span>
              </li>
            ))}
          </ol>
        </Surface>
      </div>
    </div>
  );
}
