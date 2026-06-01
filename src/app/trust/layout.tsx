import Link from "next/link";
import type { Metadata } from "next";
import { ThemeProvider, ThemeToggle } from "@/components/theme";
import { CookieSettingsButton } from "@/components/cookie-consent";
import { Icon } from "@/components/dashboard/icons";
import { TRUST_CATEGORIES } from "@/lib/trust";

export const metadata: Metadata = {
  title: "GRID Trust Center",
  description:
    "How GRID handles your data, money, security and AI — in plain language. Policies, privacy controls, escrow, and the GRID Constitution.",
};

export default function TrustLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <div className="min-h-dvh bg-grid-black text-white">
        {/* header */}
        <header className="sticky top-0 z-30 border-b border-white/8 bg-grid-black/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-3.5">
            <Link href="/" className="text-lg font-semibold tracking-tight text-white">
              Grid<span className="text-grid-blue">.</span>
            </Link>
            <span className="text-white/25">/</span>
            <Link href="/trust" className="flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white">
              <Icon name="shield" size={15} className="text-aerial-cyan" /> Trust Center
            </Link>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <Link
                href="/dashboard"
                className="rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/[0.12]"
              >
                Open platform →
              </Link>
            </div>
          </div>
        </header>

        {children}

        {/* footer */}
        <footer className="border-t border-white/8">
          <div className="mx-auto max-w-5xl px-6 py-10">
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {TRUST_CATEGORIES.map((c) => (
                <Link key={c.id} href={`/trust/${c.id}`} className="text-sm text-white/55 transition-colors hover:text-white">
                  {c.title}
                </Link>
              ))}
              <CookieSettingsButton />
            </div>
            <p className="mt-6 max-w-2xl text-xs leading-relaxed text-white/40">
              GRID is marketplace infrastructure and a transaction facilitator — not a bank, lender or investment
              platform. Some documents are plain-language summaries pending final legal review; those are marked
              accordingly. We publish what we can prove and never claim more than reality.
            </p>
            <p className="mt-4 text-xs text-white/30">© {new Date().getFullYear()} GRID · Built on transparency.</p>
          </div>
        </footer>
      </div>
    </ThemeProvider>
  );
}
