"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { demoLogout } from "@/lib/demo-auth";
import { useRole } from "@/components/dashboard/role-context";
import { useSheet, SheetHeader } from "@/components/dashboard/sheet";
import { UploadSheet } from "@/components/dashboard/sheets";
import {
  PageHeader,
  SectionHeader,
  Surface,
  Avatar,
  MetricCard,
  MediaTile,
  TrustBadge,
  Button,
  Verified,
  Icon,
} from "@/components/dashboard/ui";
import { PackageRow, ReviewCard } from "@/components/dashboard/cards";
import { CREATIVES, MY_COMPANY, CREATIVE_REVIEWS, METRICS, money } from "@/lib/grid-data";
import {
  loadCreatorProfile,
  saveCreatorProfile,
  loadClientProfile,
  saveClientProfile,
  type CreatorProfile,
  type ClientProfile,
} from "@/lib/profile-store";

const field =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-grid-blue/50";

function Field({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={field} />
    </div>
  );
}

/* ---- Edit sheets ---------------------------------------------------------- */
function EditCreatorSheet({ initial, onSave }: { initial: CreatorProfile; onSave: (p: CreatorProfile) => void }) {
  const { close } = useSheet();
  const [p, setP] = useState(initial);
  const set = <K extends keyof CreatorProfile>(k: K, v: CreatorProfile[K]) => setP((s) => ({ ...s, [k]: v }));
  return (
    <div>
      <SheetHeader title="Edit profile" subtitle="This is how clients see you on Grid." />
      <div className="flex flex-col gap-4">
        <Field label="Name" value={p.name} onChange={(v) => set("name", v)} />
        <Field label="Specialty" value={p.type} onChange={(v) => set("type", v)} />
        <Field label="City" value={p.city} onChange={(v) => set("city", v)} />
        <Field label="Day rate (€)" type="number" value={p.rate} onChange={(v) => set("rate", Math.max(0, Math.round(Number(v) || 0)))} />
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">Bio</label>
          <textarea value={p.bio} onChange={(e) => set("bio", e.target.value)} rows={4} className={`${field} resize-none leading-relaxed`} />
        </div>
        <Button full arrow onClick={() => { onSave({ ...p, name: p.name.trim() || initial.name }); close(); }}>
          Save profile
        </Button>
      </div>
    </div>
  );
}

