"use client";

/**
 * FeatureGate — wraps every dashboard page. Free/owned features render as-is.
 * Locked features render an upgrade screen, unless the user has started a free
 * trial of that feature, in which case the real page renders behind a trial
 * banner and one preview credit is spent. When the credits run out, the upgrade
 * wall takes over ("Upgrade to continue creating").
 */

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { usePlan } from "./plan-context";
import { Icon } from "./icons";
import { featureKeyForHref } from "@/lib/features";
import {
  featurePlan,
  tierById,
  planLabel,
  fmtPrice,
  GATED_FEATURES,
  TRIAL_CREDITS,
} from "@/lib/plans";

type Mode = "loading" | "allow" | "trial" | "locked" | "exhausted";

export function FeatureGate({ children }: { children: ReactNode }) {
  const { ready, plan, hasAccess, trialCredits, startTrial, consumeTrial } = usePlan();
  const pathname = usePathname();
  const router = useRouter();

  const key = featureKeyForHref(pathname);
  const required = featurePlan(key);
  const locked = required !== "free";

  const [state, setState] = useState<{ key: string | null; mode: Mode }>({
    key: null,
    mode: locked ? "loading" : "allow",
  });

  useEffect(() => {
    if (!locked) return setState({ key, mode: "allow" });
    if (!ready) return setState({ key, mode: "loading" });
    if (hasAccess(key)) return setState({ key, mode: "allow" });
    const c = key ? trialCredits(key) : undefined;
    if (c === undefined) return setState({ key, mode: "locked" });
    if (c > 0) {
      if (key) consumeTrial(key);
      return setState({ key, mode: "trial" });
    }
    setState({ key, mode: "exhausted" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, plan, ready]);

  // While the gate is recomputing for a new route, don't flash a locked page.
  const mode: Mode = state.key === key ? state.mode : locked ? "loading" : "allow";

  if (mode === "allow") return <>{children}</>;
  if (mode === "loading") return <GateLoading />;

  const meta = GATED_FEATURES.find((f) => f.key === key);
  const tier = tierById(required);
  const label = meta?.label ?? "This feature";
  const tierName = tier?.name ?? planLabel(required);

  if (mode === "trial") {
    return (
      <>
        <TrialBanner
          label={label}
          tierName={tierName}
          price={tier?.price}
          left={key ? trialCredits(key) ?? 0 : 0}
        />
        {children}
      </>
    );
  }

  // locked (never tried) or exhausted (tried, out of credits)
  return (
    <UpgradeScreen
      mode={mode}
      label={label}
      blurb={meta?.blurb}
      icon={meta?.icon ?? "lock"}
      tierName={tierName}
      price={tier?.price}
      accent={tier?.accent ?? "text-aerial-cyan"}
      onTry={mode === "locked" && key ? () => { startTrial(key); consumeTrial(key); setState({ key, mode: "trial" }); } : undefined}
      onBack={() => router.push("/dashboard")}
    />
  );
}

function GateLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/15 border-t-white/70" />
    </div>
  );
}

function TrialBanner({
  label,
  tierName,
  price,
  left,
}: {
  label: string;
  tierName: string;
  price?: number;
  left: number;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-grid-blue/30 bg-grid-blue/[0.08] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grid-blue/20 text-aerial-cyan">
          <Icon name="sparkles" size={18} />
        </span>
        <div className="text-sm">
          <span className="font-medium text-white">Trial preview of {label}</span>
          <span className="ml-2 text-white/55">
            {left} free preview{left === 1 ? "" : "s"} left
          </span>
        </div>
      </div>
      <Link
        href="/dashboard/subscription"
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-grid-black transition-transform hover:scale-[1.02]"
      >
        Upgrade to {tierName}
        {price !== undefined && <span className="text-grid-black/60">· {fmtPrice(price)}/mo</span>}
      </Link>
    </div>
  );
}

function UpgradeScreen({
  mode,
  label,
  blurb,
  icon,
  tierName,
  price,
  accent,
  onTry,
  onBack,
}: {
  mode: "locked" | "exhausted";
  label: string;
  blurb?: string;
  icon: Parameters<typeof Icon>[0]["name"];
  tierName: string;
  price?: number;
  accent: string;
  onTry?: () => void;
  onBack: () => void;
}) {
  const exhausted = mode === "exhausted";
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(130%_130%_at_50%_-10%,#141526_0%,#08090b_70%)] p-8 text-center shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
        <div className="pointer-events-none absolute left-1/2 top-0 h-40 w-40 -translate-x-1/2 rounded-full bg-grid-blue/20 blur-3xl" />
        <span className={`relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.06] ring-1 ring-white/10 ${accent}`}>
          <Icon name={icon} size={28} />
          <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-grid-black text-white/80 ring-1 ring-white/15">
            <Icon name="lock" size={13} />
          </span>
        </span>

        <h2 className="relative mt-6 text-2xl font-semibold tracking-tight text-white">
          {exhausted ? `Upgrade to keep using ${label}` : `${label} is a ${tierName} feature`}
        </h2>
        <p className="relative mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/55">
          {exhausted
            ? `You've used your ${TRIAL_CREDITS} free previews. Upgrade to ${tierName} to keep creating without limits.`
            : blurb
              ? `${blurb}. Unlock it with ${tierName}${price !== undefined ? ` — ${fmtPrice(price)}/mo` : ""}.`
              : `Unlock ${label} with ${tierName}.`}
        </p>

        <div className="relative mt-7 flex flex-col gap-2.5">
          <Link
            href="/dashboard/subscription"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-grid-black transition-transform hover:scale-[1.02]"
          >
            Upgrade to {tierName}
            {price !== undefined && <span className="text-grid-black/55">· {fmtPrice(price)}/mo</span>}
          </Link>
          {onTry && (
            <button
              onClick={onTry}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.08]"
            >
              <Icon name="sparkles" size={16} className="text-aerial-cyan" />
              Try it free · {TRIAL_CREDITS} previews
            </button>
          )}
          <button
            onClick={onBack}
            className="mt-1 text-xs text-white/45 transition-colors hover:text-white/70"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
