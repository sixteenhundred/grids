/**
 * ProfileRain — columns of circular "profile picture" avatars falling top→bottom
 * like Matrix rain, sized to sit behind the CTA headline. Pure CSS animation
 * (no hooks) with deterministic, index-derived timing so it renders identically
 * on the server and client (no hydration mismatch). Reduced-motion safe.
 */

// cyan → blue → violet → pink, to ride the page's blue↔pink background pulse
const TINTS = [
  "#22d3ee",
  "#38bdf8",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#c026d3",
  "#db2777",
  "#ec4899",
  "#f472b6",
];

const COLUMNS = Array.from({ length: 11 }, (_, i) => ({
  duration: 8 + ((i * 1.7) % 7), // 8–15s, varied per column
  delay: -((i * 1.9) % 9), // negative offsets desync the columns
  avatars: Array.from(
    { length: 6 },
    (_, j) => TINTS[(i * 3 + j * 2) % TINTS.length],
  ),
}));

function Avatar({ tint }: { tint: string }) {
  return (
    <span
      className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-1 ring-white/20 shadow-[0_6px_18px_-8px_rgba(0,0,0,0.7)]"
      style={{
        background: `radial-gradient(120% 120% at 30% 22%, ${tint}, rgba(8,10,22,0.9))`,
      }}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="8.4" r="3.7" fill="rgba(255,255,255,0.92)" />
        <path
          d="M4.8 20c0-4 3.2-6.8 7.2-6.8s7.2 2.8 7.2 6.8"
          fill="rgba(255,255,255,0.92)"
        />
      </svg>
    </span>
  );
}

export function ProfileRain() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <style>{`
        .pr-track { animation: prFall linear infinite; will-change: transform; }
        @keyframes prFall { from { transform: translateY(-50%); } to { transform: translateY(0); } }
        @media (prefers-reduced-motion: reduce) { .pr-track { animation: none; } }
      `}</style>
      <div
        className="absolute inset-0 flex justify-between gap-2 px-2 opacity-[0.45]"
        style={{
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, #000 14%, #000 72%, transparent)",
          maskImage:
            "linear-gradient(to bottom, transparent, #000 14%, #000 72%, transparent)",
        }}
      >
        {COLUMNS.map((col, i) => (
          <div key={i} className="relative flex-1">
            <div
              className="pr-track absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center gap-5"
              style={{
                animationDuration: `${col.duration}s`,
                animationDelay: `${col.delay}s`,
              }}
            >
              {[...col.avatars, ...col.avatars].map((tint, j) => (
                <Avatar key={j} tint={tint} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
