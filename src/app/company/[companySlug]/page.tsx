"use client";

/**
 * PUBLIC company profile page — "GRID for Clients".
 *
 * Self-contained: this route lives OUTSIDE /client so it receives NO
 * ClientProvider / ThemeProvider / ClientShell. We therefore avoid useClient()
 * and roll our own toast + follow state with useLocalState (which is safe to use
 * standalone). Route params are intentionally ignored — we render the saved
 * profile from localStorage, falling back to DEFAULT_COMPANY.
 *
 * Hydration-safe: no time/random values during render; profile is read inside a
 * useEffect after mount; new ids only ever come from crypto.randomUUID() inside
 * event handlers.
 */

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Button, Surface, Icon } from "@/components/dashboard/ui";
import { useLocalState } from "@/components/client/use-local-state";
import { CLIENT_KEYS } from "@/lib/client/config";
import {
  DEFAULT_COMPANY,
  MOCK_JOBS,
  MOCK_PROJECTS,
  TOP_CREATORS,
  type CompanyProfile,
} from "@/lib/client/mock";

/* -------------------------------------------------------------------------- */
/*  Local types + static content                                               */
/* -------------------------------------------------------------------------- */

type Testimonial = { id: string; quote: string; author: string; role: string };

const TESTIMONIALS: Testimonial[] = [
  {
    id: "rev-1",
    quote:
      "The most reliable creative partner we've worked with. Every shoot lands on time and on brief — and the approvals flow is effortless.",
    author: "Camille Roux",
    role: "Brand Director, Maison Lille",
  },
  {
    id: "rev-2",
    quote:
      "They turned a sprawling multi-property launch into something genuinely calm. Premium output, zero chaos.",
    author: "Henrik Solberg",
    role: "CMO, Fjordline Resorts",
  },
  {
    id: "rev-3",
    quote:
      "Cinematic work, fast turnarounds, and a team that actually gets hospitality. We've doubled our content output.",
    author: "Ava Bennett",
    role: "Head of Social, The Atrium Group",
  },
];

const GALLERY_TILES: { id: string; label: string; from: string; to: string }[] = [
  { id: "g1", label: "Twilight exteriors", from: "#13294b", to: "#0a0c12" },
  { id: "g2", label: "Suite interiors", from: "#0f3d2e", to: "#08100f" },
  { id: "g3", label: "Brand film", from: "#2a2150", to: "#0d0a18" },
  { id: "g4", label: "Fjord aerials", from: "#163a4a", to: "#08121a" },
  { id: "g5", label: "Food styling", from: "#3a2a1a", to: "#120c08" },
  { id: "g6", label: "Reel series", from: "#1b2a4a", to: "#0a0c14" },
];

/* -------------------------------------------------------------------------- */
/*  Tiny self-contained primitives                                             */
/* -------------------------------------------------------------------------- */

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">
      {children}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent = "text-white",
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
      <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">{label}</span>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${accent}`}>{value}</div>
      {sub && <span className="mt-1 block text-xs text-white/45">{sub}</span>}
    </div>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-review-gold">
      <span className="inline-flex gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Icon key={i} name="star" size={14} />
        ))}
      </span>
      <span className="text-sm font-medium text-white">{rating.toFixed(1)}</span>
    </span>
  );
}