function EditCompanySheet({ initial, onSave }: { initial: ClientProfile; onSave: (p: ClientProfile) => void }) {
  const { close } = useSheet();
  const [p, setP] = useState(initial);
  const set = <K extends keyof ClientProfile>(k: K, v: ClientProfile[K]) => setP((s) => ({ ...s, [k]: v }));
  return (
    <div>
      <SheetHeader title="Edit company profile" subtitle="How creators see your business on Grid." />
      <div className="flex flex-col gap-4">
        <Field label="Company name" value={p.name} onChange={(v) => set("name", v)} />
        <Field label="Industry" value={p.industry} onChange={(v) => set("industry", v)} />
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">Locations (comma-separated)</label>
          <input value={p.locations} onChange={(e) => set("locations", e.target.value)} className={field} placeholder="Los Angeles, CA, New York, NY" />
        </div>
        <Button full tone="green" arrow onClick={() => { onSave({ ...p, name: p.name.trim() || initial.name }); close(); }}>
          Save company profile
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export default function ProfilePage() {
  const { role } = useRole();
  const router = useRouter();
  const { open } = useSheet();
  const handleSignOut = async () => { await signOut().catch(() => {}); await demoLogout().catch(() => {}); router.push("/login"); };

  const creativeSeed = CREATIVES[0];
  const creatorDefaults: CreatorProfile = { name: creativeSeed.name, type: creativeSeed.type, city: creativeSeed.city, rate: creativeSeed.rate, bio: creativeSeed.bio };
  const clientDefaults: ClientProfile = { name: MY_COMPANY.name, industry: MY_COMPANY.industry, locations: MY_COMPANY.locations.join(", ") };

  const [creator, setCreator] = useState<CreatorProfile>(creatorDefaults);
  const [client, setClient] = useState<ClientProfile>(clientDefaults);

  useEffect(() => {
    setCreator(loadCreatorProfile(creatorDefaults));
    setClient(loadClientProfile(clientDefaults));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function saveCreator(p: CreatorProfile) { setCreator(p); saveCreatorProfile(p); }
  function saveClient(p: ClientProfile) { setClient(p); saveClientProfile(p); }

  if (role === "client") {
    const co = MY_COMPANY;
    const initial = client.name.charAt(0).toUpperCase();
    const locations = client.locations.split(",").map((l) => l.trim()).filter(Boolean);
    return (
      <div className="flex flex-col gap-10">
        <div className="rise">
          <PageHeader eyebrow="Company profile" title="Your company" subtitle="How creators see you on Grid. A strong, on-time reputation books the best talent faster." tone="green" />
          <Surface radius="2rem" inner="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-semibold text-white/90 ring-1 ring-white/10" style={{ background: "linear-gradient(135deg,#163326,#08120c)" }}>
                  {initial}
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight text-white">{client.name}</h2>
                  <p className="mt-1 text-sm text-white/55">{client.industry}</p>
                  {co.paysOnTime && <div className="mt-3"><TrustBadge>Pays on time</TrustBadge></div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:w-72">
                <MetricCard label="Rating" value={`${co.rating} ★`} tone="gold" />
                <MetricCard label="Jobs posted" value={String(co.jobs)} />
              </div>
            </div>
          </Surface>
        </div>

        <div className="rise" style={{ animationDelay: "60ms" }}>
          <SectionHeader title="Locations" />
          <div className="flex flex-wrap gap-2">
            {locations.map((loc) => (
              <span key={loc} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/65">
                <Icon name="pin" size={14} className="text-aerial-cyan" />{loc}
              </span>
            ))}
          </div>
        </div>

        <div className="rise grid grid-cols-2 gap-3 sm:gap-4 sm:max-w-md" style={{ animationDelay: "120ms" }}>
          <MetricCard label="In escrow" value={money(METRICS.inEscrow)} tone="escrow" sub="held, protected" />
          <MetricCard label="Total spent" value={money(METRICS.totalSpent)} />
        </div>

        <div className="rise" style={{ animationDelay: "180ms" }}>
          <SectionHeader title="Reviews from creators" />
          <div className="grid gap-4 md:grid-cols-2">
            {co.reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
          </div>
        </div>

        <div className="rise flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
          <Button variant="ghost" onClick={() => open(<EditCompanySheet initial={client} onSave={saveClient} />)}>Edit company profile</Button>
          <Button variant="ghost" onClick={handleSignOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  // creator — CREATIVES[0] is "you" (John Hope)
  const c = creativeSeed;
  const reviews = CREATIVE_REVIEWS.john ?? [];

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader eyebrow="Your profile" title="How clients see you" subtitle="Your public Grid profile. Keep your portfolio, packages and reviews sharp to win more bookings." tone="cyan" />
        <Surface radius="2rem" inner="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Avatar id="john" name={creator.name} size={72} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-semibold tracking-tight text-white">{creator.name}</h2>
                  {c.verified && <Verified size={17} className="text-grid-blue" />}
                </div>
                <p className="mt-1 text-sm text-white/55">{creator.type} · {creator.city}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TrustBadge>ID Verified</TrustBadge>
                  {c.topRated && <TrustBadge>Top Rated</TrustBadge>}
                  {c.available && <TrustBadge>Available Today</TrustBadge>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-72">
              <MetricCard label="Day rate" value={money(creator.rate)} tone="cyan" />
              <MetricCard label="Rating" value="4.9 ★" tone="gold" sub={`${c.reviews} reviews`} />
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-pretty text-sm leading-relaxed text-white/65">{creator.bio}</p>
        </Surface>
      </div>

      <div className="rise" style={{ animationDelay: "60ms" }}>
        <SectionHeader title="Portfolio" onClick={() => open(<UploadSheet />)} cta="Manage" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {c.portfolio.map((t) => <MediaTile key={t.title} tile={t} ratio="1 / 1" label={t.title} />)}
        </div>
      </div>

      <div className="rise" style={{ animationDelay: "120ms" }}>
        <SectionHeader title="Media packages" />
        <div className="flex flex-col gap-3">
          {c.packages.map((p) => <PackageRow key={p.name} pkg={p} />)}
        </div>
      </div>

      <div className="rise" style={{ animationDelay: "180ms" }}>
        <SectionHeader title="Reviews from clients" />
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
        </div>
      </div>

      <div className="rise flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
        <Button variant="ghost" onClick={() => open(<EditCreatorSheet initial={creator} onSave={saveCreator} />)}>Edit profile</Button>
        <Button variant="ghost" onClick={handleSignOut}>Sign out</Button>
      </div>
    </div>
  );
}
