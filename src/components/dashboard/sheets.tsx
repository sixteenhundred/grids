"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSheet, SheetHeader, SheetRow } from "./sheet";
import { Button, StatusPill, ACCENT, Avatar, Stars, Verified, TrustBadge } from "./ui";
import { Icon, type IconName } from "./icons";
import { useRole } from "./role-context";
import {
  money,
  INVITE_LINK,
  INVITE_TIERS,
  NOTIFS,
  CREW_ROLES,
  type Creative,
  type CrewMember,
  type Job,
  type Notif,
  type Package,
  type Role,
  type Category,
} from "@/lib/grid-data";
import { loadDeliveries, relativeTime } from "@/lib/transfers";

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
            <div className="font-semibold text-white">Grid protects this booking</div>
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
          <SheetRow label="Total held securely" value={money(total)} strong />
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-white/50">
          <Icon name="lock" size={13} className="text-escrow-green" />
          Funds held by a regulated payment partner until you approve.
        </p>
        <div className="mt-6">
          <Button full tone="green" onClick={() => setStep("signed")}>
            <Icon name="lock" size={15} /> Sign &amp; fund securely
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
        {money(total)} is held securely by Grid. {creative.name.split(" ")[0]} has been notified. Added to your Contracts &amp; Projects.
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
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${cat === c ? "bg-client-green text-on-accent" : "bg-white/[0.05] text-white/60 hover:text-white"}`}
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
  // Surface delivery activity at the top of the feed.
  const all = loadDeliveries().filter((d) => d.markedDelivery);
  const deliveryNotifs: Notif[] =
    role === "client"
      ? all
          .filter((d) => d.status === "pending")
          .map((d) => ({
            icon: "folder",
            accent: "gold" as const,
            title: "New delivery to review",
            detail: `${d.files.length} watermarked preview${d.files.length === 1 ? "" : "s"} for ${d.projectTitle} — accept to unlock full files.`,
            when: relativeTime(d.createdAt),
          }))
      : all
          .filter((d) => d.status === "accepted")
          .map((d) => ({
            icon: "escrow",
            accent: "escrow" as const,
            title: "Delivery accepted — payment released",
            detail: `${d.client} accepted ${d.projectTitle}. ${money(d.value)} released to you.`,
            when: relativeTime(d.acceptedAt ?? d.createdAt),
          }));
  const list = [...deliveryNotifs, ...NOTIFS[role]];
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

/* -------------------------------------------------------------------------- */
/*  Collab — add crew & manage an individual crew member                       */
/* -------------------------------------------------------------------------- */

/** Role picker + free-text override, shared by add and manage flows. */
function RolePicker({ role, onRole }: { role: string; onRole: (r: string) => void }) {
  return (
    <>
      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Role</label>
      <div className="mb-3 flex flex-wrap gap-2">
        {CREW_ROLES.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRole(r)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${role === r ? "bg-grid-blue text-on-accent" : "bg-white/[0.05] text-white/60 hover:text-white"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <input
        value={role}
        onChange={(e) => onRole(e.target.value)}
        placeholder="Or type a custom role"
        className="mb-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-grid-blue/50"
      />
    </>
  );
}

/** Revenue-share slider. `available` is the % pool this member may draw from. */
function SplitSlider({ pay, available, onPay }: { pay: number; available: number; onPay: (n: number) => void }) {
  const leadKeeps = Math.max(0, available - pay);
  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-xs uppercase tracking-[0.14em] text-white/45">Revenue share</label>
        <span className="font-mono text-sm font-semibold text-aerial-cyan">{pay}%</span>
      </div>
      <input
        type="range"
        min={1}
        max={Math.max(1, available)}
        value={pay}
        onChange={(e) => onPay(Number(e.target.value))}
        className="w-full accent-grid-blue"
      />
      <p className="mt-2 text-xs text-white/45">
        Lead keeps <span className="font-medium text-white/70">{leadKeeps}%</span> of this project.
      </p>
    </>
  );
}

/** Add a new crew member with a role and revenue share. `available` = lead %. */
export function AddCrewSheet({ available, onAdd }: { available: number; onAdd: (m: CrewMember) => void }) {
  const { close } = useSheet();
  const [name, setName] = useState("");
  const [role, setRole] = useState<string>(CREW_ROLES[0]);
  const [pay, setPay] = useState(Math.min(15, Math.max(1, available)));

  const canSave = name.trim().length > 0 && role.trim().length > 0 && pay >= 1 && pay <= available;

  if (available < 1) {
    return (
      <div>
        <SheetHeader title="Add crew" subtitle="No revenue share left to allocate." />
        <p className="text-sm leading-relaxed text-white/60">
          The full 100% is already split between you and your crew. Lower an existing member’s share first, then add someone new.
        </p>
        <div className="mt-6">
          <Button full onClick={close}>
            Got it
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SheetHeader title="Add crew" subtitle="Name a role and set their revenue share — no extra account needed." />
      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Ava Mreng"
        className="mb-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-grid-blue/50"
      />
      <RolePicker role={role} onRole={setRole} />
      <SplitSlider pay={pay} available={available} onPay={setPay} />
      <div className="mt-6">
        <Button full disabled={!canSave} onClick={() => { onAdd({ id: `cr${Date.now()}`, name: name.trim(), role: role.trim(), pay }); close(); }}>
          Add to team
        </Button>
      </div>
    </div>
  );
}

/** Manage one crew member: change role, adjust split, or remove them. */
export function ManageCrewSheet({
  member,
  available,
  onUpdate,
  onRemove,
}: {
  member: CrewMember;
  available: number;
  onUpdate: (m: CrewMember) => void;
  onRemove: (id: string) => void;
}) {
  const { close } = useSheet();
  const [role, setRole] = useState(member.role);
  const [pay, setPay] = useState(member.pay);

  const canSave = role.trim().length > 0 && pay >= 1 && pay <= available;

  return (
    <div>
      <SheetHeader title={member.name} subtitle="Adjust this crew member’s role and revenue share." />
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <Avatar name={member.name} />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{member.name}</div>
          <div className="text-sm text-white/55">{role || "—"} · {pay}%</div>
        </div>
      </div>
      <RolePicker role={role} onRole={setRole} />
      <SplitSlider pay={pay} available={available} onPay={setPay} />
      <div className="mt-6 flex flex-col gap-2.5">
        <Button full disabled={!canSave} onClick={() => { onUpdate({ ...member, role: role.trim(), pay }); close(); }}>
          Save changes
        </Button>
        <Button
          full
          variant="ghost"
          onClick={() => { onRemove(member.id); close(); }}
          className="!text-urgent-red hover:!bg-urgent-red/10"
        >
          Remove from team
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Apply to a job — quick message + apply CTA                                 */
/* -------------------------------------------------------------------------- */

export function ApplyJobSheet({ job }: { job: Job }) {
  const { close } = useSheet();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
          <Icon name="check" size={30} />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">Application sent</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
          {job.company} can now see your profile and message. You’ll be notified if they want to book you.
        </p>
        <div className="mt-6">
          <Button full onClick={close}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SheetHeader title="Apply for this job" subtitle={`${job.title} · ${job.company}`} />

      <div className="mb-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm text-white/60">
          <Icon name="pin" size={14} /> {job.loc}
        </span>
        <span className="font-mono text-sm font-semibold text-white">
          {money(job.budget)}
          {job.budgetPer ? <span className="font-normal text-white/60"> {job.budgetPer}</span> : null}
        </span>
      </div>

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Quick message</label>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        autoFocus
        placeholder={`Hi ${job.company}, I'd love to shoot this. Here's why I'm a great fit…`}
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/35 focus:border-grid-blue/50"
      />
      <p className="mt-2 text-xs text-white/40">Your profile, portfolio and rating are attached automatically.</p>

      <div className="mt-6 flex flex-col gap-2.5">
        <Button full arrow onClick={() => setSent(true)}>
          Apply for job
        </Button>
        <Button full variant="ghost" disabled={!message.trim()} onClick={() => setSent(true)}>
          Send message only
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Message a profile — quick prompts + free-text, reusable for any profile.   */
/* -------------------------------------------------------------------------- */

