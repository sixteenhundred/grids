"use client";

import { useMemo, useState } from "react";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { joinWaitlist } from "@/lib/waitlist-actions";

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
/*  Feature boxes                                                              */
/* -------------------------------------------------------------------------- */

const FEATURES: { icon: IconName; label: string }[] = [
  { icon: "wallet", label: "Manage payments & contracts" },
  { icon: "kanban", label: "Keep track of every project" },
  { icon: "folder", label: "Store & transfer files" },
  { icon: "target", label: "Find work & get discovered" },
];

function FeatureBox({ icon, label }: { icon: IconName; label: string }) {
  return (
    <div className="flex flex-row items-center gap-3 rounded-2xl border border-white/15 bg-white/[0.07] px-4 py-3.5 text-left shadow-[0_8px_30px_-16px_rgba(0,0,0,0.8)] backdrop-blur-md transition-colors hover:border-white/30 hover:bg-white/[0.1] sm:flex-col sm:gap-2.5 sm:px-5 sm:py-5 sm:text-center">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10">
        <Icon name={icon} size={17} className="text-white/80" />
      </span>
      <span className="text-xs font-medium leading-snug text-white/85">{label}</span>
    </div>
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

      {/* bottom vignette — grounds the rainbow on darker ground */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5"
        style={{ background: "linear-gradient(to top, rgba(7,2,12,0.9), rgba(7,2,12,0))" }}
      />

      {/* content */}
      <div className="relative z-10 flex min-h-dvh flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-14">
          <div className="flex flex-col items-center gap-4">
            <GlassHeadline />
            <p className="max-w-xl text-center text-[11px] font-medium uppercase leading-relaxed tracking-[0.18em] text-white/70 sm:text-xs">
              Be one of the first in the world to step into a new era with Grid.
            </p>
          </div>

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

          {/* feature boxes */}
          <div className="w-full max-w-4xl">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((f) => (
                <FeatureBox key={f.label} icon={f.icon} label={f.label} />
              ))}
            </div>
            <p className="mt-4 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-white/45">
              + more
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
