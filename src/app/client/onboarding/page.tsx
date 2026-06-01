"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useClient } from "@/components/client/client-context";
import { useLocalState } from "@/components/client/use-local-state";
import { SectionTitle, Panel, PlanBadge, FileUploadZone } from "@/components/client/ui";
import { Button } from "@/components/dashboard/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { OperationBackground } from "@/components/dashboard/operation-bg";
import { CLIENT_KEYS, type ClientPlanId } from "@/lib/client/config";
import { COMPANY_SIZES, CLIENT_BG, CLIENT_TIERS } from "@/lib/client-plans";
import type { CompanyProfile } from "@/lib/client/mock";

/* ------------------------------------------------------------- step config -- */

type StepId = 0 | 1 | 2 | 3;

const STEPS: { id: StepId; label: string; icon: IconName; blurb: string }[] = [
  { id: 0, label: "Company", icon: "building", blurb: "The basics about your organization." },
  { id: 1, label: "Brand", icon: "sparkles", blurb: "How your brand looks and sounds." },
  { id: 2, label: "Operation", icon: "kanban", blurb: "How your media operation runs." },
  { id: 3, label: "Plan", icon: "command", blurb: "Choose the plan that fits your team." },
];

/* ---------------------------------------------------- onboarding draft shape -- */

type OnboardingDraft = {
  // brand presentation (non-overlapping with CompanyProfile)
  brandColors: string[];
  longDescription: string;
  servicesProducts: string;
  targetAudience: string;
  brandTone: string;
  logoUploaded: boolean;
  bannerUploaded: boolean;
  // media operation
  contentDepartment: string;
  monthlyVolume: string;
  creativeTypes: string[];
  projectTypes: string;
  budgetRange: string;
  teamSize: string;
  approvalProcess: string;
  storageNeeds: string;
};

const DEFAULT_DRAFT: OnboardingDraft = {
  brandColors: ["#13294b", "#0f6b4e", "#c9a35e", "#f4f1ea"],
  longDescription: "",
  servicesProducts: "",
  targetAudience: "",
  brandTone: "Confident, warm, editorial",
  logoUploaded: false,
  bannerUploaded: false,
  contentDepartment: "Brand & Content",
  monthlyVolume: "20–40 pieces / month",
  creativeTypes: [],
  projectTypes: "",
  budgetRange: "$5,000 – $25,000 / project",
  teamSize: "5",
  approvalProcess: "Single approver",
  storageNeeds: "Up to 500 GB",
};

const CREATIVE_TYPE_OPTIONS = [
  "Photography",
  "Cinematography",
  "Drone",
  "Social content",
  "Editing",
  "Motion / animation",
  "Food styling",
  "Copywriting",
];

const VOLUME_OPTIONS = [
  "Under 10 pieces / month",
  "10–20 pieces / month",
  "20–40 pieces / month",
  "40–80 pieces / month",
  "80+ pieces / month",
];

const BUDGET_OPTIONS = [
  "Under $2,000 / project",
  "$2,000 – $10,000 / project",
  "$5,000 – $25,000 / project",
  "$25,000 – $100,000 / project",
  "$100,000+ / project",
];

const APPROVAL_OPTIONS = [
  "Single approver",
  "Two-stage review",
  "Department sign-off",
  "Full approval workflow",
];

const STORAGE_OPTIONS = ["Up to 100 GB", "Up to 500 GB", "Up to 2 TB", "Unlimited (Enterprise)"];

const TONE_OPTIONS = [
  "Confident, warm, editorial",
  "Bold and energetic",
  "Minimal and refined",
  "Playful and friendly",
  "Authoritative and corporate",
];

/* ------------------------------------------------------------- field inputs -- */

