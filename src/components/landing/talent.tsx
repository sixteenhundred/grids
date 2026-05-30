import { ImagePlaceholder } from "./image-placeholder";
import { Reveal } from "./reveal";
import { Stagger, StaggerItem } from "./motion";
import { Eyebrow } from "./ui";

const CATEGORIES = [
  { name: "Photo", count: "2,400+", hint: "category-photo.jpg" },
  { name: "Video", count: "1,800+", hint: "category-video.jpg" },
  { name: "Drone", count: "640+", hint: "category-drone.jpg" },
  { name: "Production", count: "920+", hint: "category-production.jpg" },
  { name: "Editing", count: "1,100+", hint: "category-editing.jpg" },
  { name: "Crew", count: "780+", hint: "category-crew.jpg" },
];

const BADGES = ["ID Verified", "Top Rated", "Licensed Drone Pilot", "Available Today"];

export function Talent() {
  return (
    <section id="talent" className="relative px-4 py-24 sm:px-6 md:py-36">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <Reveal>
            <Eyebrow tone="blue">Verified talent</Eyebrow>
            <h2 className="mt-5 text-balance text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
              Browse creatives you can trust.
            </h2>
            <p className="mt-5 max-w-lg text-pretty text-white/55">
              Every profile shows verification, ratings, real reviews, day rates,
              locations, packages and a portfolio, so you can compare and book
              with zero guesswork.
            </p>

            {/* Verified profile card */}
            <div className="mt-9 max-w-md rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5">
              <div className="rounded-[calc(2rem-0.375rem)] bg-card-charcoal/80 p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                    <ImagePlaceholder label="" hint="" className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate font-semibold text-white">
                        John Hope
                      </span>
                      <VerifiedMark />
                    </div>
                    <span className="text-sm text-white/60">
                      Cinematographer · Oslo
                    </span>
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
                    <span
                      key={b}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/60"
                    >
                      {b}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
                  <span className="text-sm text-white/60">From</span>
                  <span className="text-sm font-semibold text-white">
                    €1,200{" "}
                    <span className="font-normal text-white/60">/ day</span>
                  </span>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Category bento */}
          <Stagger
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"
            stagger={0.08}
            delayChildren={0.1}
          >
            {CATEGORIES.map((cat) => (
              <StaggerItem key={cat.name}>
                <a
                  href="#"
                  className="group relative block overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-1.5 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-white/[0.06]"
                >
                  <ImagePlaceholder
                    label={cat.name}
                    hint={cat.hint}
                    className="h-32 rounded-[calc(1.5rem-0.375rem)] sm:h-40"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between p-4">
                    <span className="text-sm font-semibold text-white">
                      {cat.name}
                    </span>
                    <span className="font-mono text-[11px] text-white/55">
                      {cat.count}
                    </span>
                  </div>
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

function VerifiedMark() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1l1.8 1.1 2.1-.2 1 1.9 1.9 1-.2 2.1L16 8l-1.1 1.8.2 2.1-1.9 1-1 1.9-2.1-.2L8 15l-1.8-1.1-2.1.2-1-1.9-1.9-1 .2-2.1L0 8l1.1-1.8L.9 4.1l1.9-1 1-1.9 2.1.2L8 1z"
        fill="#0071E3"
      />
      <path
        d="M5.5 8.2l1.7 1.6L10.6 6"
        stroke="#fff"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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