const MESSAGE_PROMPTS = [
  "Discuss the location & premises",
  "Check availability for my dates",
  "Request a custom package",
  "Share my project details",
];

export function MessageSheet({ name, avatarId, subtitle }: { name: string; avatarId?: string; subtitle?: string }) {
  const { close } = useSheet();
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const first = name.split(" ")[0];

  if (sent) {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-grid-blue/15 text-aerial-cyan ring-1 ring-grid-blue/30">
          <Icon name="comment" size={28} />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">Message sent</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
          {first} has been notified and will reply in your inbox. You can keep talking before anything is booked.
        </p>
        <div className="mt-6">
          <Button full onClick={close}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SheetHeader title={`Message ${first}`} subtitle={subtitle ?? "Talk through the details before you book."} />

      <div className="mb-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3">
        <Avatar id={avatarId} name={name} size={40} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">{name}</div>
          <div className="text-xs text-white/45">Usually replies within a few hours</div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {MESSAGE_PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setMessage(p + ": ")}
            className="rounded-full bg-white/[0.05] px-3 py-1.5 text-xs text-white/60 transition-colors hover:text-white"
          >
            {p}
          </button>
        ))}
      </div>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        autoFocus
        placeholder={`Hi ${first}, I'd love to talk about a shoot…`}
        className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/35 focus:border-grid-blue/50"
      />

      <div className="mt-6">
        <Button full arrow disabled={!message.trim()} onClick={() => setSent(true)}>
          Send message
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Quick profile popup — role-aware actions (featured rail, etc.)             */
/* -------------------------------------------------------------------------- */

