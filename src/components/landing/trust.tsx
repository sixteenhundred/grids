import { Reveal } from "./reveal";
import { Stagger, StaggerItem } from "./motion";

const BADGES = [
  "ID Verified",
  "Top Rated",
  "Licensed Drone Pilot",
  "Fast Delivery",
  "Paid on Time",
  "Escrow Protected",
  "Repeat Client",
  "Available Today",
];

const REVIEWS = [
  {
    quote:
      "Booked a cinematographer for a hotel launch in under an hour. Escrow kept it safe, and payment released the moment we approved the cut.",
    name: "Marte L.",
    role: "Marketing Lead · Hospitality",
    tone: "client",
  },
  {
    quote:
      "Grid replaced my messy DMs and unpaid invoices. Contracts, escrow and reviews in one place. My rate has gone up since clients trust the profile.",
    name: "Daniel V.",
    role: "Drone Pilot · Bergen",
    tone: "creator",
  },
  {
    quote:
      "We run monthly real-estate shoots through Grid retainers. Consistent quality, clear pricing, zero chasing. It just works.",
    name: "Property Co.",
    role: "Real-estate agency",
    tone: "client",
  },
];

export function Trust() {
  return (
    <section className="relative overflow-hidden px-4 py-24 sm:px-6 md:py-36">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mb-12 max-w-2xl">
          <h2 className="text-balance text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Trust, made visible.
          </h2>
          <p className="mt-5 text-pretty text-white/55">
            Verification, two-way reviews and on-time payment history sit at the
            center of every booking, not hidden in the fine print.
          </p>
        </Reveal>
      </div>

      {/* Badge marquee */}
      <div className="relative mb-14 flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="flex shrink-0 gap-3 pr-3" style={{ animation: "grid-marquee 32s linear infinite" }}>
          {[...BADGES, ...BADGES].map((b, i) => (
            <span
              key={`${b}-${i}`}
              className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/65"
            >
              <Shield />
              {b}
            </span>
          ))}
        </div>
      </div>

      <Stagger className="mx-auto grid max-w-7xl gap-4 md:grid-cols-3 md:gap-5" stagger={0.11}>
        {REVIEWS.map((r) => (
          <StaggerItem key={r.name} className="h-full">
            <figure className="flex h-full flex-col rounded-[2rem] border border-white/10 bg-white/[0.03] p-1.5">
              <div className="flex h-full flex-col rounded-[calc(2rem-0.375rem)] bg-[radial-gradient(120%_120%_at_0%_0%,#141519_0%,#0a0b0d_70%)] p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)]">
                <div className="flex gap-0.5 text-review-gold">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} />
                  ))}
                </div>
                <blockquote className="mt-5 flex-1 text-pretty text-sm leading-relaxed text-white/75">
                  “{r.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-white/8 pt-5">
                  <span
                    className={`h-9 w-9 shrink-0 rounded-full ${
                      r.tone === "client" ? "bg-aerial-cyan/25" : "bg-grid-blue/25"
                    }`}
                  />
                  <div>
                    <div className="text-sm font-medium text-white">{r.name}</div>
                    <div className="text-xs text-white/60">{r.role}</div>
                  </div>
                </figcaption>
              </div>
            </figure>
          </StaggerItem>
        ))}
      </Stagger>
    </section>
  );
}

function Star() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden>
      <path d="M7 1l1.7 3.9 4.3.4-3.2 2.9.9 4.2L7 10.9 3.3 12.4l.9-4.2L1 5.3l4.3-.4L7 1z" />
    </svg>
  );
}

function Shield() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 1l4.5 1.7v3.6c0 3-2 5-4.5 6-2.5-1-4.5-3-4.5-6V2.7L7 1z"
        stroke="#5AA9F5"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
      <path
        d="M5 7l1.4 1.4L9 5.8"
        stroke="#5AA9F5"
        strokeWidth="1.1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
