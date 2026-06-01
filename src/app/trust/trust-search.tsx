"use client";

import { useState } from "react";
import Link from "next/link";
import { searchTrust, trustCategory } from "@/lib/trust";
import { Icon } from "@/components/dashboard/icons";

export function TrustSearch() {
  const [q, setQ] = useState("");
  const results = searchTrust(q);
  return (
    <div className="relative">
      <div className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3">
        <Icon name="search" size={18} className="text-white/40" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search policies, privacy, payments, AI…"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35"
        />
      </div>
      {q.trim() && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-soft-black/95 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-white/45">No matches for “{q}”.</div>
          ) : (
            results.map((d) => (
              <Link
                key={d.path}
                href={`/trust/${d.path}`}
                className="flex items-center justify-between gap-3 border-b border-white/6 px-4 py-3 last:border-0 transition-colors hover:bg-white/[0.05]"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white">{d.title}</div>
                  <div className="truncate text-xs text-white/45">{d.summary}</div>
                </div>
                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-white/40">
                  {trustCategory(d.category)?.title}
                </span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