function fmtDate(iso: string): string {
  // Static formatting from a fixed string — no `new Date()` of "now", so SSR-safe.
  const [y, m, d] = iso.split("-");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mi = Number(m) - 1;
  if (!y || mi < 0 || mi > 11 || !d) return iso;
  return `${months[mi]} ${Number(d)}, ${y}`;
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CompanyProfilePage() {
  // Read the saved profile after mount (localStorage is client-only).
  const [company, setCompany] = useState<CompanyProfile>(DEFAULT_COMPANY);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CLIENT_KEYS.profile);
      if (raw != null) setCompany(JSON.parse(raw) as CompanyProfile);
    } catch {
      /* ignore — fall back to DEFAULT_COMPANY */
    }
  }, []);

  // Follow / save state persists across visits.
  const [following, setFollowing] = useLocalState<boolean>("grid:client:companyFollow", false);

  // Self-contained toast (no ClientProvider on this public route).
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  function toast(msg: string) {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2200);
  }

  const openJobs = MOCK_JOBS.filter((j) => j.status === "active");
  const pastProjects = MOCK_PROJECTS.filter((p) => p.status === "complete");
  const colors = company.brandColors.length ? company.brandColors : DEFAULT_COMPANY.brandColors;
  const initial = company.name.trim().charAt(0).toUpperCase() || "G";

  const bannerStyle: CSSProperties = {
    backgroundImage: `linear-gradient(120deg, ${colors[0] ?? "#0f3d2e"} 0%, ${colors[1] ?? "#13294b"} 55%, ${colors[2] ?? "#0a0c12"} 100%)`,
  };
  const logoStyle: CSSProperties = {
    background: `linear-gradient(140deg, ${colors[1] ?? "#13294b"}, ${colors[0] ?? "#0f3d2e"})`,
  };

  function toggleFollow() {
    setFollowing((prev) => {
      const next = !prev;
      toast(next ? "Following Northline" : "Removed from following");
      return next;
    });
  }

  function openWebsite() {
    toast(`Opening ${company.website}`);
  }

  return (
    <div className="relative min-h-dvh bg-grid-black text-white">
      {/* Ambient navy/green wash */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/4 h-[34rem] w-[34rem] rounded-full bg-client-green/10 blur-[140px]" />
        <div className="absolute -bottom-40 right-1/4 h-[34rem] w-[34rem] rounded-full bg-grid-blue/10 blur-[150px]" />
      </div>

      {/* Toast */}
      {toastMsg && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-escrow-green/30 bg-[#06140c]/90 px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_30px_rgba(0,0,0,0.5)] backdrop-blur">
            <Icon name="check" size={15} className="text-escrow-green" />
            {toastMsg}
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="relative z-10 border-b border-white/10 bg-grid-black/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            href="/client/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-white"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <Icon name="chevron" size={14} className="rotate-180" />
            </span>
            Back to dashboard
          </Link>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/45">
            <Icon name="command" size={14} className="text-escrow-green" />
            GRID for Clients
          </span>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 sm:px-6">
        {/* ---------------------------------------------------------------- */}
        {/*  Banner + identity                                               */}
        {/* ---------------------------------------------------------------- */}
        <section className="pt-6">
          <div className="overflow-hidden rounded-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
            <div className="relative h-44 sm:h-56" style={bannerStyle}>
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-white/[0.06]" />
              <span className="pointer-events-none absolute left-4 top-4 h-4 w-4 border-l border-t border-white/30" />
              <span className="pointer-events-none absolute right-4 top-4 h-4 w-4 border-r border-t border-white/30" />
            </div>

            <div className="bg-white/[0.02] px-5 pb-6 sm:px-8">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-end gap-4">
                  <span
                    className="-mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl text-4xl font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-4 ring-grid-black sm:h-28 sm:w-28"
                    style={logoStyle}
                  >
                    {initial}
                  </span>
                  <div className="pb-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{company.name}</h1>
                      <span title="Verified company" className="text-aerial-cyan">
                        <Icon name="verified" size={22} />
                      </span>
                    </div>
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/55">
                      <span>{company.industry}</span>
                      <span className="text-white/25">•</span>
                      <span className="inline-flex items-center gap-1">
                        <Icon name="pin" size={13} className="text-escrow-green" />
                        {company.location}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button tone="white" variant="ghost" onClick={openWebsite}>
                    <Icon name="globe" size={16} />
                    Website
                  </Button>
                  <Button
                    tone={following ? "escrow" : "green"}
                    variant={following ? "ghost" : "solid"}
                    onClick={toggleFollow}
                  >
                    <Icon name={following ? "check" : "heart"} size={16} />
                    {following ? "Following" : "Follow"}
                  </Button>
                </div>
              </div>

              <p className="mt-5 max-w-2xl text-pretty text-sm leading-relaxed text-white/65">
                {company.tagline}
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Stars rating={company.reviewScore} />
                <span className="text-white/25">•</span>
                <span className="text-sm text-white/55">{company.completedProjects} completed projects</span>
                <span className="text-white/25">•</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/65">
                  <Icon name="clock" size={13} className="text-aerial-cyan" />
                  Responds in {company.responseTime}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  Quick stats                                                     */}
        {/* ---------------------------------------------------------------- */}
        <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Rating" value={company.reviewScore.toFixed(1)} sub="from clients & creators" accent="text-review-gold" />
          <StatCard label="Completed" value={`${company.completedProjects}`} sub="projects shipped" accent="text-escrow-green" />
          <StatCard label="Response" value={company.responseTime} sub="typical reply" accent="text-aerial-cyan" />
          <StatCard label="Founded" value={company.founded} sub={`Team of ${company.size}`} />
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  About + Mission/Values                                          */}
        {/* ---------------------------------------------------------------- */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Surface className="h-full">
              <div className="p-6 sm:p-7">
                <h2 className="text-lg font-semibold tracking-tight">About {company.name}</h2>
                <p className="mt-3 text-sm leading-relaxed text-white/65">{company.about}</p>
                <p className="mt-3 text-sm leading-relaxed text-white/55">{company.shortDescription}</p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">Tone of voice</span>
                    <p className="mt-1.5 text-sm text-white/75">{company.toneOfVoice}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="text-[11px] uppercase tracking-[0.16em] text-white/45">Visual style</span>
                    <p className="mt-1.5 text-sm text-white/75">{company.visualStyle}</p>
                  </div>
                </div>
              </div>
            </Surface>
          </div>

          <div>
            <Surface className="h-full">
              <div className="p-6 sm:p-7">
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Icon name="target" size={18} className="text-escrow-green" />
                  Mission
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-white/70">{company.mission}</p>

                <h3 className="mt-6 text-[11px] uppercase tracking-[0.16em] text-white/45">Brand values</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {company.values.map((v) => (
                    <Chip key={v}>{v}</Chip>
                  ))}
                </div>

                <h3 className="mt-6 text-[11px] uppercase tracking-[0.16em] text-white/45">Brand colours</h3>
                <div className="mt-3 flex gap-2">
                  {colors.map((c) => (
                    <span
                      key={c}
                      title={c}
                      className="h-8 w-8 rounded-lg border border-white/15"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </Surface>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  Gallery                                                         */}
        {/* ---------------------------------------------------------------- */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">Recent work</h2>
            <span className="inline-flex items-center gap-1.5 text-xs text-white/45">
              <Icon name="camera" size={14} />
              Selected highlights
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {GALLERY_TILES.map((t) => (
              <div
                key={t.id}
                className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10"
                style={{ backgroundImage: `linear-gradient(150deg, ${t.from}, ${t.to})` }}
              >
                <span className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 border-l border-t border-white/25" />
                <span className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5 border-b border-r border-white/25" />
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 text-xs font-semibold text-white drop-shadow">{t.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  Open jobs                                                       */}
        {/* ---------------------------------------------------------------- */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <Icon name="briefcase" size={18} className="text-aerial-cyan" />
              Open jobs
              <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-xs text-white/55">{openJobs.length}</span>
            </h2>
            <Link href="/client/jobs" className="text-sm text-aerial-cyan transition-colors hover:text-white">
              See all
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {openJobs.map((job) => (
              <div
                key={job.id}
                className="flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] text-white/60">
                      {job.category}
                    </span>
                    <h3 className="mt-2 text-base font-semibold leading-snug">{job.title}</h3>
                  </div>
                  {job.visibility === "Enhanced" && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-review-gold/12 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-review-gold ring-1 ring-review-gold/25">
                      <Icon name="star" size={11} />
                      Featured
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm leading-relaxed text-white/55">{job.description}</p>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/55">
                  <span className="inline-flex items-center gap-1.5 text-escrow-green">
                    <Icon name="wallet" size={14} />
                    {job.budget}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="calendar" size={14} />
                    Due {fmtDate(job.deadline)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="pin" size={14} />
                    {job.mode}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs text-white/45">{job.applicants} applicants</span>
                  <Button tone="white" variant="ghost" href="/client/jobs">
                    View
                    <Icon name="chevron" size={14} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  Past projects                                                   */}
        {/* ---------------------------------------------------------------- */}
        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold tracking-tight">
            <Icon name="check" size={18} className="text-escrow-green" />
            Past projects
          </h2>
          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.03]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-[0.12em] text-white/45">
                  <th className="px-5 py-3 font-medium">Project</th>
                  <th className="px-5 py-3 font-medium">Creative</th>
                  <th className="px-5 py-3 font-medium">Budget</th>
                  <th className="px-5 py-3 font-medium">Delivered</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pastProjects.map((p) => (
                  <tr key={p.id} className="border-b border-white/[0.06] last:border-0">
                    <td className="px-5 py-3.5 font-medium text-white">{p.name}</td>
                    <td className="px-5 py-3.5 text-white/65">{p.creative}</td>
                    <td className="px-5 py-3.5 text-escrow-green">{p.budget}</td>
                    <td className="px-5 py-3.5 text-white/55">{fmtDate(p.deadline)}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-escrow-green/12 px-2.5 py-1 text-[11px] font-medium text-escrow-green ring-1 ring-escrow-green/25">
                        <Icon name="check" size={12} />
                        Complete
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  Reviews / testimonials                                          */}
        {/* ---------------------------------------------------------------- */}
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight">What people say</h2>
            <Stars rating={company.reviewScore} />
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Surface key={t.id}>
                <div className="flex h-full flex-col p-6">
                  <span className="inline-flex gap-0.5 text-review-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon key={i} name="star" size={13} />
                    ))}
                  </span>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-white/75">&ldquo;{t.quote}&rdquo;</p>
                  <div className="mt-4 border-t border-white/10 pt-4">
                    <div className="text-sm font-semibold text-white">{t.author}</div>
                    <div className="text-xs text-white/45">{t.role}</div>
                  </div>
                </div>
              </Surface>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  Preferred categories + budgets + trusted creators               */}
        {/* ---------------------------------------------------------------- */}
        <section className="mt-10 grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Surface className="h-full">
              <div className="p-6 sm:p-7">
                <h2 className="text-lg font-semibold tracking-tight">Preferred creative categories</h2>
                <p className="mt-1.5 text-sm text-white/55">What this company most often hires for.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {company.hiresFor.map((h) => (
                    <span
                      key={h}
                      className="inline-flex items-center gap-1.5 rounded-full border border-escrow-green/25 bg-escrow-green/10 px-3 py-1.5 text-xs text-escrow-green"
                    >
                      <Icon name="sparkles" size={13} />
                      {h}
                    </span>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/45">
                      <Icon name="wallet" size={13} />
                      Typical budgets
                    </span>
                    <p className="mt-1.5 text-sm font-medium text-white">{company.budgetRange}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-white/45">
                      <Icon name="clock" size={13} />
                      Response time
                    </span>
                    <p className="mt-1.5 text-sm font-medium text-white">{company.responseTime}</p>
                  </div>
                </div>
              </div>
            </Surface>
          </div>

          <div>
            <Surface className="h-full">
              <div className="p-6 sm:p-7">
                <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
                  <Icon name="users" size={18} className="text-aerial-cyan" />
                  Trusted creators
                </h2>
                <ul className="mt-4 space-y-3">
                  {TOP_CREATORS.map((c) => (
                    <li key={c.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/[0.06] text-xs font-semibold text-white/80 ring-1 ring-white/10">
                          {c.name
                            .split(" ")
                            .slice(0, 2)
                            .map((p) => p[0])
                            .join("")}
                        </span>
                        <div>
                          <div className="text-sm font-medium text-white">{c.name}</div>
                          <div className="text-xs text-white/45">{c.category}</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-review-gold">
                        <Icon name="star" size={12} />
                        {c.score.toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Surface>
          </div>
        </section>

        {/* ---------------------------------------------------------------- */}
        {/*  Bottom CTA                                                      */}
        {/* ---------------------------------------------------------------- */}
        <section className="mt-12">
          <div
            className="overflow-hidden rounded-3xl border border-white/10 p-8 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)] sm:p-12"
            style={{
              backgroundImage: `linear-gradient(120deg, ${colors[0] ?? "#0f3d2e"}33 0%, ${colors[1] ?? "#13294b"}33 100%)`,
            }}
          >
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">Work with {company.name}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/65">
              Pitch your craft, apply to open briefs, or reach out directly. Premium hospitality work, paid on time,
              every time.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button tone="green" onClick={() => toast("Contact request sent")}>
                <Icon name="mail" size={16} />
                Contact
              </Button>
              <Button tone="white" variant="ghost" onClick={() => toast("Application started")}>
                <Icon name="send" size={16} />
                Apply
              </Button>
              <Button tone="white" variant="ghost" href="/client/jobs" arrow>
                View jobs
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
