"use client";

import { PageHeader, Surface, Button, Icon, StatusPill } from "@/components/dashboard/ui";
import { useSheet, SheetHeader } from "@/components/dashboard/sheet";
import { BRANDS, money, type Brand } from "@/lib/createearn";

function Logo({ brand, size }: { brand: Brand; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-2xl font-semibold text-white ring-1 ring-white/10"
      style={{ height: size, width: size, fontSize: size * 0.34, backgroundImage: `linear-gradient(140deg, ${brand.logoFrom}, ${brand.logoTo})` }}
    >
      {brand.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
    </span>
  );
}

function Palette({ colors, big = false }: { colors: string[]; big?: boolean }) {
  return (
    <div className="flex gap-1.5">
      {colors.map((c) => (
        <span
          key={c}
          title={c}
          className={`rounded-md ring-1 ring-white/10 ${big ? "h-10 flex-1" : "h-5 w-5"}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}

function VaultSheet({ brand }: { brand: Brand }) {
  return (
    <div>
      <SheetHeader title={brand.name} subtitle={`${brand.industry} · ${brand.location}`} />

      <div className="flex items-center gap-4">
        <Logo brand={brand} size={56} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5"><Icon name="globe" size={13} /> {brand.website}</span>
            <span className="inline-flex items-center gap-1.5"><Icon name="instagram" size={13} /> {brand.instagram}</span>
          </div>
          <div className="mt-1.5 font-mono text-sm">
            <span className="text-white/45">Lifetime </span>
            <span className="font-semibold text-escrow-green">{money(brand.lifetime)}</span>
          </div>
        </div>
      </div>

      {/* Palette */}
      <div className="mt-6">
        <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/40">Brand palette</div>
        <Palette colors={brand.palette} big />
        <div className="mt-1.5 flex gap-1.5">
          {brand.palette.map((c) => (
            <span key={c} className="flex-1 text-center font-mono text-[9px] text-white/35">{c}</span>
          ))}
        </div>
      </div>

      {/* Quick folders */}
      <div className="mt-6">
        <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/40">Quick access</div>
        <div className="grid grid-cols-2 gap-2.5">
          {brand.folders.map((f) => (
            <button key={f.key} className="glass glass-hover flex items-center gap-3 rounded-2xl border border-white/10 p-3 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-grid-blue/12 text-aerial-cyan ring-1 ring-grid-blue/25">
                <Icon name={f.icon} size={17} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-white">{f.label}</span>
                <span className="block text-xs text-white/45">{f.count} items</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Project history */}
      <div className="mt-6">
        <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-white/40">Project history</div>
        <div className="flex flex-col gap-2">
          {brand.projects.map((p) => (
            <div key={p.title} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <span className="min-w-0 truncate text-sm text-white/85">{p.title}</span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-sm font-semibold text-white">{money(p.value)}</span>
                <StatusPill tone={p.status === "Delivered" ? "escrow" : p.status === "Active" ? "blue" : "gold"}>{p.status}</StatusPill>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Content timeline */}
      <div className="mt-6">
        <div className="mb-3 text-[10px] uppercase tracking-[0.16em] text-white/40">Content history</div>
        <div className="relative ml-1 border-l border-white/10 pl-5">
          {brand.timeline.map((t, i) => (
            <div key={i} className="relative pb-5 last:pb-0">
              <span className="absolute -left-[1.45rem] top-1 h-2.5 w-2.5 rounded-full bg-aerial-cyan ring-4 ring-[#0a0b0e]" />
              <div className="text-sm font-medium text-white">{t.title}</div>
              <div className="text-xs text-white/45">{t.kind} · {t.date}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function BrandVaultPage() {
  const { open } = useSheet();
  const lifetime = BRANDS.reduce((a, b) => a + b.lifetime, 0);
  const activeProjects = BRANDS.reduce((a, b) => a + b.projects.filter((p) => p.status === "Active").length, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Create & earn" tone="purple" title="Brand Vault™" subtitle="The control center for every brand you work with." />
      </div>

      {/* Ticker */}
      <div className="rise grid grid-cols-3 gap-3" style={{ animationDelay: "60ms" }}>
        {[
          { label: "Brands", value: String(BRANDS.length) },
          { label: "Lifetime value", value: money(lifetime) },
          { label: "Active projects", value: String(activeProjects) },
        ].map((s) => (
          <Surface key={s.label} radius="1.25rem" inner="p-4">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/40">{s.label}</div>
            <div className="mt-1.5 font-mono text-2xl font-semibold tracking-tight text-white">{s.value}</div>
          </Surface>
        ))}
      </div>

      {/* Brand panels */}
      <div className="rise grid gap-4 lg:grid-cols-2" style={{ animationDelay: "120ms" }}>
        {BRANDS.map((b) => (
          <button
            key={b.id}
            onClick={() => open(<VaultSheet brand={b} />)}
            className="glass glass-hover group rounded-3xl border border-white/10 p-5 text-left"
          >
            <div className="flex items-start gap-4">
              <Logo brand={b} size={52} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-white">{b.name}</div>
                <div className="truncate text-xs text-white/50">{b.industry}</div>
                <div className="mt-1 inline-flex items-center gap-1 text-xs text-white/40">
                  <Icon name="pin" size={11} /> {b.location}
                </div>
              </div>
              <span className="text-white/30 transition-transform duration-300 group-hover:translate-x-0.5">
                <Icon name="arrow" size={16} />
              </span>
            </div>

            <div className="mt-4">
              <Palette colors={b.palette} />
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
              <div className="flex gap-4 text-xs text-white/45">
                <span className="inline-flex items-center gap-1.5"><Icon name="globe" size={12} /> {b.website}</span>
              </div>
              <span className="font-mono text-sm font-semibold text-escrow-green">{money(b.lifetime)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
