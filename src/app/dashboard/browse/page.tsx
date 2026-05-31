"use client";

import { useMemo, useState } from "react";
import { useRole } from "@/components/dashboard/role-context";
import { PageHeader, Icon } from "@/components/dashboard/ui";
import { CreativeCard } from "@/components/dashboard/cards";
import { CREATIVES, type Category } from "@/lib/grid-data";

type Filter = "All" | "Photo" | "Video" | "Drone";

const FILTERS: Filter[] = ["All", "Photo", "Video", "Drone"];

const BUDGET_MIN = 2000;
const BUDGET_MAX = 5000;
const BUDGET_STEP = 100;
const budgetLabel = (n: number) => `€${n.toLocaleString()}`;

export default function BrowsePage() {
  const { role } = useRole();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter>("All");
  const [maxBudget, setMaxBudget] = useState(BUDGET_MAX);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CREATIVES.filter((c) => {
      const matchesCat = category === "All" || c.cat === (category as Category);
      const matchesBudget = c.rate <= maxBudget;
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q);
      return matchesCat && matchesBudget && matchesQuery;
    });
  }, [query, category, maxBudget]);

  const sliderAccent = role === "client" ? "accent-client-green" : "accent-grid-blue";

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader
          eyebrow="Verified talent"
          tone={role === "client" ? "green" : "blue"}
          title={role === "client" ? "Hire creatives" : "Browse"}
          subtitle={role === "client" ? "Search, filter, find your match." : "Find your next collaborator."}
        />
      </div>

      {/* Search + filters */}
      <div className="rise flex flex-col gap-4" style={{ animationDelay: "60ms" }}>
        <label className="relative block">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/45">
            <Icon name="search" size={18} />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, specialty or city…"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/40 outline-none transition-colors focus:border-white/20"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = category === f;
            return (
              <button
                key={f}
                onClick={() => setCategory(f)}
                className={`rounded-full px-4 py-2 text-sm font-medium tracking-tight transition-colors duration-300 ${
                  active ? "bg-white/15 text-white" : "bg-white/[0.05] text-white/60 hover:text-white/80"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>

        {/* Budget slider */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.14em] text-white/45">Max day rate</span>
            <span className="font-mono text-sm font-semibold text-white">
              {maxBudget >= BUDGET_MAX ? `${budgetLabel(BUDGET_MAX)}+` : budgetLabel(maxBudget)}
              <span className="font-normal text-white/45"> / day</span>
            </span>
          </div>
          <input
            type="range"
            min={BUDGET_MIN}
            max={BUDGET_MAX}
            step={BUDGET_STEP}
            value={maxBudget}
            onChange={(e) => setMaxBudget(Number(e.target.value))}
            aria-label="Maximum day rate"
            className={`w-full ${sliderAccent}`}
          />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-white/35">
            <span>{budgetLabel(BUDGET_MIN)}</span>
            <span>{budgetLabel(BUDGET_MAX)}+</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rise flex flex-col gap-4" style={{ animationDelay: "120ms" }}>
        <p className="text-sm text-white/45">
          {results.length} {results.length === 1 ? "creative" : "creatives"}
          {category !== "All" ? ` in ${category}` : ""}
          {maxBudget < BUDGET_MAX ? ` under ${budgetLabel(maxBudget)}/day` : ""}
        </p>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((c) => (
              <CreativeCard key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/55">
            No creatives match your search. Try a different filter or term.
          </div>
        )}
      </div>
    </div>
  );
}
