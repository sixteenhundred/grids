"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Eyebrow } from "./ui";
import { clientEnv } from "@/lib/env.client";
import { TALENT_CATEGORIES, type Creative, type TalentCategory } from "@/lib/grid-data";
import { listPublicCreators } from "@/lib/profile-actions";
import { FEATURED_CITIES, RADIUS_OPTIONS_KM, cityCoords, withinRadius, type GeoPoint } from "@/lib/geo";
import { attachPlacesAutocomplete } from "@/lib/google-places";

const BUDGET_MIN = 150;
const BUDGET_MAX = 25000;
const eur = (n: number) => `€${n.toLocaleString()}`;
const ANYWHERE = "Anywhere";
const OTHER = "Other";

function initials(name: string) {
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase() || "G";
}

// Dark form fields — solid dark surface, white text.
const field =
  "w-full rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/40 focus:border-grid-blue/60";

export function BrowseTalentSearch() {
  const [creatives, setCreatives] = useState<Creative[] | null>(null);
  const [query, setQuery] = useState("");
  const [cats, setCats] = useState<TalentCategory[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [maxBudget, setMaxBudget] = useState(BUDGET_MAX);
  const [loc, setLoc] = useState<string>(ANYWHERE);
  const [otherText, setOtherText] = useState("");
  const [otherCoords, setOtherCoords] = useState<GeoPoint | null>(null);
  const [radiusKm, setRadiusKm] = useState(250);
  const otherRef = useRef<HTMLInputElement>(null);

  const mapsKey = clientEnv.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    listPublicCreators().then(setCreatives).catch(() => setCreatives([]));
  }, []);

  useEffect(() => {
    if (loc !== OTHER || !mapsKey || !otherRef.current) return;
    void attachPlacesAutocomplete(otherRef.current, mapsKey, (p) => {
      setOtherText(p.address);
      setOtherCoords({ lat: p.lat, lng: p.lng });
    });
  }, [loc, mapsKey]);

  const center: GeoPoint | null = useMemo(() => {
    if (loc === ANYWHERE) return null;
    if (loc === OTHER) return otherCoords;
    return cityCoords(loc);
  }, [loc, otherCoords]);

  const results = useMemo(() => {
    if (!creatives) return [];
    const q = query.trim().toLowerCase();
    return creatives.filter((c) => {
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.categories.some((cc) => cc.toLowerCase().includes(q));
      const matchesCats = cats.length === 0 || c.categories.some((cc) => cats.includes(cc));
      const matchesBudget = c.rate <= maxBudget || maxBudget >= BUDGET_MAX;
      let matchesLoc = true;
      if (loc !== ANYWHERE) {
        if (center) matchesLoc = withinRadius(center, cityCoords(c.city), radiusKm);
        else if (loc === OTHER && otherText) matchesLoc = c.city.toLowerCase().includes(otherText.toLowerCase());
      }
      return matchesQuery && matchesCats && matchesBudget && matchesLoc;
    });
  }, [creatives, query, cats, maxBudget, loc, center, otherText, radiusKm]);

  const toggleCat = (c: TalentCategory) => setCats((p) => (p.includes(c) ? p.filter((x) => x !== c) : [...p, c]));

  return (
    <section id="browse-talent" className="relative px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Eyebrow tone="blue">Browse talent</Eyebrow>
        <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">Find your creative.</h2>

        {/* Dark search form */}
        <div className="mt-6 rounded-[2rem] border border-white/10 bg-[#0b0c10]/85 p-4 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] backdrop-blur-xl sm:p-5">
          <div className="flex flex-col gap-3">
            <label className="relative block">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
                <SearchIcon />
              </span>
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, specialty or city…" className={`${field} pl-11`} />
            </label>

            {/* Category toggle */}
            <div>
              <button
                type="button"
                onClick={() => setCatOpen((o) => !o)}
                className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white/85 transition-colors hover:text-white"
              >
                Categories
                {cats.length > 0 && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-grid-blue px-1.5 text-[11px] font-semibold text-on-accent">{cats.length}</span>
                )}
                <Chevron className={catOpen ? "rotate-180" : ""} />
              </button>
              {catOpen && (
                <div className="mt-2 flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/[0.02] p-3">
                  {TALENT_CATEGORIES.map((c) => {
                    const on = cats.includes(c);
                    return (
                      <button
                        key={c}
                        onClick={() => toggleCat(c)}
                        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${on ? "bg-grid-blue text-on-accent" : "bg-white/[0.06] text-white/65 hover:text-white"}`}
                      >
                        {c}
                      </button>
                    );
                  })}
                  {cats.length > 0 && (
                    <button onClick={() => setCats([])} className="rounded-full px-3 py-1.5 text-xs text-white/45 hover:text-white">
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Location + radius/budget */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">Location</label>
                <select value={loc} onChange={(e) => setLoc(e.target.value)} className={field}>
                  <option>{ANYWHERE}</option>
                  {FEATURED_CITIES.map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                  <option>{OTHER}</option>
                </select>
                {loc === OTHER && (
                  <input
                    ref={otherRef}
                    value={otherText}
                    onChange={(e) => {
                      setOtherText(e.target.value);
                      setOtherCoords(null);
                    }}
                    placeholder={mapsKey ? "Type any city, town or country…" : "Type a city or country…"}
                    className={`${field} mt-2`}
                  />
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">
                  {loc === ANYWHERE ? "Max day rate" : "Radius"}
                </label>
                {loc !== ANYWHERE && (
                  <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className={`${field} mb-2`}>
                    {RADIUS_OPTIONS_KM.map((r) => (
                      <option key={r} value={r}>
                        Within {r} km
                      </option>
                    ))}
                  </select>
                )}
                <div className="rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="text-white/55">Max day rate</span>
                    <span className="font-mono font-semibold text-white">{maxBudget >= BUDGET_MAX ? `${eur(BUDGET_MAX)}+` : eur(maxBudget)}</span>
                  </div>
                  <input type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={50} value={maxBudget} onChange={(e) => setMaxBudget(Number(e.target.value))} className="w-full accent-grid-blue" aria-label="Max budget" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="mt-5">
          <p className="mb-4 text-sm text-white/45">
            {!creatives ? "Loading verified talent…" : `${results.length} ${results.length === 1 ? "creative" : "creatives"}`}
            {loc !== ANYWHERE && center ? ` within ${radiusKm} km of ${loc === OTHER ? otherText || "your area" : loc}` : ""}
          </p>

          {creatives && results.length === 0 ? (
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/55">
              {creatives.length === 0 ? "Verified creatives appear here as they join GRID." : "No creatives match your search. Try widening the radius or budget."}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.slice(0, 9).map((c) => (
                <a
                  key={c.id}
                  href="/signup"
                  className="group flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-grid-blue/15 text-sm font-semibold text-aerial-cyan ring-1 ring-white/10">
                    {initials(c.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-sm font-semibold text-white">{c.name}</span>
                      {c.verified && <span className="text-grid-blue">✓</span>}
                    </div>
                    <div className="truncate text-xs text-white/55">
                      {c.type}
                      {c.city ? ` · ${c.city}` : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-sm font-semibold text-white">{c.rate ? eur(c.rate) : "—"}</div>
                    {c.rating > 0 && <div className="text-xs text-review-gold">★ {c.rating}</div>}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function Chevron({ className = "" }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden className={`text-white/45 transition-transform ${className}`}>
      <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