export function QuickProfileSheet({ creative }: { creative: Creative }) {
  const { open, close } = useSheet();
  const { role } = useRole();
  const router = useRouter();
  const first = creative.name.split(" ")[0];
  const subtitle = `${creative.type} · ${creative.city} · ${money(creative.rate)}/day`;

  const message = () => open(<MessageSheet name={creative.name} avatarId={creative.id} subtitle={subtitle} />);
  const checkProfile = () => {
    close();
    router.push(`/dashboard/creative/${creative.id}`);
  };

  return (
    <div>
      <div className="flex items-center gap-4">
        <Avatar id={creative.id} name={creative.name} size={56} />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="truncate text-xl font-semibold tracking-tight text-white">{creative.name}</h2>
            {creative.verified && <Verified size={17} className="text-grid-blue" />}
          </div>
          <p className="mt-0.5 text-sm text-white/55">{creative.type} · {creative.city}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <Stars rating={creative.rating} size={13} />
            <span className="text-xs text-white/45">({creative.reviews})</span>
            <span className="text-xs font-medium text-white/70">· {money(creative.rate)}/day</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {creative.verified && <TrustBadge>ID Verified</TrustBadge>}
        {creative.topRated && <TrustBadge>Top Rated</TrustBadge>}
        {creative.available && <TrustBadge>Available Today</TrustBadge>}
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-white/65">{creative.bio}</p>

      <div className="mt-6 flex flex-col gap-2.5">
        {role === "client" && creative.packages.length > 0 && (
          <Button full tone="green" arrow onClick={() => open(<BookingFlow creative={creative} pkg={creative.packages[0]} />)}>
            Book {first}
          </Button>
        )}
        <Button full tone={role === "client" ? "white" : "blue"} variant={role === "client" ? "ghost" : "solid"} arrow onClick={message}>
          Message {first}
        </Button>
        <Button full variant="ghost" onClick={checkProfile}>
          Check profile
        </Button>
      </div>
    </div>
  );
}
