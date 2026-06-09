import { Cta } from "./ui";

/** Compact contest value-prop box (2a). Reusable as a bento tile (e.g. beside the hero). */
export function ContestBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex flex-col justify-between overflow-hidden rounded-[1.75rem] border border-review-gold/25 bg-gradient-to-br from-review-gold/[0.14] to-white/[0.02] p-6 sm:p-7 ${className}`}
    >
      <div>
        <span className="inline-flex items-center rounded-full bg-review-gold/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-review-gold ring-1 ring-review-gold/25">
          Contests
        </span>
        <h3 className="mt-4 text-balance text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
          Compete. Get discovered. Get paid.
        </h3>
        <p className="mt-3 text-pretty text-sm leading-relaxed text-white/60">
          Enter brand-backed contests to win real prizes, land paid opportunities, and put your work in front of the brands
          hiring right now.
        </p>
      </div>
      <div className="mt-6">
        <Cta href="/signup">Enter a contest</Cta>
      </div>
    </div>
  );
}
