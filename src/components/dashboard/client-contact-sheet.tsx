"use client";

import { useState } from "react";
import { useSheet, SheetHeader } from "./sheet";
import { Button, Icon } from "./ui";
import { COMPANY_SIZES } from "@/lib/client-plans";

const field =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-grid-blue/50";
const labelCls = "mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45";

type Tier = "Agency" | "Enterprise";

type Form = {
  company: string;
  org: string;
  size: string;
  locations: string;
  reason: string;
};

/**
 * Contact / request sheet for the paid client tiers. Enterprise asks the full
 * set the directive specifies (company name, org name, size, location(s), and
 * why they want to move to Enterprise). Demo only — submitting shows a success
 * state and does not send anything anywhere.
 */
export function ClientContactSheet({ tier }: { tier: Tier }) {
  const { close } = useSheet();
  const [f, setF] = useState<Form>({ company: "", org: "", size: COMPANY_SIZES[1], locations: "", reason: "" });
  const [sent, setSent] = useState(false);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((s) => ({ ...s, [k]: v }));

  const enterprise = tier === "Enterprise";

  if (sent) {
    return (
      <div className="py-6 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-escrow-green/15 text-escrow-green">
          <Icon name="check" size={26} />
        </span>
        <h2 className="mt-5 text-xl font-semibold text-white">Thanks — we&apos;ll be in touch</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/55">
          Our {enterprise ? "Enterprise" : "Agency"} team will reach out to {f.company || "your company"} shortly to set
          up your creative operation on GRID.
        </p>
        <div className="mt-6">
          <Button full tone="green" onClick={close}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SheetHeader
        title={enterprise ? "Talk to GRID Enterprise" : "Get started with Agency"}
        subtitle={
          enterprise
            ? "Tell us about your organization and we'll tailor Enterprise to your creative operation."
            : "Tell us about your company and we'll get your Agency plan set up."
        }
      />
      <div className="flex flex-col gap-4">
        <div>
          <label className={labelCls}>Company name</label>
          <input value={f.company} onChange={(e) => set("company", e.target.value)} className={field} placeholder="Acme Studios" />
        </div>
        <div>
          <label className={labelCls}>Organization / brand name</label>
          <input value={f.org} onChange={(e) => set("org", e.target.value)} className={field} placeholder="Acme Group" />
        </div>
        <div>
          <label className={labelCls}>Company size</label>
          <select value={f.size} onChange={(e) => set("size", e.target.value)} className={field}>
            {COMPANY_SIZES.map((s) => (
              <option key={s} value={s} className="bg-[#101114]">{s} people</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Location(s)</label>
          <input value={f.locations} onChange={(e) => set("locations", e.target.value)} className={field} placeholder="Los Angeles, CA · London, UK" />
        </div>
        <div>
          <label className={labelCls}>
            {enterprise ? "Why are you moving to Enterprise?" : "Tell us about your creative needs"}
          </label>
          <textarea
            value={f.reason}
            onChange={(e) => set("reason", e.target.value)}
            rows={4}
            className={`${field} resize-none leading-relaxed`}
            placeholder={
              enterprise
                ? "We run weekly campaigns across multiple departments and need structure, approvals and shared assets…"
                : "We produce content regularly and want advisor, performance and concierge…"
            }
          />
        </div>
        <Button full tone="green" arrow type="button" onClick={() => setSent(true)}>
          {enterprise ? "Request Enterprise" : "Request Agency"}
        </Button>
        <p className="text-center text-[11px] text-white/35">Demo — this doesn&apos;t send anything yet.</p>
      </div>
    </div>
  );
}
