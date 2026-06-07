import Link from "next/link";
import { Icon } from "@/components/dashboard/icons";

const TRUST = [
  { title: "Verified visual talent", desc: "ID-verified photographers, filmmakers and licensed drone pilots." },
  { title: "Protected by Grid", desc: "Funds held securely and released only on approval." },
  { title: "Contracts & two-way reviews", desc: "Clear scope, fair pay, reputation on both sides." },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden">
      {/* ambient mesh — echoes the landing hero */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10%] top-[-10%] h-[40rem] w-[40rem] rounded-full bg-grid-blue/15 blur-[130px]" />
        <div className="absolute bottom-[-15%] right-[-5%] h-[34rem] w-[34rem] rounded-full bg-client-green/10 blur-[130px]" />
        <div className="absolute right-[20%] top-[10%] h-[24rem] w-[24rem] rounded-full bg-aerial-cyan/10 blur-[130px]" />
      </div>

      <div className="relative grid min-h-dvh lg:grid-cols-2">
        {/* Brand panel */}
        <aside className="relative hidden flex-col justify-between border-r border-white/8 px-12 py-12 lg:flex">
          <Link href="/" className="text-xl font-semibold tracking-tight text-white">
            Grid<span className="text-grid-blue">.</span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.03em] text-white">
              Visual talent, booked with confidence.
            </h1>
            <p className="mt-5 text-pretty text-white/55">
              The marketplace and business platform for photographers, cinematographers and drone pilots.
            </p>

            <ul className="mt-10 flex flex-col gap-5">
              {TRUST.map((t) => (
                <li key={t.title} className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
                    <Icon name="check" size={15} />
                  </span>
                  <div>
                    <div className="font-medium text-white">{t.title}</div>
                    <div className="mt-0.5 text-sm text-white/50">{t.desc}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* mini escrow chip — product texture */}
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-xl">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-escrow-green/15 text-escrow-green">
              <span className="absolute inset-0 animate-ping rounded-full bg-escrow-green/20" />
              <Icon name="lock" size={16} />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">€3,600 secured</div>
              <div className="text-xs text-white/55">Secured · funded just now</div>
            </div>
          </div>
        </aside>

        {/* Form column */}
        <main className="flex items-center justify-center px-6 py-14 sm:px-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
      </div>
    </div>
  );
}
