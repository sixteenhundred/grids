"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { useClient } from "@/components/client/client-context";
import {
  SectionTitle,
  Panel,
  StatusBadge,
  PlanBadge,
  DemoModeNotice,
} from "@/components/client/ui";
import { Button } from "@/components/dashboard/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { DEFAULT_COMPANY, COMPANY_SLUG, type CompanyProfile } from "@/lib/client/mock";

/* -------------------------------------------------------------------------- */
/*  Shared field styles + small co-located inputs                              */
/* -------------------------------------------------------------------------- */

const FIELD =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-grid-blue/50 placeholder:text-white/30";

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">{children}</span>;
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        className={FIELD}
      />
    </label>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value))}
        className={FIELD}
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        className={`${FIELD} resize-y leading-relaxed`}
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        className={`${FIELD} appearance-none`}
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0c1117] text-white">
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

/** Comma-separated list field stored as string[] on the draft. */
function ListField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <Label>{label} — comma separated</Label>
      <input
        type="text"
        value={value.join(", ")}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(
            e.target.value
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
          )
        }
        className={FIELD}
      />
      {value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {value.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60"
            >
              {v}
            </span>
          ))}
        </div>
      )}
    </label>
  );
}

function PlaceholderTile({ label, icon }: { label: string; icon: IconName }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-6 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] text-aerial-cyan">
        <Icon name={icon} size={17} />
      </span>
      <span className="text-xs text-white/45">{label}</span>
    </div>
  );
}

const SIZE_OPTIONS = ["1–10", "11–50", "51–200", "201–500", "500+"];

/* -------------------------------------------------------------------------- */
/*  Live preview — mini public-profile card                                    */
/* -------------------------------------------------------------------------- */

