"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRole } from "@/components/dashboard/role-context";
import { PageHeader, Icon } from "@/components/dashboard/ui";
import { CreativeCard } from "@/components/dashboard/cards";
import { TALENT_CATEGORIES, type Category, type TalentCategory, type Creative } from "@/lib/grid-data";
import { listCreators } from "@/lib/profile-actions";

type Filter = "All" | "Photo" | "Video" | "Drone";

const FILTERS: Filter[] = ["All", "Photo", "Video", "Drone"];

/* Multi-select Category toggle — pops up a list; pick one or many. */
function CategoryMenu({ selected, onChange }: { selected: TalentCategory[]; onChange: (next: TalentCategory[]) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const toggle = (c: TalentCategory) => onChange(selected.includes(c) ? selected.filter((x) => x !== c) : [...selected, c]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium tracking-tight transition-colors duration-300 ${selected.length ? "bg-white/15 text-white" : "bg-white/[0.05] text-white/60 hover:text-white/80"}`}
      >
        <Icon name="layout" size={15} /> Category
        {selected.length > 0 && (
          <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-grid-blue px-1.5 text-[11px] font-semibold text-on-accent">{selected.length}</span>
        )}
        <Icon name="chevron" size={13} className={`text-white/45 transition-transform ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-multiselectable
          className="absolute left-0 z-30 mt-2 w-[min(22rem,calc(100vw-3rem))] rounded-2xl border border-white/12 bg-soft-black/95 p-3 shadow-[0_24px_70px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
        >
          <div className="mb-2.5 flex items-center justify-between px-1">
            <span className="text-[11px] uppercase tracking-[0.14em] text-white/45">Pick one or more</span>
            {selected.length > 0 && (
              <button type="button" onClick={() => onChange([])} className="text-xs text-white/45 transition-colors hover:text-white">Clear</button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TALENT_CATEGORIES.map((c) => {
              const on = selected.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  role="option"
                  aria-selected={on}
                  onClick={() => toggle(c)}
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1.5 text-xs transition-colors ${on ? "border-grid-blue/50 bg-grid-blue/15 text-white" : "border-white/10 text-white/60 hover:text-white"}`}
                >
                  {on && <Icon name="check" size={11} />}
                  {c}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const BUDGET_MIN = 150;
const BUDGET_MAX = 25000;
const budgetLabel = (n: number) => `€${n.toLocaleString()}`;

/* Logarithmic budget slider: most accounts sit €500–€10k, so the slider gives
   that band most of its travel and compresses the sparse high end.
   The <input> moves over 0..POS_STEPS; we map position → € on a log curve. */
const POS_STEPS = 1000;
const LOG_MIN = Math.log(BUDGET_MIN);
const LOG_SPAN = Math.log(BUDGET_MAX) - LOG_MIN;
function snapBudget(v: number): number {
  if (v >= BUDGET_MAX) return BUDGET_MAX;
  const step = v < 1000 ? 50 : v < 10000 ? 100 : 500; // round to readable increments
  return Math.max(BUDGET_MIN, Math.round(v / step) * step);
}
const posToBudget = (pos: number): number => snapBudget(Math.exp(LOG_MIN + (pos / POS_STEPS) * LOG_SPAN));
const budgetToPos = (budget: number): number =>
  Math.round(((Math.log(Math.min(Math.max(budget, BUDGET_MIN), BUDGET_MAX)) - LOG_MIN) / LOG_SPAN) * POS_STEPS);

export default function BrowsePage() {
  const { role } = useRole();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Filter>("All");
  const [cats, setCats] = useState<TalentCategory[]>([]);
  const [maxBudget, setMaxBudget] = useState(BUDGET_MAX);
  const [creatives, setCreatives] = useState<Creative[]>([]);

  useEffect(() => {
    listCreators().then(setCreatives).catch(() => setCreatives([]));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return creatives.filter((c) => {
      const matchesCat = category === "All" || c.cat === (category as Category);
      const matchesCats = cats.length === 0 || c.categories.some((cc) => cats.includes(cc));
      const matchesBudget = c.rate <= maxBudget;
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.categories.some((cc) => cc.toLowerCase().includes(q));
      return matchesCat && matchesCats && matchesBudget && matchesQuery;
    });
  }, [creatives, query, category, cats, maxBudget]);

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

      {/* Search + filters (z-20 so the Category popover sits above the results below) */}
      <div className="rise relative z-20 flex flex-col gap-4" style={{ animationDelay: "60ms" }}>
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
          <CategoryMenu selected={cats} onChange={setCats} />
        </div>

        {/* Budget slider */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.14em] text-white/45">Budget</span>
            <span className="font-mono text-sm font-semibold text-white">
              {maxBudget >= BUDGET_MAX ? `${budgetLabel(BUDGET_MAX)}+` : budgetLabel(maxBudget)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={POS_STEPS}
            step={1}
            value={budgetToPos(maxBudget)}
            onChange={(e) => setMaxBudget(posToBudget(Number(e.target.value)))}
            aria-label="Budget"
            className={`w-full ${sliderAccent}`}
          />
          <div className="mt-1 flex justify-between font-mono text-[11px] text-white/35">
            <span>{budgetLabel(BUDGET_MIN)}</span>
            <span className="text-white/30">most sit €500–€10k</span>
            <span>{budgetLabel(BUDGET_MAX)}+</span>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="rise flex flex-col gap-4" style={{ animationDelay: "120ms" }}>
        <p className="text-sm text-white/45">
          {results.length} {results.length === 1 ? "creative" : "creatives"}
          {category !== "All" ? ` in ${category}` : ""}
          {cats.length > 0 ? ` · ${cats.length} categor${cats.length === 1 ? "y" : "ies"}` : ""}
          {maxBudget < BUDGET_MAX ? ` within ${budgetLabel(maxBudget)} budget` : ""}
        </p>

        {results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {results.map((c) => (
              <CreativeCard key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/55">
            {creatives.length === 0
              ? "No creatives yet. Verified talent will appear here as they join."
              : "No creatives match your search. Try a different filter or term."}
          </div>
        )}
      </div>
    </div>
  );
}
