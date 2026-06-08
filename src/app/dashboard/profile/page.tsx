"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { demoLogout } from "@/lib/demo-auth";
import { useRole } from "@/components/dashboard/role-context";
import { useSheet, SheetHeader } from "@/components/dashboard/sheet";
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
import { MyPlan } from "@/components/dashboard/my-plan";
import { PaymentConnections } from "@/components/dashboard/payment-connections";
import { MY_COMPANY, METRICS, money } from "@/lib/grid-data";
import {
  loadClientProfile,
  saveClientProfile,
  type ClientProfile,
} from "@/lib/profile-store";
import {
  getMyProfile,
  saveMyProfile,
  createPortfolioUploadUrl,
  addPortfolioItem,
  removePortfolioItem,
  savePackages,
  type MyProfile,
} from "@/lib/profile-actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { UPLOAD_BUCKET } from "@/lib/storage-shared";

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

function Toggle({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-left"
    >
      <span className="text-sm text-white/80">{label}</span>
      <span className={`relative h-6 w-10 rounded-full transition-colors ${on ? "bg-grid-blue" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[1.125rem]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

/* ---- Creator profile edit ------------------------------------------------- */
type CreatorEdit = { name: string; specialty: string; city: string; rate: number; bio: string; available: boolean; published: boolean };

function EditCreatorSheet({ initial, onSave }: { initial: CreatorEdit; onSave: (p: CreatorEdit) => Promise<void> }) {
  const { close } = useSheet();
  const [p, setP] = useState(initial);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof CreatorEdit>(k: K, v: CreatorEdit[K]) => setP((s) => ({ ...s, [k]: v }));
  return (
    <div>
      <SheetHeader title="Edit profile" subtitle="This is how clients see you on Grid." />
      <div className="flex flex-col gap-4">
        <Field label="Name" value={p.name} onChange={(v) => set("name", v)} />
        <Field label="Specialty" value={p.specialty} onChange={(v) => set("specialty", v)} />
        <Field label="City" value={p.city} onChange={(v) => set("city", v)} />
        <Field label="Day rate (€)" type="number" value={p.rate} onChange={(v) => set("rate", Math.max(0, Math.round(Number(v) || 0)))} />
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">Bio</label>
          <textarea value={p.bio} onChange={(e) => set("bio", e.target.value)} rows={4} className={`${field} resize-none leading-relaxed`} />
        </div>
        <Toggle label="Available for work" on={p.available} onChange={(v) => set("available", v)} />
        <Toggle label="Show my profile in the marketplace" on={p.published} onChange={(v) => set("published", v)} />
        <Button
          full
          arrow
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave({ ...p, name: p.name.trim() || initial.name });
            close();
          }}
        >
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </div>
  );
}

/* ---- Portfolio manager (uploads to private Storage) ----------------------- */
function PortfolioSheet({ items, refresh }: { items: { id: string; url: string; title: string }[]; refresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    setError(null);
    try {
      const { path, token } = await createPortfolioUploadUrl(f.name, f.size);
      const supabase = createSupabaseBrowserClient();
      const { error: upErr } = await supabase.storage.from(UPLOAD_BUCKET).uploadToSignedUrl(path, token, f);
      if (upErr) throw upErr;
      await addPortfolioItem({ path, size: f.size, title: f.name });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function remove(id: string) {
    await removePortfolioItem(id);
    await refresh();
  }

  return (
    <div>
      <SheetHeader title="Portfolio" subtitle="Upload your best work — clients see this first." />
      {items.length > 0 ? (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it) => (
            <div key={it.id} className="relative aspect-square overflow-hidden rounded-2xl border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={it.url} alt={it.title} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => remove(it.id)}
                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white/90 backdrop-blur transition-colors hover:bg-urgent-red/80"
                aria-label="Remove image"
              >
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="mb-4 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] p-6 text-center text-sm text-white/45">
          No images yet. Add your first piece.
        </p>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <Button full arrow disabled={busy} onClick={() => fileRef.current?.click()}>
        <Icon name="upload" size={15} /> {busy ? "Uploading…" : "Add image"}
      </Button>
      {error && <p className="mt-3 text-center text-xs text-urgent-red">{error}</p>}
    </div>
  );
}

/* ---- Package builder ------------------------------------------------------ */
type PkgEdit = { name: string; price: number; detail: string };

function PackagesSheet({ initial, refresh }: { initial: PkgEdit[]; refresh: () => Promise<void> }) {
  const { close } = useSheet();
  const [rows, setRows] = useState<PkgEdit[]>(initial.length ? initial : [{ name: "", price: 0, detail: "" }]);
  const [saving, setSaving] = useState(false);
  const setRow = (i: number, k: keyof PkgEdit, v: string | number) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));
  const addRow = () => setRows((rs) => [...rs, { name: "", price: 0, detail: "" }]);
  const removeRow = (i: number) => setRows((rs) => rs.filter((_, j) => j !== i));

  async function save() {
    setSaving(true);
    await savePackages(rows.filter((r) => r.name.trim()));
    await refresh();
    close();
  }

  return (
    <div>
      <SheetHeader title="Media packages" subtitle="What clients can book from you." />
      <div className="flex flex-col gap-4">
        {rows.map((r, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.14em] text-white/45">Package {i + 1}</span>
              <button type="button" onClick={() => removeRow(i)} className="text-xs text-white/45 transition-colors hover:text-urgent-red">
                Remove
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <input value={r.name} onChange={(e) => setRow(i, "name", e.target.value)} placeholder="Package name" className={field} />
              <input type="number" min={0} value={r.price} onChange={(e) => setRow(i, "price", Math.max(0, Math.round(Number(e.target.value) || 0)))} placeholder="Price (€)" className={field} />
              <input value={r.detail} onChange={(e) => setRow(i, "detail", e.target.value)} placeholder="What's included" className={field} />
            </div>
          </div>
        ))}
        <Button full variant="ghost" onClick={addRow}>
          <Icon name="plus" size={15} /> Add a package
        </Button>
        <Button full arrow disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save packages"}
        </Button>
      </div>
    </div>
  );
}

/* ---- Client company edit (unchanged; localStorage-backed) ----------------- */
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

  const clientDefaults: ClientProfile = { name: MY_COMPANY.name, industry: MY_COMPANY.industry, locations: MY_COMPANY.locations.join(", ") };
  const [client, setClient] = useState<ClientProfile>(clientDefaults);
  const [me, setMe] = useState<MyProfile | null>(null);

  const refreshMe = async () => setMe(await getMyProfile());

  useEffect(() => {
    setClient(loadClientProfile(clientDefaults));
    refreshMe().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          <MetricCard label="Processing" value={money(METRICS.inEscrow)} tone="escrow" sub="held, protected" />
          <MetricCard label="Total spent" value={money(METRICS.totalSpent)} />
        </div>

        <div className="rise" style={{ animationDelay: "180ms" }}>
          <SectionHeader title="Reviews from creators" />
          <div className="grid gap-4 md:grid-cols-2">
            {co.reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
          </div>
        </div>

        <MyPlan delay={240} />

        <div className="rise flex flex-wrap items-center gap-3" style={{ animationDelay: "300ms" }}>
          <Button variant="ghost" onClick={() => open(<EditCompanySheet initial={client} onSave={saveClient} />)}>Edit company profile</Button>
          <Button variant="ghost" href="/dashboard/account">Account &amp; privacy</Button>
          <Button variant="ghost" onClick={handleSignOut}>Sign out</Button>
        </div>
      </div>
    );
  }

  // creator — DB-backed profile
  if (!me) {
    return (
      <div className="rise flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-white/45">Loading your profile…</p>
      </div>
    );
  }

  const editInitial: CreatorEdit = {
    name: me.name,
    specialty: me.specialty,
    city: me.city,
    rate: me.rate,
    bio: me.bio,
    available: me.available,
    published: me.published,
  };
  const saveCreator = async (p: CreatorEdit) => {
    await saveMyProfile({ name: p.name, specialty: p.specialty, city: p.city, rate: p.rate, bio: p.bio, available: p.available, published: p.published });
    await refreshMe();
  };

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader eyebrow="Your profile" title="How clients see you" subtitle="Your public Grid profile. Keep your portfolio, packages and reviews sharp to win more bookings." tone="cyan" />
        <Surface radius="2rem" inner="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Avatar name={me.name} size={72} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-semibold tracking-tight text-white">{me.name || "Your name"}</h2>
                  {me.verified && <Verified size={17} className="text-grid-blue" />}
                </div>
                <p className="mt-1 text-sm text-white/55">
                  {me.specialty || "Add your specialty"}{me.city ? ` · ${me.city}` : ""}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {me.verified && <TrustBadge>ID Verified</TrustBadge>}
                  {me.available && <TrustBadge>Available Today</TrustBadge>}
                  <TrustBadge>{me.published ? "Live in marketplace" : "Draft — not listed"}</TrustBadge>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-72">
              <MetricCard label="Day rate" value={money(me.rate)} tone="cyan" />
              <MetricCard label="Rating" value={me.reviewCount ? `${me.rating} ★` : "—"} tone="gold" sub={`${me.reviewCount} review${me.reviewCount === 1 ? "" : "s"}`} />
            </div>
          </div>
          {me.bio && <p className="mt-6 max-w-2xl text-pretty text-sm leading-relaxed text-white/65">{me.bio}</p>}
        </Surface>
      </div>

      <div className="rise" style={{ animationDelay: "60ms" }}>
        <SectionHeader title="Portfolio" onClick={() => open(<PortfolioSheet items={me.portfolio} refresh={refreshMe} />)} cta="Manage" />
        {me.portfolio.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {me.portfolio.map((it) => (
              <MediaTile key={it.id} tile={{ title: "", from: "#1f3350", to: "#090c12" }} image={it.url} ratio="1 / 1" label={it.title} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/55">
            No portfolio work yet. Tap Manage to add your first piece.
          </div>
        )}
      </div>

      <div className="rise" style={{ animationDelay: "120ms" }}>
        <SectionHeader title="Media packages" onClick={() => open(<PackagesSheet initial={me.packages.map((p) => ({ name: p.name, price: p.price, detail: p.detail }))} refresh={refreshMe} />)} cta="Manage" />
        {me.packages.length > 0 ? (
          <div className="flex flex-col gap-3">
            {me.packages.map((p) => <PackageRow key={p.id} pkg={{ name: p.name, price: p.price, detail: p.detail }} />)}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/55">
            No packages yet. Tap Manage to add what clients can book.
          </div>
        )}
      </div>

      {me.reviews.length > 0 && (
        <div className="rise" style={{ animationDelay: "180ms" }}>
          <SectionHeader title="Reviews from clients" />
          <div className="grid gap-4 md:grid-cols-2">
            {me.reviews.map((r, i) => <ReviewCard key={i} review={r} />)}
          </div>
        </div>
      )}

      <MyPlan delay={240} />

      <div className="rise" style={{ animationDelay: "270ms" }}>
        <SectionHeader title="Payments" />
        <PaymentConnections />
      </div>

      <div className="rise flex flex-wrap items-center gap-3" style={{ animationDelay: "300ms" }}>
        <Button variant="ghost" onClick={() => open(<EditCreatorSheet initial={editInitial} onSave={saveCreator} />)}>Edit profile</Button>
        <Button variant="ghost" href="/dashboard/account">Account &amp; privacy</Button>
        <Button variant="ghost" onClick={handleSignOut}>Sign out</Button>
      </div>
    </div>
  );
}
