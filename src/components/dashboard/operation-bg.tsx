"use client";

/**
 * OperationBackground — the same moving "aurora" treatment used on the waitlist
 * page, adapted for My Operation. Colours are driven by the workspace config
 * (customisable), and the whole thing can be switched off.
 *
 * Renders a fixed, behind-content layer (-z-10) so the page's glass widgets show
 * the animation through them, with a dark veil on top to keep data legible.
 * Self-contained: keyframes live in a scoped <style> so no global CSS changes.
 */

export function OperationBackground({ on, colors }: { on: boolean; colors: string[] }) {
  if (!on) return null;

  const stops = colors && colors.length ? colors : ["#f6c63f", "#ef8a26", "#de3a2f", "#9a31cf", "#4f43c9"];
  // Dark core at 0%, then spread the chosen colours across the rest of the radius.
  const spread = stops
    .map((c, i) => `${c} ${Math.round(14 + (i / Math.max(1, stops.length - 1)) * 82)}%`)
    .join(", ");
  const gradient = `radial-gradient(118% 120% at 50% 116%, #05030a 0%, ${spread})`;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <style>{`
        .op-aurora {
          transform-origin: 50% 116%;
          filter: saturate(1.15);
          animation: opAuroraBreathe 11s ease-in-out infinite;
        }
        .op-aurora-lines {
          background: repeating-radial-gradient(circle at 50% 116%,
            transparent 0 6.4vh,
            rgba(255,255,255,0.10) 6.55vh 6.8vh,
            transparent 6.95vh 12.5vh);
          mix-blend-mode: screen;
          animation: opAuroraBreathe 11s ease-in-out infinite;
        }
        @keyframes opAuroraBreathe { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
        @media (prefers-reduced-motion: reduce) { .op-aurora, .op-aurora-lines { animation: none; } }
      `}</style>

      <div className="op-aurora absolute inset-0" style={{ background: gradient }} />
      <div className="op-aurora-lines absolute inset-0" />
      {/* dark veil — keeps the dashboard data readable over the colour */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to bottom, rgba(8,9,12,0.62), rgba(8,9,12,0.42) 32%, rgba(8,9,12,0.72))" }}
      />
    </div>
  );
}