function LivePreview({ draft }: { draft: CompanyProfile }) {
  const initial = (draft.name.trim()[0] ?? "?").toUpperCase();
  const colors = draft.brandColors.length ? draft.brandColors : DEFAULT_COMPANY.brandColors;
  const c0 = colors[0] ?? "#13294b";
  const c1 = colors[1] ?? colors[0] ?? "#0f3d2e";

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#0a0e14] shadow-[0_24px_70px_-30px_rgba(0,0,0,0.9)]">
      {/* banner */}
      <div
        className="relative h-28"
        style={{ background: `linear-gradient(120deg, ${c0}, ${c1})` }}
      >
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {draft.published && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-1 text-[10px] font-medium text-escrow-green backdrop-blur-sm">
            <Icon name="verified" size={11} /> Published
          </span>
        )}
      </div>

      <div className="px-5 pb-5">
        {/* logo circle */}
        <div className="-mt-9 flex items-end gap-3">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-semibold text-white ring-4 ring-[#0a0e14]"
            style={{ background: `linear-gradient(135deg, ${c0}, ${c1})` }}
          >
            {initial}
          </span>
        </div>

        <h3 className="mt-3 text-lg font-semibold tracking-tight text-white">
          {draft.name || "Your company"}
        </h3>
        {draft.tagline && <p className="mt-1 text-sm text-white/55">{draft.tagline}</p>}

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/45">
          {draft.industry && (
            <span className="inline-flex items-center gap-1">
              <Icon name="briefcase" size={12} /> {draft.industry}
            </span>
          )}
          {draft.location && (
            <span className="inline-flex items-center gap-1">
              <Icon name="pin" size={12} /> {draft.location}
            </span>
          )}
          {draft.website && (
            <span className="inline-flex items-center gap-1">
              <Icon name="globe" size={12} /> {draft.website}
            </span>
          )}
        </div>

        {draft.shortDescription && (
          <p className="mt-3 text-sm leading-relaxed text-white/65">{draft.shortDescription}</p>
        )}

        {/* brand color swatches */}
        {colors.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5">
            {colors.map((col, i) => (
              <span
                key={`${col}-${i}`}
                className="h-4 w-4 rounded-full ring-1 ring-white/15"
                style={{ background: col }}
                title={col}
              />
            ))}
          </div>
        )}

        {/* values chips */}
        {draft.values.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {draft.values.slice(0, 6).map((v, i) => (
              <span
                key={`${v}-${i}`}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/65"
              >
                {v}
              </span>
            ))}
          </div>
        )}

        {/* stats */}
        <div className="mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4">
          <div>
            <div className="text-lg font-semibold tracking-tight text-white">{draft.completedProjects}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Projects</div>
          </div>
          <div>
            <div className="flex items-center gap-1 text-lg font-semibold tracking-tight text-review-gold">
              <Icon name="star" size={14} /> {draft.reviewScore.toFixed(1)}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Rating</div>
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight text-escrow-green">{draft.responseTime || "—"}</div>
            <div className="text-[10px] uppercase tracking-wider text-white/40">Response</div>
          </div>
        </div>

        {/* hiring strip */}
        {draft.hiresFor.length > 0 && (
          <div className="mt-4">
            <div className="text-[10px] uppercase tracking-wider text-white/40">Hiring creatives for</div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {draft.hiresFor.slice(0, 6).map((h, i) => (
                <span
                  key={`${h}-${i}`}
                  className="rounded-full bg-grid-blue/15 px-2.5 py-1 text-[11px] text-aerial-cyan"
                >
                  {h}
                </span>
              ))}
            </div>
            {draft.budgetRange && (
              <div className="mt-2 text-xs text-white/50">Typical budget · {draft.budgetRange}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function CompanyProfilePage() {
  const { plan, company, setCompany, toast } = useClient();
  const router = useRouter();

  const [draft, setDraft] = useState<CompanyProfile>(company);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  // generic single-field updater
  function update<K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    setCompany(draft);
    toast("Profile saved");
  }

  function handlePublish() {
    const next = { ...draft, published: true };
    setDraft(next);
    setCompany(next);
    toast("Profile published");
  }

  function handleReset() {
    setDraft(DEFAULT_COMPANY);
    setCompany(DEFAULT_COMPANY);
    toast("Reset to demo data");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SectionTitle
        title="Company profile"
        subtitle="Customize how your company appears to creatives across GRID. Edit on the left, preview live on the right."
        action={
          <div className="flex items-center gap-2">
            <PlanBadge plan={plan} />
            <StatusBadge label={draft.published ? "Published" : "Draft"} tone={draft.published ? "green" : "gold"} />
          </div>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <DemoModeNotice />
      </div>

      {/* action bar */}
      <Panel className="mb-6 flex flex-wrap items-center gap-2.5">
        <Button tone="white" onClick={handleSave}>
          <Icon name="check" size={15} /> Save Changes
        </Button>
        <Button tone="escrow" onClick={handlePublish}>
          <Icon name="verified" size={15} /> Publish Profile
        </Button>
        <Button
          variant="ghost"
          onClick={() => router.push(`/company/${COMPANY_SLUG}`)}
        >
          <Icon name="globe" size={15} /> Preview Public Profile
        </Button>
        <Button variant="dark" onClick={handleReset}>
          <Icon name="arrow" size={15} /> Reset Demo Data
        </Button>
      </Panel>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        {/* ---------------------------------------------------------------- */}
        {/* LEFT — editable form                                             */}
        {/* ---------------------------------------------------------------- */}
        <div className="space-y-6">
          {/* Basic identity */}
          <Panel>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight text-white">
              <Icon name="building" size={16} className="text-aerial-cyan" /> Basic identity
            </h3>

            <div className="mb-4 grid grid-cols-2 gap-3">
              <PlaceholderTile label="Logo — upload" icon="camera" />
              <PlaceholderTile label="Banner — upload" icon="upload" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Company name" value={draft.name} onChange={(v) => update("name", v)} placeholder="Northline Studios" />
              <TextField label="Industry" value={draft.industry} onChange={(v) => update("industry", v)} />
              <TextField label="Location" value={draft.location} onChange={(v) => update("location", v)} />
              <SelectField label="Company size" value={draft.size} onChange={(v) => update("size", v)} options={SIZE_OPTIONS} />
              <TextField label="Website" value={draft.website} onChange={(v) => update("website", v)} placeholder="example.com" />
              <TextField label="Founded" value={draft.founded} onChange={(v) => update("founded", v)} placeholder="2017" />
              <TextField label="Email" value={draft.email} onChange={(v) => update("email", v)} type="email" />
              <TextField label="Phone" value={draft.phone} onChange={(v) => update("phone", v)} />
            </div>

            <div className="mt-4 space-y-3">
              {draft.socials.map((s, i) => (
                <div key={`${s.label}-${i}`} className="grid grid-cols-[120px_minmax(0,1fr)] gap-3">
                  <input
                    type="text"
                    value={s.label}
                    aria-label="Social label"
                    onChange={(e) =>
                      update(
                        "socials",
                        draft.socials.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)),
                      )
                    }
                    className={FIELD}
                  />
                  <input
                    type="text"
                    value={s.handle}
                    aria-label="Social handle"
                    onChange={(e) =>
                      update(
                        "socials",
                        draft.socials.map((x, j) => (j === i ? { ...x, handle: e.target.value } : x)),
                      )
                    }
                    className={FIELD}
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                onClick={() => update("socials", [...draft.socials, { label: "Social", handle: "" }])}
              >
                <Icon name="plus" size={14} /> Add social link
              </Button>
            </div>
          </Panel>

          {/* Brand presentation */}
          <Panel>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight text-white">
              <Icon name="sparkles" size={16} className="text-review-gold" /> Brand presentation
            </h3>
            <div className="space-y-4">
              <TextField label="Tagline" value={draft.tagline} onChange={(v) => update("tagline", v)} placeholder="One-line pitch" />
              <TextArea label="Short description" value={draft.shortDescription} onChange={(v) => update("shortDescription", v)} rows={2} />
              <TextArea label="About" value={draft.about} onChange={(v) => update("about", v)} rows={4} />
              <TextArea label="Mission" value={draft.mission} onChange={(v) => update("mission", v)} rows={2} />
              <ListField label="Values" value={draft.values} onChange={(v) => update("values", v)} placeholder="Craft over volume, Radical clarity" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField label="Visual style" value={draft.visualStyle} onChange={(v) => update("visualStyle", v)} />
                <TextField label="Tone of voice" value={draft.toneOfVoice} onChange={(v) => update("toneOfVoice", v)} />
              </div>
              <ListField label="Brand colors (hex)" value={draft.brandColors} onChange={(v) => update("brandColors", v)} placeholder="#0f3d2e, #13294b" />
            </div>
          </Panel>

          {/* Creative hiring identity */}
          <Panel>
            <h3 className="mb-4 flex items-center gap-2 text-base font-semibold tracking-tight text-white">
              <Icon name="users" size={16} className="text-escrow-green" /> Creative hiring identity
            </h3>
            <div className="space-y-4">
              <ListField label="Hires for" value={draft.hiresFor} onChange={(v) => update("hiresFor", v)} placeholder="Photography, Drone, Editing" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField label="Budget range" value={draft.budgetRange} onChange={(v) => update("budgetRange", v)} />
                <TextField label="Response time" value={draft.responseTime} onChange={(v) => update("responseTime", v)} />
                <NumberField label="Completed projects" value={draft.completedProjects} onChange={(v) => update("completedProjects", v)} />
                <NumberField label="Review score" value={draft.reviewScore} onChange={(v) => update("reviewScore", v)} step="0.1" />
              </div>
            </div>
          </Panel>
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* RIGHT — sticky live preview                                      */}
        {/* ---------------------------------------------------------------- */}
        <div className="lg:sticky lg:top-6 lg:h-fit">
          <Panel>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
                <Icon name="play" size={14} className="text-aerial-cyan" /> Live preview
              </h3>
              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] p-0.5">
                {(["desktop", "mobile"] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDevice(d)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                      device === d ? "bg-white text-grid-black" : "text-white/55 hover:text-white"
                    }`}
                  >
                    <Icon name={d === "desktop" ? "layout" : "command"} size={12} />
                    {d === "desktop" ? "Desktop" : "Mobile"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <div
                className="w-full transition-[max-width] duration-300"
                style={{ maxWidth: device === "mobile" ? 300 : "100%" }}
              >
                <LivePreview draft={draft} />
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-white/40">
              This is how creatives see your company on GRID. Save or publish to make it live.
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
