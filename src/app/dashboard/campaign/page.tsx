"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader, Surface, Card, Icon } from "@/components/dashboard/ui";
import {
  INTERESTS,
  AGE_BANDS,
  BUDGETS,
  TIMEFRAMES,
  ANALYSIS_STEPS,
  newCampaign,
  buildCampaign,
  upsertCampaign,
  loadCampaigns,
  relativeDate,
  type CampaignBrief,
  type SavedCampaign,
} from "@/lib/campaign";
import { generateConcepts } from "@/lib/campaign-actions";

/* ------------------------------ small atoms ------------------------------ */

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
        active
          ? "border-ai-purple/50 bg-ai-purple/15 text-white shadow-[0_0_20px_-6px] shadow-ai-purple/50"
          : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <span className="text-sm font-medium text-white">{children}</span>
      {hint && <span className="text-xs text-white/35">{hint}</span>}
    </div>
  );
}

/** Downscale an uploaded image to a small data URL so localStorage stays light. */
function toThumb(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 480;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* --------------------------------- page ---------------------------------- */

export default function CampaignPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [brand, setBrand] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [ageIdx, setAgeIdx] = useState(2); // default 18–35
  const [interests, setInterests] = useState<string[]>([]);
  const [budget, setBudget] = useState(2);
  const [weeks, setWeeks] = useState(2);

  const [saved, setSaved] = useState<SavedCampaign[]>([]);
  useEffect(() => setSaved(loadCampaigns()), []);

  // generation animation
  const [step, setStep] = useState(-1);
  const generating = step >= 0;

  function toggleInterest(i: string) {
    setInterests((cur) => (cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i]));
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 3 - images.length);
    const thumbs = await Promise.all(files.map(toThumb));
    setImages((cur) => [...cur, ...thumbs].slice(0, 3));
    if (fileRef.current) fileRef.current.value = "";
  }

  const ready = brand.trim().length > 0 || images.length > 0;

  async function generate() {
    if (!ready || generating) return;
    const band = AGE_BANDS[ageIdx];
    const brief: CampaignBrief = {
      brand: brand.trim(),
      images,
      ageMin: band.min,
      ageMax: band.max,
      interests,
      budget: BUDGETS[budget].value,
      weeks: TIMEFRAMES[weeks].weeks,
    };

    // Cycle the "thinking" steps while the server researches the web. The real
    // call (live Claude research, or instant deterministic fallback) decides
    // when we actually navigate.
    setStep(0);
    let i = 0;
    const tick = setInterval(() => {
      i = Math.min(i + 1, ANALYSIS_STEPS.length - 1);
      setStep(i);
    }, 700);

    let campaign: SavedCampaign;
    try {
      const { concepts } = await generateConcepts(brief);
      campaign = buildCampaign(brief, concepts);
    } catch {
      campaign = newCampaign(brief); // network/action failure → local concepts
    }
    clearInterval(tick);
    upsertCampaign(campaign);
    router.push(`/dashboard/campaign/${campaign.id}`);
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Grid Campaign"
          tone="purple"
          title="Make a campaign."
          subtitle="Describe your brand. Get three world-class campaign concepts — styled, planned and ready to run."
        />
      </div>

      {/* Brief card */}
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <Surface radius="2rem" inner="p-6 sm:p-8">
          {/* Brand */}
          <FieldLabel hint="or add reference images">What are you launching?</FieldLabel>
          <textarea
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="A unisex parfum for men and women — bold, modern, a little rebellious…"
            rows={3}
            className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/30 focus:border-ai-purple/50"
          />

          {/* image references */}
          <div className="mt-3 flex flex-wrap items-center gap-2.5">
            {images.map((src, i) => (
              <span key={i} className="group relative h-14 w-14 overflow-hidden rounded-xl border border-white/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => setImages((cur) => cur.filter((_, x) => x !== i))}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <Icon name="x" size={16} />
                </button>
              </span>
            ))}
            {images.length < 3 && (
              <button
                onClick={() => fileRef.current?.click()}
                className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-white/15 text-white/40 transition-colors hover:border-white/30 hover:text-white/70"
                aria-label="Add reference images"
              >
                <Icon name="plus" size={20} />
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={onPick} />
          </div>

          <div className="my-7 h-px bg-white/8" />

          {/* Audience */}
          <FieldLabel hint="target age">Who is it for?</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {AGE_BANDS.map((band, i) => (
              <Chip key={band.label} active={ageIdx === i} onClick={() => setAgeIdx(i)}>
                {band.label}
              </Chip>
            ))}
          </div>

          {/* Interests */}
          <div className="mt-6">
            <FieldLabel hint={interests.length ? `${interests.length} selected` : "tap a few"}>Their interests</FieldLabel>
            <div className="flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <Chip key={i} active={interests.includes(i)} onClick={() => toggleInterest(i)}>
                  {i}
                </Chip>
              ))}
            </div>
          </div>

          {/* Budget + time */}
          <div className="mt-6 grid gap-6 sm:grid-cols-2">
            <div>
              <FieldLabel>Budget</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {BUDGETS.map((bd, i) => (
                  <Chip key={bd.label} active={budget === i} onClick={() => setBudget(i)}>
                    {bd.label}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Time to make it</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {TIMEFRAMES.map((tf, i) => (
                  <Chip key={tf.label} active={weeks === i} onClick={() => setWeeks(i)}>
                    {tf.label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>

          {/* Generate */}
          <button
            onClick={generate}
            disabled={!ready || generating}
            className={`group mt-8 flex w-full items-center justify-center gap-2.5 rounded-full py-4 text-base font-semibold tracking-tight transition-all duration-300 ${
              ready && !generating
                ? "bg-ai-purple text-white hover:brightness-110"
                : "cursor-not-allowed bg-white/8 text-white/40"
            }`}
          >
            <Icon name="sparkles" size={19} className={generating ? "animate-pulse" : ""} />
            {generating ? "Creating your campaigns…" : "Generate 3 campaigns"}
          </button>
        </Surface>
      </div>

      {/* Recent campaigns */}
      {saved.length > 0 && (
        <div className="rise" style={{ animationDelay: "120ms" }}>
          <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">Recent campaigns</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {saved.map((c) => (
              <Link key={c.id} href={`/dashboard/campaign/${c.id}`}>
                <Card hover className="h-full p-5">
                  <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-ai-purple">
                    <Icon name="sparkles" size={13} /> {c.concepts.length} concepts
                  </div>
                  <h3 className="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-white">{c.brief.brand}</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {c.brief.interests.slice(0, 3).map((i) => (
                      <span key={i} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[11px] text-white/55">{i}</span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-white/40">
                    <span>{c.brief.ageMin}–{c.brief.ageMax} · €{c.brief.budget.toLocaleString()}</span>
                    <span>{relativeDate(c.createdAt)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08090c]/80 backdrop-blur-md">
          <div className="w-full max-w-xs px-6">
            <div className="mb-7 flex justify-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ai-purple/15 text-ai-purple ring-1 ring-ai-purple/30">
                <Icon name="sparkles" size={26} className="animate-pulse" />
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {ANALYSIS_STEPS.map((s, i) => (
                <div key={s} className={`flex items-center gap-3 text-sm transition-opacity duration-300 ${i <= step ? "text-white" : "text-white/30"}`}>
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full ${i < step ? "bg-escrow-green text-[#06140c]" : i === step ? "bg-ai-purple/20 text-ai-purple ring-1 ring-ai-purple/40" : "bg-white/8 text-white/30"}`}>
                    {i < step ? <Icon name="check" size={12} /> : i === step ? <span className="h-1.5 w-1.5 animate-ping rounded-full bg-ai-purple" /> : i + 1}
                  </span>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
