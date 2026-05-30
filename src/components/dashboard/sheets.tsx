"use client";

import { useRef, useState } from "react";
import { useSheet, SheetHeader, SheetRow } from "./sheet";
import { Button, StatusPill, ACCENT } from "./ui";
import { Icon, type IconName } from "./icons";
import {
  money,
  INVITE_LINK,
  INVITE_TIERS,
  NOTIFS,
  type Creative,
  type Package,
  type Role,
  type Category,
} from "@/lib/grid-data";

/* -------------------------------------------------------------------------- */
/*  Booking flow: escrow notice → digital contract → signed.                   */
/* -------------------------------------------------------------------------- */

export function BookingFlow({ creative, pkg }: { creative: Creative; pkg: Package }) {
  const { close } = useSheet();
  const [step, setStep] = useState<"book" | "contract" | "signed">("book");
  const fee = Math.round(pkg.price * 0.1);
  const total = pkg.price + fee;

  if (step === "book") {
    return (
      <div>
        <SheetHeader title={`Book ${creative.name}`} subtitle={`${pkg.name} · ${money(pkg.price)}`} />
        <div className="rounded-2xl border border-escrow-green/25 bg-escrow-green/[0.07] p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
              <Icon name="shield" size={18} />
            </span>
            <div className="font-semibold text-white">Grid Escrow protects this booking</div>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-white/65">
            {money(pkg.price)} is held securely the moment you sign, and released to {creative.name.split(" ")[0]} only after you approve the delivery.
          </p>
        </div>
        <div className="mt-6">
          <Button full tone="green" arrow onClick={() => setStep("contract")}>
            Continue to contract
          </Button>
        </div>
      </div>
    );
  }

  if (step === "contract") {
    return (
      <div>
        <SheetHeader title="Digital contract" subtitle="Binding · both parties sign on Grid." />
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-1">
          <SheetRow label="Creative" value={creative.name} />
          <SheetRow label="Package" value={pkg.name} />
          <SheetRow label="Scope" value={pkg.detail} />
          <SheetRow label="Subtotal" value={money(pkg.price)} />
          <SheetRow label="Grid fee (10%)" value={money(fee)} />
          <SheetRow label="Total in escrow" value={money(total)} strong />
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-white/50">
          <Icon name="lock" size={13} className="text-escrow-green" />
          Funds held by a regulated payment partner until you approve.
        </p>
        <div className="mt-6">
          <Button full tone="green" onClick={() => setStep("signed")}>
            <Icon name="lock" size={15} /> Sign &amp; fund escrow
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
        <Icon name="check" size={30} />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">Contract signed</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
        {money(total)} is held in Grid Escrow. {creative.name.split(" ")[0]} has been notified. Added to your Contracts &amp; Projects.
      </p>
      <div className="mt-6">
        <Button full onClick={close}>
          Done
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Post a job                                                                 */
/* -------------------------------------------------------------------------- */

const JOB_CATS: Category[] = ["Photo", "Video", "Drone"];
const TERMS = ["One-off", "Urgent", "1 month", "3 months", "6 months", "Retainer"];

export function PostJobSheet() {
  const { close } = useSheet();
  const [cat, setCat] = useState<Category>("Photo");
  const [urgent, setUrgent] = useState(false);
  const [term, setTerm] = useState("One-off");
  const [posted, setPosted] = useState(false);

  if (posted) {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-client-green/15 text-escrow-green ring-1 ring-client-green/30">
          <Icon name="check" size={30} />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">Job posted</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
          Your {cat.toLowerCase()} job is live in the marketplace{urgent ? " and pushed to Radar + the Urgent feed" : ""}. Matching creatives are being notified.
        </p>
        <div className="mt-6">
          <Button full tone="green" onClick={close}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SheetHeader title="Post a job" subtitle="Appears in the marketplace for creators to apply." />
      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Title</label>
      <input className="mb-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-client-green/50" placeholder="e.g. Listing shoot — cliffside villa" />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Category</label>
      <div className="mb-4 flex gap-2">
        {JOB_CATS.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${cat === c ? "bg-client-green text-white" : "bg-white/[0.05] text-white/60 hover:text-white"}`}
          >
            {c}
          </button>
        ))}
      </div>

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Budget</label>
      <input type="number" defaultValue={4000} className="mb-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-client-green/50" />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Engagement length</label>
      <div className="mb-4 flex flex-wrap gap-2">
        {TERMS.map((t) => (
          <button
            key={t}
            onClick={() => setTerm(t)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${term === t ? "bg-white/15 text-white" : "bg-white/[0.04] text-white/55 hover:text-white"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <button
        onClick={() => setUrgent((v) => !v)}
        className={`mb-6 flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors ${urgent ? "border-urgent-red/40 bg-urgent-red/10" : "border-white/10 bg-white/[0.03]"}`}
      >
        <span>
          <span className="block text-sm font-medium text-white">Mark as urgent</span>
          <span className="block text-xs text-white/45">Pushes to Radar + the Urgent feed</span>
        </span>
        <span className={`relative h-6 w-11 rounded-full transition-colors ${urgent ? "bg-urgent-red" : "bg-white/15"}`}>
          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${urgent ? "translate-x-5" : "translate-x-0.5"}`} />
        </span>
      </button>

      <Button full tone="green" onClick={() => setPosted(true)}>
        Post job
      </Button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Upload to portfolio                                                        */
/* -------------------------------------------------------------------------- */

export function UploadSheet() {
  const { close } = useSheet();
  const [file, setFile] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <SheetHeader title="Add to portfolio" subtitle="Upload a real image or video from your device." />
      <input
        ref={inputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0]?.name ?? null)}
      />
      <button
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] py-12 text-center transition-colors hover:border-aerial-cyan/50 hover:bg-white/[0.05]"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-aerial-cyan/12 text-aerial-cyan ring-1 ring-aerial-cyan/25">
          <Icon name="upload" size={22} />
        </span>
        <span className="text-sm text-white/70">{file ? file : "Tap to choose a photo or video"}</span>
      </button>
      <input className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-aerial-cyan/50" placeholder="Caption (optional)" />
      <div className="mt-6">
        <Button full disabled={!file} onClick={close}>
          Add to portfolio
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Notifications                                                              */
/* -------------------------------------------------------------------------- */

export function NotificationsSheet({ role }: { role: Role }) {
  const list = NOTIFS[role];
  return (
    <div>
      <SheetHeader title="Notifications" subtitle="Bookings, requests and updates." />
      <ul className="flex flex-col">
        {list.map((n, i) => {
          const a = ACCENT[n.accent];
          return (
            <li key={i} className="flex items-start gap-3 border-b border-white/8 py-4 last:border-0">
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${a.tint} ${a.text} ${a.ring}`}>
                <Icon name={n.icon as IconName} size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">{n.title}</span>
                  <span className="shrink-0 font-mono text-[11px] text-white/40">{n.when}</span>
                </div>
                <p className="mt-0.5 text-sm leading-snug text-white/55">{n.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Invite & earn                                                              */
/* -------------------------------------------------------------------------- */

export function InviteSheet() {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <SheetHeader title="Invite & earn" subtitle="Refer creatives, lower your fees." />
      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Your link</label>
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] py-2 pl-4 pr-2">
        <span className="flex-1 truncate font-mono text-sm text-white/80">{INVITE_LINK}</span>
        <Button
          onClick={() => {
            navigator.clipboard?.writeText(INVITE_LINK).catch(() => {});
            setCopied(true);
          }}
          className="!px-4 !py-2"
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
      <div className="mt-5 flex flex-col gap-2.5">
        {INVITE_TIERS.map((t) => (
          <div key={t.name} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
            <div>
              <div className="text-sm font-semibold text-white">{t.name}</div>
              <div className="text-xs text-white/45">{t.refs}</div>
            </div>
            <StatusPill tone={t.accent}>{t.perk}</StatusPill>
          </div>
        ))}
      </div>
    </div>
  );
}
