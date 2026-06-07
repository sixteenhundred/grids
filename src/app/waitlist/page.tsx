"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { joinWaitlist } from "@/lib/waitlist-actions";

/* -------------------------------------------------------------------------- */
/*  Data — features (creators prioritised)                                     */
/* -------------------------------------------------------------------------- */

const CREATOR_FEATURES: { icon: IconName; label: string; desc: string }[] = [
  { icon: "command", label: "My Operation", desc: "Your studio command center — pipeline, earnings, and tasks in one place." },
  { icon: "wallet", label: "Protected Payments", desc: "Client funds held safely and released when work is approved." },
  { icon: "folder", label: "File Transfer", desc: "Deliver finals to clients with secure, tracked download links." },
  { icon: "file", label: "Contracts", desc: "Draft, send, and e-sign agreements that protect both sides." },
  { icon: "sparkles", label: "AI Studio", desc: "Generate shoot concepts, briefs, and creative direction with AI." },
  { icon: "shop", label: "Shop", desc: "Sell presets, LUTs, and digital products from your own storefront." },
  { icon: "school", label: "Academy", desc: "Turn your expertise into courses and earn from teaching." },
  { icon: "play", label: "Campaign", desc: "AI-researched marketing campaign concepts, ready to pitch to brands." },
  { icon: "kanban", label: "Creative CRM", desc: "Track leads and deals through a visual sales pipeline." },
  { icon: "target", label: "First In Line", desc: "Get matched to briefs first and send proposals ahead of the pack." },
];

const CLIENT_FEATURES: { icon: IconName; label: string; desc: string }[] = [
  { icon: "sparkles", label: "Concierge", desc: "Tell us your goal and we'll line up the right creatives for you." },
  { icon: "layout", label: "Project Builder", desc: "Scope your shoot, budget, and deliverables in a guided flow." },
  { icon: "kanban", label: "Deliverable Tracker", desc: "Follow every milestone and approve work as it lands." },
];

/* -------------------------------------------------------------------------- */
/*  Liquid-glass headline (2D)                                                 */
/* -------------------------------------------------------------------------- */