const LABEL = "mb-1.5 block text-xs font-medium uppercase tracking-[0.12em] text-white/45";
const INPUT =
  "w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-grid-blue/50 focus:bg-white/[0.05]";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className={LABEL}>{label}</span>
      {children}
    </label>
  );
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
    <Field label={label}>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT}
      />
    </Field>
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
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${INPUT} appearance-none`}>
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#0c1117] text-white">
            {o}
          </option>
        ))}
      </select>
    </Field>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <Field label={label}>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${INPUT} resize-none`}
      />
    </Field>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "border-escrow-green/40 bg-client-green/15 text-escrow-green"
          : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06]"
      }`}
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------- page -- */

export default function OnboardingPage() {
  const router = useRouter();
  const { plan, setPlan, company, setCompany, toast } = useClient();

  const [step, setStep] = useState<StepId>(0);

  // Overlapping CompanyProfile fields live in a single form object (seeded from company).
  const [form, setForm] = useState({
    name: company.name,
    industry: company.industry,
    size: company.size,
    location: company.location,
    website: company.website,
    email: company.email,
    phone: company.phone,
    instagram: company.socials[0]?.handle ?? "",
    linkedin: company.socials[1]?.handle ?? "",
    tagline: company.tagline,
    shortDescription: company.shortDescription,
    about: company.about,
  });

  // Everything else persists to its own key.
  const [draft, setDraft] = useLocalState<OnboardingDraft>(CLIENT_KEYS.onboarding, DEFAULT_DRAFT);

  const [selectedPlan, setSelectedPlan] = useState<ClientPlanId>(plan);

  const setField = (k: keyof typeof form, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const setDraftField = <K extends keyof OnboardingDraft>(k: K, v: OnboardingDraft[K]) =>
    setDraft((p) => ({ ...p, [k]: v }));

  const toggleCreative = (t: string) =>
    setDraft((p) => ({
      ...p,
      creativeTypes: p.creativeTypes.includes(t)
        ? p.creativeTypes.filter((x) => x !== t)
        : [...p.creativeTypes, t],
    }));

  const buildCompany = (): CompanyProfile => ({
    ...company,
    name: form.name,
    industry: form.industry,
    size: form.size,
    location: form.location,
    website: form.website,
    email: form.email,
    phone: form.phone,
    tagline: form.tagline,
    shortDescription: form.shortDescription,
    about: form.about,
    brandColors: draft.brandColors,
    toneOfVoice: draft.brandTone,
    socials: [
      { label: "Instagram", handle: form.instagram },
      { label: "LinkedIn", handle: form.linkedin },
      { label: "Web", handle: form.website },
    ],
  });

  const saveDraft = () => {
    setCompany(buildCompany());
    // draft is already persisted by useLocalState on each change; touch it to be safe.
    setDraft((p) => ({ ...p }));
    toast("Draft saved");
  };

  const goNext = () => setStep((s) => Math.min(3, s + 1) as StepId);
  const goBack = () => setStep((s) => Math.max(0, s - 1) as StepId);

  const finish = () => {
    setPlan(selectedPlan);
    setCompany(buildCompany());
    toast("Welcome to GRID");
    router.push("/client/dashboard");
  };

  const progress = ((step + 1) / STEPS.length) * 100;
  const isLast = step === 3;

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden text-white">
      <OperationBackground on colors={CLIENT_BG} />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10 sm:px-6 sm:py-14">
        {/* header */}
        <div className="mb-7 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-grid-blue/20 text-aerial-cyan ring-1 ring-grid-blue/30">
              <Icon name="grid" size={18} />
            </span>
            <span className="text-sm font-semibold tracking-tight text-white">GRID for Clients</span>
          </div>
          <button
            type="button"
            onClick={() => router.push("/client/dashboard")}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-white/45 transition-colors hover:text-white/70"
          >
            Skip for now <Icon name="arrow" size={13} />
          </button>
        </div>

        {/* stepper */}
        <div className="mb-7">
          <div className="mb-3 flex items-center justify-between gap-2">
            {STEPS.map((s, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(s.id)}
                  className="group flex flex-1 flex-col items-center gap-2 text-center"
                >
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ring-1 transition-colors ${
                      current
                        ? "bg-grid-blue/25 text-aerial-cyan ring-grid-blue/40"
                        : done
                          ? "bg-client-green/20 text-escrow-green ring-client-green/30"
                          : "bg-white/[0.04] text-white/40 ring-white/10"
                    }`}
                  >
                    {done ? <Icon name="check" size={15} /> : <Icon name={s.icon} size={15} />}
                  </span>
                  <span
                    className={`hidden text-[11px] font-medium tracking-tight transition-colors sm:block ${
                      current ? "text-white" : "text-white/40"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-grid-blue transition-[width] duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-center text-[11px] uppercase tracking-[0.16em] text-white/35">
            Step {step + 1} of {STEPS.length}
          </p>
        </div>

        {/* card */}
        <Panel className="flex-1">
          <SectionTitle title={STEPS[step].label} subtitle={STEPS[step].blurb} />

          {step === 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <TextField label="Company name" value={form.name} onChange={(v) => setField("name", v)} placeholder="Acme Studios" />
              </div>
              <TextField label="Industry" value={form.industry} onChange={(v) => setField("industry", v)} placeholder="Hospitality, retail…" />
              <SelectField label="Company size" value={form.size} onChange={(v) => setField("size", v)} options={COMPANY_SIZES} />
              <TextField label="Location" value={form.location} onChange={(v) => setField("location", v)} placeholder="City, Country" />
              <TextField label="Website" value={form.website} onChange={(v) => setField("website", v)} placeholder="acme.studio" />
              <TextField label="Contact email" type="email" value={form.email} onChange={(v) => setField("email", v)} placeholder="hello@acme.studio" />
              <TextField label="Phone" value={form.phone} onChange={(v) => setField("phone", v)} placeholder="+1 555 000 0000" />
              <TextField label="Instagram" value={form.instagram} onChange={(v) => setField("instagram", v)} placeholder="@acme.studio" />
              <TextField label="LinkedIn" value={form.linkedin} onChange={(v) => setField("linkedin", v)} placeholder="Acme Studios" />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <span className={LABEL}>Logo</span>
                  <FileUploadZone
                    label={draft.logoUploaded ? "Logo added — replace?" : "Upload your logo"}
                    onAdd={() => {
                      setDraftField("logoUploaded", true);
                      toast("Logo added");
                    }}
                  />
                </div>
                <div>
                  <span className={LABEL}>Banner</span>
                  <FileUploadZone
                    label={draft.bannerUploaded ? "Banner added — replace?" : "Upload a banner image"}
                    onAdd={() => {
                      setDraftField("bannerUploaded", true);
                      toast("Banner added");
                    }}
                  />
                </div>
              </div>

              <div>
                <span className={LABEL}>Brand colors</span>
                <div className="flex flex-wrap gap-3">
                  {draft.brandColors.map((c, i) => (
                    <label key={i} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-2.5 py-2">
                      <input
                        type="color"
                        value={c}
                        onChange={(e) =>
                          setDraft((p) => ({
                            ...p,
                            brandColors: p.brandColors.map((x, xi) => (xi === i ? e.target.value : x)),
                          }))
                        }
                        className="h-7 w-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
                        aria-label={`Brand color ${i + 1}`}
                      />
                      <span className="text-[11px] font-mono uppercase text-white/55">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <TextField label="Tagline" value={form.tagline} onChange={(v) => setField("tagline", v)} placeholder="One line that sums you up" />
              <TextArea label="Short description" value={form.shortDescription} onChange={(v) => setField("shortDescription", v)} rows={2} placeholder="A sentence or two for previews." />
              <TextArea label="About your company" value={form.about} onChange={(v) => setField("about", v)} rows={4} placeholder="The fuller story of who you are." />
              <TextArea label="Services / products" value={draft.servicesProducts} onChange={(v) => setDraftField("servicesProducts", v)} rows={2} placeholder="What you offer." />
              <TextArea label="Target audience" value={draft.targetAudience} onChange={(v) => setDraftField("targetAudience", v)} rows={2} placeholder="Who you create for." />
              <SelectField label="Brand tone" value={draft.brandTone} onChange={(v) => setDraftField("brandTone", v)} options={TONE_OPTIONS} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <TextField label="Main content department" value={draft.contentDepartment} onChange={(v) => setDraftField("contentDepartment", v)} placeholder="Brand & Content" />
                <SelectField label="Monthly content volume" value={draft.monthlyVolume} onChange={(v) => setDraftField("monthlyVolume", v)} options={VOLUME_OPTIONS} />
              </div>

              <div>
                <span className={LABEL}>Creatives needed</span>
                <div className="flex flex-wrap gap-2">
                  {CREATIVE_TYPE_OPTIONS.map((t) => (
                    <Chip key={t} label={t} active={draft.creativeTypes.includes(t)} onClick={() => toggleCreative(t)} />
                  ))}
                </div>
              </div>

              <TextArea label="Common project types" value={draft.projectTypes} onChange={(v) => setDraftField("projectTypes", v)} rows={2} placeholder="Campaign shoots, product launches, social packs…" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <SelectField label="Preferred budget range" value={draft.budgetRange} onChange={(v) => setDraftField("budgetRange", v)} options={BUDGET_OPTIONS} />
                <TextField label="Team members" type="number" value={draft.teamSize} onChange={(v) => setDraftField("teamSize", v)} placeholder="5" />
                <SelectField label="Approval process" value={draft.approvalProcess} onChange={(v) => setDraftField("approvalProcess", v)} options={APPROVAL_OPTIONS} />
                <SelectField label="File storage needs" value={draft.storageNeeds} onChange={(v) => setDraftField("storageNeeds", v)} options={STORAGE_OPTIONS} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              {CLIENT_TIERS.map((tier) => {
                const active = selectedPlan === tier.id;
                return (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setSelectedPlan(tier.id)}
                    className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-colors ${
                      active ? `${tier.ring} bg-white/[0.06]` : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"
                    }`}
                  >
                    <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ${tier.accent}`}>
                      <Icon name={tier.gem} size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-semibold tracking-tight text-white">{tier.name}</span>
                        <span className={`text-sm font-medium ${tier.accent}`}>{tier.priceLabel}</span>
                        {tier.cadence && <span className="text-xs text-white/40">{tier.cadence}</span>}
                        {active && <PlanBadge plan={tier.id} className="ml-auto" />}
                      </div>
                      <p className="mt-1 text-sm text-white/55">{tier.positioning}</p>
                    </div>
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ring-1 transition-colors ${
                        active ? "bg-escrow-green/20 text-escrow-green ring-client-green/40" : "ring-white/15 text-transparent"
                      }`}
                    >
                      <Icon name="check" size={12} />
                    </span>
                  </button>
                );
              })}
              <p className="px-1 pt-1 text-[11px] text-white/35">
                Demo mode — all features stay unlocked regardless of plan. You can change this any time in settings.
              </p>
            </div>
          )}
        </Panel>

        {/* controls */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" onClick={goBack} disabled={step === 0}>
            <Icon name="chevron" size={15} className="rotate-180" /> Back
          </Button>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="dark" onClick={saveDraft}>
              <Icon name="check" size={15} /> Save
            </Button>
            {isLast ? (
              <Button tone="green" onClick={finish} arrow>
                Finish
              </Button>
            ) : (
              <Button tone="blue" onClick={goNext} arrow>
                Next
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
