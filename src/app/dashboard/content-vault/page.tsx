"use client";

import { useMemo, useState } from "react";
import { PageHeader, Card, MediaTile, Icon } from "@/components/dashboard/ui";
import type { IconName } from "@/components/dashboard/icons";
import { ASSETS, ASSET_FILTERS, isMediaAsset, type Asset, type AssetType } from "@/lib/clienthq";

const TYPE_ICON: Record<AssetType, IconName> = {
  Photo: "camera",
  Video: "video",
  Reel: "play",
  Logo: "layout",
  Brand: "sparkles",
  Contract: "file",
  Invoice: "wallet",
  Project: "folder",
};

function AssetPreview({ a, small = false }: { a: Asset; small?: boolean }) {
  if (isMediaAsset(a.type)) {
    return (
      <MediaTile tile={a.tile} ratio={small ? undefined : "4 / 3"} rounded={small ? "rounded-xl" : "rounded-t-3xl"} className={small ? "h-14 w-14 shrink-0" : ""}>
        <span className="absolute left-2 top-2">
          <span className="rounded-md bg-black/50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/80">{a.type}</span>
        </span>
      </MediaTile>
    );
  }
  return (
    <div
      className={`flex items-center justify-center ${small ? "h-14 w-14 shrink-0 rounded-xl" : "aspect-[4/3] rounded-t-3xl"}`}
      style={{ backgroundImage: `linear-gradient(140deg, ${a.tile.from}, ${a.tile.to})` }}
    >
      <Icon name={TYPE_ICON[a.type]} size={small ? 20 : 28} className="text-white/80" />
    </div>
  );
}

export default function ContentVaultPage() {
  const [filter, setFilter] = useState<"All" | AssetType>("All");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "timeline">("grid");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ASSETS.filter((a) => {
      const mt = filter === "All" || a.type === filter;
      const mq = !q || a.name.toLowerCase().includes(q) || a.project.toLowerCase().includes(q);
      return mt && mq;
    });
  }, [filter, query]);

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Client HQ" tone="cyan" title="Content Vault™" subtitle="Every asset, contract and project — permanently yours." />
      </div>

      {/* Controls */}
      <div className="rise flex flex-col gap-4" style={{ animationDelay: "60ms" }}>
        <div className="flex gap-2">
          <label className="relative block flex-1">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45"><Icon name="search" size={17} /></span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search assets & projects…"
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-white/20"
            />
          </label>
          <div className="flex shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            {(["grid", "timeline"] as const).map((v) => (
              <button key={v} onClick={() => setView(v)} className={`rounded-xl px-3 py-1.5 text-sm capitalize transition-colors ${view === v ? "bg-white/12 text-white" : "text-white/50 hover:text-white"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["All", ...ASSET_FILTERS] as ("All" | AssetType)[]).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${filter === f ? "bg-white/15 text-white" : "bg-white/[0.05] text-white/55 hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="rise" style={{ animationDelay: "120ms" }}>
        <p className="mb-4 text-sm text-white/45">{results.length} {results.length === 1 ? "asset" : "assets"}</p>

        {view === "grid" ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((a) => (
              <Card key={a.id} hover className="overflow-hidden">
                <AssetPreview a={a} />
                <div className="p-3">
                  <div className="truncate text-sm font-medium text-white">{a.name}</div>
                  <div className="mt-0.5 flex items-center justify-between text-[11px] text-white/40">
                    <span className="truncate">{a.project}</span>
                    <span className="shrink-0 font-mono">{a.size}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="relative ml-1 border-l border-white/10 pl-5">
            {results.map((a) => (
              <div key={a.id} className="relative pb-4 last:pb-0">
                <span className="absolute -left-[1.47rem] top-3 h-2.5 w-2.5 rounded-full bg-aerial-cyan ring-4 ring-[#0a0b0e]" />
                <Card className="flex items-center gap-3 p-3">
                  <AssetPreview a={a} small />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{a.name}</div>
                    <div className="truncate text-xs text-white/45">{a.type} · {a.project}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-white/50">{a.date}</div>
                    <div className="font-mono text-[11px] text-white/35">{a.size}</div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
