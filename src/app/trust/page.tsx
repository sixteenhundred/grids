import Link from "next/link";
import { Icon } from "@/components/dashboard/icons";
import { ACCENT } from "@/components/dashboard/ui";
import { TRUST_CATEGORIES, trustDocsByCategory, findTrustDoc } from "@/lib/trust";
import { TrustSearch } from "./trust-search";

export default function TrustHub() {
  const constitution = findTrustDoc("principles/constitution")!;
  const cats = TRUST_CATEGORIES.filter((c) => c.id !== "principles");

  return (
    <div className="mx-auto max-w-5xl px-6 py-14">
      <div className="max-w-2xl">
        <span className={`inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] ring-1 ${ACCENT.cyan.text} ${ACCENT.cyan.ring}`}>
          <Icon name="shield" size={12} /> Trust Center
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">Trust, in plain language.</h1>
        <p className="mt-4 text-pretty text-base leading-relaxed text-white/60">
          How GRID handles your data, money, security and AI — explained simply, with the controls you hold and the
          principles we hold ourselves to.
        </p>
      </div>

      <div className="mt-8 max-w-xl">
        <TrustSearch />
      </div>

      {/* Featured — the Constitution */}
      <Link
        href={`/trust/${constitution.path}`}
        className="mt-10 block overflow-hidden rounded-3xl border border-ai-purple/25 bg-gradient-to-br from-ai-purple/[0.12] to-transparent p-6 transition-colors hover:border-ai-purple/40 sm:p-8"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ai-purple/15 text-ai-purple ring-1 ring-ai-purple/30">
            <Icon name="shield" size={24} />
          </span>
          <div>
            <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-ai-purple">Our principles</div>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-white">{constitution.title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{constitution.summary}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-ai-purple">Read the Constitution →</span>
          </div>
        </div>
      </Link>

      {/* Category grid */}
      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cats.map((c) => {
          const a = ACCENT[c.tone];
          const count = trustDocsByCategory(c.id).length;
          return (
            <Link
              key={c.id}
              href={`/trust/${c.id}`}
              className="group flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.055]"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${a.tint} ${a.text} ring-1 ${a.ring}`}>
                <Icon name={c.icon} size={20} />
              </span>
              <div className="mt-3.5 text-sm font-semibold text-white">{c.title}</div>
              <p className="mt-1 flex-1 text-xs leading-snug text-white/50">{c.blurb}</p>
              {count > 0 && <span className="mt-3 text-[11px] text-white/35">{count} {count === 1 ? "document" : "documents"}</span>}
            </Link>
          );
        })}
      </div>

      <p className="mt-10 text-center text-xs text-white/35">
        Every policy is reachable within two clicks. Each carries a version and a last-reviewed date.
      </p>
    </div>
  );
}
