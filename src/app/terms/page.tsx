import type { Metadata } from "next";
import Link from "next/link";
import { TERMS_INTRO, TERMS_SECTIONS, TERMS_LAST_UPDATED, TERMS_EFFECTIVE, type TermsBlock } from "@/lib/legal-terms";

export const metadata: Metadata = {
  title: "Terms of Service — Grid.",
  description: "The legally binding agreement governing your use of the GRID platform.",
};

function Blocks({ blocks }: { blocks: TermsBlock[] }) {
  return (
    <>
      {blocks.map((b, i) =>
        b.type === "p" ? (
          <p key={i} className="mt-3 text-[15px] leading-relaxed text-white/70 first:mt-0">
            {b.text}
          </p>
        ) : (
          <ul key={i} className="mt-3 flex flex-col gap-2 pl-1">
            {b.items.map((it, j) => (
              <li key={j} className="flex gap-2.5 text-[15px] leading-relaxed text-white/70">
                <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-aerial-cyan" />
                <span>{it}</span>
              </li>
            ))}
          </ul>
        ),
      )}
    </>
  );
}

export default function TermsPage() {
  return (
    <div id="top" className="min-h-dvh">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/8 bg-[#08090c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white">
            Grid<span className="text-grid-blue">.</span>
          </Link>
          <Link href="/" className="text-sm text-white/55 transition-colors hover:text-white">
            ← Back to site
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 sm:pt-16">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-aerial-cyan">Legal</span>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/60">
          These Terms constitute a legally binding agreement between you and GRID governing your access to and use of the Platform.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-white/45">
          <span>Last updated: {TERMS_LAST_UPDATED}</span>
          <span>Effective: {TERMS_EFFECTIVE}</span>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-24 sm:px-6 lg:grid-cols-[16rem_1fr]">
        {/* TOC */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 max-h-[calc(100dvh-8rem)] overflow-y-auto no-scrollbar">
            <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">Contents</div>
            <ol className="flex flex-col gap-0.5">
              {TERMS_SECTIONS.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-2 rounded-lg px-2 py-1.5 text-sm text-white/50 transition-colors hover:bg-white/[0.04] hover:text-white">
                    <span className="font-mono text-white/30">{s.n}.</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        {/* Content */}
        <main className="min-w-0">
          <section className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <Blocks blocks={TERMS_INTRO} />
            <p className="mt-4 text-[15px] font-medium leading-relaxed text-white/80">
              If you do not agree to these Terms, you must not access or use the Platform.
            </p>
          </section>

          <div className="mt-8 flex flex-col gap-8">
            {TERMS_SECTIONS.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-24">
                <h2 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight text-white">
                  <span className="font-mono text-sm text-aerial-cyan">{String(s.n).padStart(2, "0")}</span>
                  {s.title}
                </h2>
                <div className="mt-3 border-l border-white/8 pl-4 sm:pl-5">
                  <Blocks blocks={s.blocks} />
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-xs leading-relaxed text-white/45">
            This document contains placeholders in [brackets] (legal entity name, jurisdiction, dates, contact details) that must be completed before launch. It is provided for platform use and is not a substitute for advice from a qualified attorney.
          </div>

          <div className="mt-8 flex items-center gap-4 text-sm">
            <Link href="/" className="text-white/55 transition-colors hover:text-white">← Back to site</Link>
            <a href="#top" className="text-aerial-cyan transition-colors hover:text-white">Back to top ↑</a>
          </div>
        </main>
      </div>
    </div>
  );
}
