import { ImagePlaceholder } from "./image-placeholder";
import { Reveal } from "./reveal";
import { Eyebrow } from "./ui";

const BADGES = ["ID Verified", "Top Rated", "Licensed Drone Pilot", "Available Today"];

const REVIEWS: { name: string; meta: string; rating: number; text: string; positive: boolean }[] = [
  {
    name: "Mara T.",
    meta: "Brand · Oslo",
    rating: 5,
    text: "Delivered a day early and the footage was stunning. We rebooked the same week.",
    positive: true,
  },
  {
    name: "Jonas R.",
    meta: "Agency · Berlin",
    rating: 4,
    text: "Great eye and a smooth shoot. Minor delay on the final edit round, but communication stayed clear throughout.",
    positive: true,
  },
  {
    name: "Priya S.",
    meta: "Studio · London",
    rating: 2,
    text: "Talented, but missed two must-have shots from the brief — we needed a short reshoot to land them.",
    positive: false,
  },
];

export function Talent() {
  return (
    <section id="talent" className="relative px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal>
          <Eyebrow tone="blue">Verified talent</Eyebrow>
          <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl">
            Creatives you can trust.
          </h2>
          <p className="mt-4 max-w-lg text-pretty text-white/55">
            Every profile shows verification, ratings, real reviews, day rates and a portfolio — so you can compare and
            book with zero guesswork.
          </p>
        </Reveal>

        <div className="mt-8 grid gap-4 lg:grid-cols-2 lg:items-start">
          {/* Profile */}
          <Reveal>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5">
              <div className="rounded-[calc(2rem-0.375rem)] bg-card-charcoal/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
                    <ImagePlaceholder src="gallery/left.jpg" className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-white">Sara Lindqvist</span>
                      <VerifiedMark />
                    </div>
                    <span className="text-sm text-white/60">Cinematographer · Oslo</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-review-gold">
                      <Star />
                      <span className="text-sm font-medium text-white">4.9</span>
                    </div>
                    <span className="text-xs text-white/60">128 reviews</span>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {BADGES.map((b) => (
                    <span key={b} className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60">
                      {b}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
                  <span className="text-sm text-white/60">From</span>
                  <span className="text-sm font-semibold text-white">
                    €1,200 <span className="font-normal text-white/60">/ day</span>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Reviews — honest, both sides */}
          <Reveal>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">What clients say</span>
                <span className="text-xs text-white/45">Verified reviews</span>
              </div>
              <div className="flex flex-col gap-3">
                {REVIEWS.map((r) => (
                  <div key={r.name} className="rounded-2xl border border-white/8 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-white">{r.name}</span>
                        <span className="ml-2 text-xs text-white/45">{r.meta}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Stars rating={r.rating} />
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ring-1 ${
                            r.positive
                              ? "bg-escrow-green/12 text-escrow-green ring-escrow-green/25"
                              : "bg-review-gold/12 text-review-gold ring-review-gold/25"
                          }`}
                        >
                          {r.positive ? "Positive" : "Critical"}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-snug text-white/60">{r.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? "text-review-gold" : "text-white/20"}>
          <Star />
        </span>
      ))}
    </span>
  );
}

function VerifiedMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1l1.8 1.1 2.1-.2 1 1.9 1.9 1-.2 2.1L16 8l-1.1 1.8.2 2.1-1.9 1-1 1.9-2.1-.2L8 15l-1.8-1.1-2.1.2-1-1.9-1.9-1 .2-2.1L0 8l1.1-1.8L.9 4.1l1.9-1 1-1.9 2.1.2L8 1z"
        fill="#0071E3"
      />
      <path d="M5.5 8.2l1.7 1.6L10.6 6" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Star() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <path d="M7 1l1.7 3.9 4.3.4-3.2 2.9.9 4.2L7 10.9 3.3 12.4l.9-4.2L1 5.3l4.3-.4L7 1z" />
    </svg>
  );
}
