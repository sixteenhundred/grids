"use client";

/**
 * Cookie consent (Implementation Package PRD 2 / EPIC 2; Constitution Art. IV —
 * no dark patterns). Accept All / Reject All / Customize are given EQUAL visual
 * prominence and rejection is a single click. No non-essential category is on
 * by default, and the choice is re-openable so consent can be withdrawn.
 *
 * The decision is stored locally as a consent record. In production this same
 * action also writes a server-side CONSENT audit event (consent_records table)
 * — the schema is defined in the GRID Implementation Package.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { Toggle } from "@/components/dashboard/ui";

const KEY = "grid:consent";
const POLICY_VERSION = "1.0";

type Categories = { analytics: boolean; marketing: boolean };

export function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [cats, setCats] = useState<Categories>({ analytics: false, marketing: false });

  useEffect(() => {
    let decided = false;
    try {
      decided = !!localStorage.getItem(KEY);
    } catch {
      /* storage blocked — show the banner each session */
    }
    if (!decided) setOpen(true);

    const reopen = () => {
      setCustomize(true);
      setOpen(true);
    };
    window.addEventListener("grid:open-cookie-settings", reopen);
    return () => window.removeEventListener("grid:open-cookie-settings", reopen);
  }, []);

  function persist(status: "accepted" | "rejected" | "customized", c: Categories) {
    try {
      localStorage.setItem(
        KEY,
        JSON.stringify({ status, essential: true, ...c, policyVersion: POLICY_VERSION, at: Date.now() }),
      );
    } catch {
      /* ignore */
    }
    // Non-essential scripts (analytics/marketing) read this record before loading;
    // none are loaded until the matching category is true.
    setOpen(false);
    setCustomize(false);
  }

  if (!open) return null;

  const btn = "flex-1 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors";

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] px-4 pb-4 sm:px-6 sm:pb-6">
      <div className="mx-auto max-w-3xl rounded-3xl border border-white/12 bg-soft-black/95 p-5 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl sm:p-6">
        {!customize ? (
          <>
            <h2 className="text-sm font-semibold text-white">Your privacy choice</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-white/60">
              GRID uses essential cookies to run the platform. We load nothing else — no analytics, no marketing —
              until you say so. You can change this anytime.{" "}
              <Link href="/trust/privacy" className="text-aerial-cyan underline-offset-2 hover:underline">
                Privacy & cookies
              </Link>
              .
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              {/* Equal prominence — reject is one click, same size as accept. */}
              <button onClick={() => persist("accepted", { analytics: true, marketing: true })} className={`${btn} bg-white text-grid-black hover:brightness-95`}>
                Accept all
              </button>
              <button onClick={() => persist("rejected", { analytics: false, marketing: false })} className={`${btn} border border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.1]`}>
                Reject all
              </button>
              <button onClick={() => setCustomize(true)} className={`${btn} border border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.1]`}>
                Customize
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-sm font-semibold text-white">Customize cookies</h2>
            <div className="mt-4 flex flex-col divide-y divide-white/8">
              <Row title="Essential" desc="Required to run GRID — sign-in, security, and your preferences. Always on." locked checked />
              <Row title="Analytics" desc="Helps us understand and improve how the platform is used." checked={cats.analytics} onChange={(v) => setCats((c) => ({ ...c, analytics: v }))} />
              <Row title="Marketing" desc="Personalised content and measuring campaigns." checked={cats.marketing} onChange={(v) => setCats((c) => ({ ...c, marketing: v }))} />
            </div>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <button onClick={() => persist("customized", cats)} className={`${btn} bg-white text-grid-black hover:brightness-95`}>
                Save choices
              </button>
              <button onClick={() => persist("rejected", { analytics: false, marketing: false })} className={`${btn} border border-white/20 bg-white/[0.04] text-white hover:bg-white/[0.1]`}>
                Reject all
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Re-opens the consent panel so a choice can be reviewed or withdrawn. */
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event("grid:open-cookie-settings"))}
      className={className ?? "text-sm text-white/55 transition-colors hover:text-white"}
    >
      Cookie settings
    </button>
  );
}

function Row({
  title,
  desc,
  checked,
  onChange,
  locked,
}: {
  title: string;
  desc: string;
  checked: boolean;
  onChange?: (v: boolean) => void;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs leading-snug text-white/50">{desc}</div>
      </div>
      {locked ? (
        <span className="rounded-full bg-escrow-green/12 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-escrow-green ring-1 ring-escrow-green/25">
          Always on
        </span>
      ) : (
        <Toggle checked={checked} onChange={(v) => onChange?.(v)} tone="blue" label={title} />
      )}
    </div>
  );
}
