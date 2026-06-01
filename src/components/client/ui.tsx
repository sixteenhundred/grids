"use client";

import Link from "next/link";
import { useRef, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/dashboard/icons";
import {
  canAccessFeature,
  featureBadge,
  planName,
  DEMO_MODE,
  type ClientFeature,
  type ClientPlanId,
} from "@/lib/client/config";
import { useClient } from "./client-context";

/* ----------------------------------------------------------------- badges -- */

export function PlanBadge({ plan, className = "" }: { plan: ClientPlanId; className?: string }) {
  const tone =
    plan === "enterprise"
      ? "bg-grid-blue/20 text-aerial-cyan"
      : plan === "agency"
        ? "bg-client-green/20 text-escrow-green"
        : "bg-white/10 text-white/70";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone} ${className}`}>
      {planName(plan)}
    </span>
  );
}

/** Small "Agency"/"Enterprise" tag for gated items (null for free features). */
export function FeatureTag({ feature, className = "" }: { feature: ClientFeature; className?: string }) {
  const b = featureBadge(feature);
  if (!b) return null;
  const tone = b === "Enterprise" ? "text-aerial-cyan ring-grid-blue/30" : "text-escrow-green ring-client-green/30";
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ring-1 ${tone} ${className}`}>
      {b}
    </span>
  );
}

export function DemoModeNotice({ className = "" }: { className?: string }) {
  if (!DEMO_MODE) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-review-gold/25 bg-review-gold/10 px-3 py-1 text-[11px] font-medium text-review-gold ${className}`}>
      <Icon name="sparkles" size={12} /> Demo mode — all features unlocked
    </span>
  );
}

/* ------------------------------------------------------------- feature gate -- */

export function UpgradePrompt({ feature }: { feature: ClientFeature }) {
  const need = featureBadge(feature) ?? "Agency";
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-grid-blue/15 text-aerial-cyan ring-1 ring-grid-blue/25">
        <Icon name="lock" size={26} />
      </span>
      <h3 className="mt-5 text-lg font-semibold text-white">This is a {need} feature</h3>
      <p className="mt-2 max-w-sm text-sm text-white/55">Upgrade your plan to unlock it for your whole company.</p>
      <Link href="/client/subscriptions" className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-grid-black transition-transform hover:scale-[1.02]">
        View plans
      </Link>
    </div>
  );
}

/** In demo mode always renders children; in launch mode blocks behind the plan. */
export function FeatureGate({ feature, children }: { feature: ClientFeature; children: ReactNode }) {
  const { plan } = useClient();
  if (canAccessFeature(plan, feature)) return <>{children}</>;
  return <UpgradePrompt feature={feature} />;
}

/* ------------------------------------------------------------------ layout -- */

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-white/55">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Glass card. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-sm sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  icon,
  href,
  accent = "text-aerial-cyan",
}: {
  label: string;
  value: string;
  sub?: string;
  icon: IconName;
  href?: string;
  accent?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-[0.14em] text-white/45">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] ${accent}`}>
          <Icon name={icon} size={16} />
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-white/45">{sub}</div>}
    </>
  );
  const cls =
    "block rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/[0.06]";
  return href ? (
    <Link href={href} className={cls}>{inner}</Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

const STATUS_TONES: Record<string, string> = {
  green: "bg-escrow-green/15 text-escrow-green",
  blue: "bg-grid-blue/15 text-aerial-cyan",
  cyan: "bg-aerial-cyan/15 text-aerial-cyan",
  gold: "bg-review-gold/15 text-review-gold",
  red: "bg-urgent-red/15 text-urgent-red",
  gray: "bg-white/8 text-white/60",
  purple: "bg-ai-purple/15 text-ai-purple",
};

export function StatusBadge({ label, tone = "gray" }: { label: string; tone?: keyof typeof STATUS_TONES }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${STATUS_TONES[tone] ?? STATUS_TONES.gray}`}>
      {label}
    </span>
  );
}

/* ---------------------------------------------------------------- uploader -- */

export function FileUploadZone({
  onAdd,
  label = "Drop files here or click to upload",
}: {
  onAdd: () => void;
  label?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div
      onClick={() => ref.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        onAdd();
      }}
      className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center transition-colors hover:border-grid-blue/40 hover:bg-white/[0.04]"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-aerial-cyan">
        <Icon name="upload" size={20} />
      </span>
      <span className="text-sm font-medium text-white/80">{label}</span>
      <span className="text-xs text-white/40">PNG, JPG, MP4, PDF — demo adds a sample file</span>
      <input
        ref={ref}
        type="file"
        className="hidden"
        onChange={() => onAdd()}
      />
    </div>
  );
}

/* -------------------------------------------------------------------- bars -- */

export function ProgressBar({ value, tone = "bg-grid-blue" }: { value: number; tone?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
      <div className={`h-full rounded-full transition-[width] duration-500 ${tone}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}