function GlassHeadline() {
  const mask = useMemo(() => {
    const svg =
      `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1280 200'>` +
      `<text x='640' y='150' text-anchor='middle' ` +
      `font-family='Helvetica Neue,Helvetica,Arial,sans-serif' ` +
      `font-size='150' font-weight='800' letter-spacing='-3'>JOIN THE GRID</text></svg>`;
    return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
  }, []);

  const maskStyle: React.CSSProperties = {
    WebkitMaskImage: mask,
    maskImage: mask,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    WebkitMaskSize: "contain",
    maskSize: "contain",
  };

  return (
    <div className="relative w-full max-w-4xl" style={{ aspectRatio: "1280 / 200" }}>
      {/* soft outer glow */}
      <div className="absolute inset-0" style={{ ...maskStyle, background: "rgba(255,255,255,0.55)", filter: "blur(20px)", opacity: 0.35 }} />
      {/* frosted glass face — blurs & brightens the rainbow through the letters */}
      <div
        className="absolute inset-0"
        style={{
          ...maskStyle,
          background: "rgba(255,255,255,0.18)",
          backdropFilter: "blur(14px) brightness(1.3) saturate(1.5)",
          WebkitBackdropFilter: "blur(14px) brightness(1.3) saturate(1.5)",
        }}
      />
      {/* polished sheen — bright top edge fading down */}
      <div
        className="absolute inset-0"
        style={{
          ...maskStyle,
          background:
            "linear-gradient(176deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0.06) 42%, rgba(255,255,255,0) 60%, rgba(255,255,255,0.3) 100%)",
          mixBlendMode: "overlay",
        }}
      />
      <span className="sr-only">Join the Grid</span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Feature pill                                                               */
/* -------------------------------------------------------------------------- */

function Pill({ icon, label, desc, dim }: { icon: IconName; label: string; desc: string; dim?: boolean }) {
  return (
    <span className="group relative inline-block">
      <span
        tabIndex={0}
        className={`inline-flex cursor-default items-center gap-2 rounded-full border outline-none backdrop-blur-md transition-colors ${
          dim
            ? "border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] text-white/60 hover:border-white/25 focus-visible:border-white/35"
            : "border-white/20 bg-white/[0.1] px-3.5 py-2 text-xs text-white/90 shadow-[0_8px_30px_-16px_rgba(0,0,0,0.8)] hover:border-white/40 focus-visible:border-white/50"
        }`}
      >
        <Icon name={icon} size={dim ? 13 : 15} className={dim ? "text-white/45" : "text-white/75"} />
        {label}
      </span>

      {/* hover / focus tooltip — sits above the pill so it clears the page edge */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2.5 w-52 max-w-[80vw] -translate-x-1/2 translate-y-1 rounded-2xl border border-white/15 bg-[#0c0716]/90 px-3.5 py-2.5 text-center text-[11px] leading-relaxed text-white/80 opacity-0 shadow-[0_16px_50px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100"
      >
        {desc}
        <span className="absolute left-1/2 top-full h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-white/15 bg-[#0c0716]/90" />
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function WaitlistPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "loading") return;
    setStatus("loading");
    try {
      const r = await joinWaitlist(email);
      if (r.ok) setStatus("done");
      else {
        setError(r.message);
        setStatus("error");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#221a4d]">
      <style>{`
        .rainbow {
          background: radial-gradient(108% 118% at 50% 116%,
            #06020b 0%,
            #1a0a1e 9%,
            #f6c63f 17%,
            #ef8a26 24%,
            #de3a2f 31%,
            #cb2c6b 40%,
            #9a31cf 53%,
            #4f43c9 66%,
            #6a45b8 79%,
            #3b2c79 91%,
            #241a52 100%);
          transform-origin: 50% 116%;
          animation: hueshift 18s linear infinite, breathe 11s ease-in-out infinite;
        }
        /* the thin bright accent arcs that sit over the soft bands */
        .rainbow-lines {
          background: repeating-radial-gradient(circle at 50% 116%,
            transparent 0 6.4vh,
            rgba(255,255,255,0.12) 6.55vh 6.8vh,
            transparent 6.95vh 12.5vh);
          mix-blend-mode: screen;
          animation: breathe 11s ease-in-out infinite;
        }
        @keyframes hueshift { from { filter: saturate(1.25) hue-rotate(0deg); } to { filter: saturate(1.25) hue-rotate(360deg); } }
        @keyframes breathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @media (prefers-reduced-motion: reduce) {
          .rainbow, .rainbow-lines { animation: none; }
        }
      `}</style>

      {/* soft voluminous rainbow bands + faint crisp accent arcs */}
      <div aria-hidden className="rainbow absolute inset-0" />
      <div aria-hidden className="rainbow-lines absolute inset-0" />

      {/* bottom fade — seats the feature pills on darker ground */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
        style={{ background: "linear-gradient(to top, rgba(7,2,12,0.9), rgba(7,2,12,0))" }}
      />

      {/* content */}
      {/* Discreet entry into the live platform (demo). */}
      <Link
        href="/dashboard"
        className="absolute right-5 top-5 z-20 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white backdrop-blur-md transition-colors hover:bg-white/20"
      >
        Enter platform →
      </Link>

      <div className="relative z-10 flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-10 px-6 pt-16">
          <GlassHeadline />

          <div className="w-full max-w-md">
            {status === "done" ? (
              <div className="flex items-center justify-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black">
                  <Icon name="check" size={15} />
                </span>
                <span className="text-base font-semibold text-white">Get ready to earn with Grid</span>
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  placeholder="you@studio.com"
                  className="flex-1 rounded-full bg-white px-5 py-3.5 text-sm text-black shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] outline-none placeholder:text-neutral-400"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-full bg-black px-7 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10 transition-transform duration-200 hover:scale-[1.02] disabled:opacity-60"
                >
                  {status === "loading" ? "Joining…" : "Join"}
                </button>
              </form>
            )}
            {status === "error" && <p className="mt-3 text-center text-xs text-red-200">{error}</p>}
          </div>
        </div>

        {/* liquid-glass feature pills — creators prioritised */}
        <div className="w-full px-6 pb-10">
          <div className="mx-auto max-w-4xl">
            <div className="mb-2.5 text-center text-[10px] font-medium uppercase tracking-[0.28em] text-white/55">
              For creators
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {CREATOR_FEATURES.map((f) => (
                <Pill key={f.label} icon={f.icon} label={f.label} desc={f.desc} />
              ))}
            </div>

            <div className="mb-2.5 mt-6 text-center text-[10px] font-medium uppercase tracking-[0.28em] text-white/35">
              For clients
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {CLIENT_FEATURES.map((f) => (
                <Pill key={f.label} icon={f.icon} label={f.label} desc={f.desc} dim />
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
