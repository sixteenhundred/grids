"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { demoLogout } from "@/lib/demo-auth";
import { PageHeader, Surface, Button, Icon } from "@/components/dashboard/ui";
import {
  exportMyData,
  deleteMyAccount,
  getMyConsent,
  setMyConsent,
  type ConsentState,
} from "@/lib/account-actions";

function Toggle({ label, hint, on, onChange }: { label: string; hint: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!on)} className="flex w-full items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-left">
      <span className="min-w-0">
        <span className="block text-sm text-white">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-white/45">{hint}</span>
      </span>
      <span className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-full transition-colors ${on ? "bg-grid-blue" : "bg-white/15"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[1.125rem]" : "left-0.5"}`} />
      </span>
    </button>
  );
}

export default function AccountPage() {
  const router = useRouter();
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getMyConsent().then(setConsent).catch(() => setConsent({ cookies: false, ai: false, marketing: false }));
  }, []);

  async function updateConsent(patch: Partial<ConsentState>) {
    const next = { ...(consent ?? { cookies: false, ai: false, marketing: false }), ...patch };
    setConsent(next);
    try {
      await setMyConsent(next);
      setSavedAt(Date.now());
    } catch {
      /* keep optimistic state */
    }
  }

  async function downloadData() {
    setExporting(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "grid-my-data.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      /* ignore */
    }
    setExporting(false);
  }

  async function reallyDelete() {
    setDeleting(true);
    try {
      const res = await deleteMyAccount();
      if (res.ok) {
        await signOut().catch(() => {});
        await demoLogout().catch(() => {});
        router.push("/");
        return;
      }
    } catch {
      /* fall through */
    }
    setDeleting(false);
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader eyebrow="Account & privacy" title="Your data & consent" subtitle="Export a copy of your data, manage your consent, or delete your account. Every request is logged." tone="blue" />
      </div>

      {/* My Data */}
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <Surface radius="2rem" inner="p-6 sm:p-8">
          <h2 className="text-lg font-semibold tracking-tight text-white">My data</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            Download a machine-readable copy of your profile, projects, contracts, content and activity.
          </p>
          <div className="mt-5">
            <Button arrow disabled={exporting} onClick={downloadData}>
              <Icon name="download" size={15} /> {exporting ? "Preparing…" : "Download my data"}
            </Button>
          </div>

          <div className="mt-7 border-t border-white/10 pt-6">
            <h3 className="text-sm font-semibold text-white">Delete account</h3>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              Permanently delete your account and your data. Some financial and audit records are retained where law requires; we keep only what we must. This cannot be undone.
            </p>
            {!confirmDelete ? (
              <div className="mt-5">
                <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="!text-urgent-red hover:!bg-urgent-red/10">
                  Delete my account
                </Button>
              </div>
            ) : (
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button disabled={deleting} onClick={reallyDelete} className="!bg-urgent-red !text-white hover:!bg-urgent-red/90">
                  {deleting ? "Deleting…" : "Yes, permanently delete"}
                </Button>
                <Button variant="ghost" disabled={deleting} onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </Surface>
      </div>

      {/* Consent */}
      <div className="rise" style={{ animationDelay: "120ms" }}>
        <Surface radius="2rem" inner="p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold tracking-tight text-white">Consent</h2>
            {savedAt && <span className="text-xs text-escrow-green">Saved</span>}
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
            You control how your data is used. Withdrawing consent is as easy as giving it.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <Toggle
              label="Non-essential cookies"
              hint="Analytics and preferences. Essential cookies needed to run the site are always on."
              on={consent?.cookies ?? false}
              onChange={(v) => updateConsent({ cookies: v })}
            />
            <Toggle
              label="AI personalisation & improvement"
              hint="Allow your activity to help improve and personalise AI features. Off by default."
              on={consent?.ai ?? false}
              onChange={(v) => updateConsent({ ai: v })}
            />
            <Toggle
              label="Marketing emails"
              hint="Product news and tips. You can unsubscribe from any email at any time."
              on={consent?.marketing ?? false}
              onChange={(v) => updateConsent({ marketing: v })}
            />
          </div>
        </Surface>
      </div>
    </div>
  );
}
