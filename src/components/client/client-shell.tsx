"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/dashboard/icons";
import { CLIENT_NAV, CLIENT_BOTTOM_NAV, isClientNavActive } from "@/lib/client/nav";
import { COMPANY_SLUG } from "@/lib/client/mock";
import { useClient } from "./client-context";
import { PlanBadge, FeatureTag, DemoModeNotice } from "./ui";
import { ExperienceSwitcher } from "@/components/experience-switcher";

export function ClientShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { plan, company } = useClient();
  const [drawer, setDrawer] = useState(false);

  const nav = (
    <>
      {CLIENT_NAV.map((g, gi) => (
        <div key={gi} className={gi > 0 ? "mt-6" : ""}>
          {g.heading && (
            <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">{g.heading}</div>
          )}
          <ul className="flex flex-col gap-0.5">
            {g.items.map((item) => {
              const active = isClientNavActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setDrawer(false)}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                      active ? "bg-white/[0.07] font-medium text-white" : "text-white/55 hover:bg-white/[0.03] hover:text-white"
                    }`}
                  >
                    <span className={active ? "text-aerial-cyan" : "text-white/45 group-hover:text-white/70"}>
                      <Icon name={item.icon} size={18} />
                    </span>
                    <span className="flex-1">{item.label}</span>
                    {item.feature && <FeatureTag feature={item.feature} />}
                    {item.external && <Icon name="arrow" size={13} className="text-white/30" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
      <div className="mt-6 border-t border-white/8 pt-4">
        {CLIENT_BOTTOM_NAV.map((item) => {
          const active = isClientNavActive(pathname, item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={() => setDrawer(false)}
              className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                active ? "bg-white/[0.07] font-medium text-white" : "text-white/55 hover:bg-white/[0.03] hover:text-white"
              }`}
            >
              <Icon name={item.icon} size={18} className={item.label.includes("Plans") ? "text-escrow-green" : "text-white/45"} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );

  return (
    <div className="relative min-h-dvh lg:flex">
      {/* navy → green ambient depth */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 h-[34rem] w-[34rem] rounded-full bg-grid-blue/10 blur-[150px]" />
        <div className="absolute bottom-0 right-0 h-[30rem] w-[30rem] rounded-full bg-client-green/10 blur-[150px]" />
        <div className="absolute left-1/2 top-1/3 h-[22rem] w-[22rem] rounded-full bg-aerial-cyan/[0.04] blur-[140px]" />
      </div>

      {/* desktop sidebar */}
      <aside className="sticky top-0 z-30 hidden h-dvh w-64 shrink-0 flex-col border-r border-white/8 bg-grid-black/60 px-4 py-6 backdrop-blur-xl lg:flex">
        <Link href="/client/dashboard" className="px-1 text-xl font-semibold tracking-tight text-white">
          Grid<span className="text-grid-blue">.</span>
          <span className="ml-1.5 text-[10px] font-medium uppercase tracking-[0.2em] text-aerial-cyan">for Clients</span>
        </Link>
        <div className="mt-3">
          <ExperienceSwitcher current="clients" />
        </div>
        <nav className="mt-6 flex-1 overflow-y-auto no-scrollbar pr-1">{nav}</nav>
        <Link
          href="/client/company-profile"
          className="mt-3 flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3 transition-colors hover:bg-white/[0.06]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-grid-blue/15 text-aerial-cyan ring-1 ring-white/10">
            <Icon name="building" size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-white">{company.name}</span>
            <span className="block truncate text-xs text-white/45">{company.industry}</span>
          </span>
          <PlanBadge plan={plan} />
        </Link>
      </aside>

      {/* main column */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/8 bg-grid-black/70 px-4 py-3 backdrop-blur-xl sm:px-6">
          <button
            onClick={() => setDrawer((v) => !v)}
            aria-label="Menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition-colors hover:bg-white/[0.06] lg:hidden"
          >
            <Icon name="menu" size={20} />
          </button>
          <Link href="/client/dashboard" className="text-base font-semibold tracking-tight text-white lg:hidden">
            Grid<span className="text-grid-blue">.</span>
          </Link>
          <ExperienceSwitcher current="clients" className="lg:hidden" />
          <DemoModeNotice className="hidden md:inline-flex" />
          <div className="ml-auto flex items-center gap-2">
            <Link
              href={`/company/${COMPANY_SLUG}`}
              className="hidden items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3.5 py-2 text-xs font-medium text-white/75 transition-colors hover:text-white sm:flex"
            >
              <Icon name="globe" size={14} /> View public profile
            </Link>
            <Link href="/client/subscriptions" className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
              <PlanBadge plan={plan} />
            </Link>
          </div>
        </header>

        {/* mobile drawer */}
        {drawer && (
          <div className="border-b border-white/8 bg-grid-black/95 px-4 py-4 backdrop-blur-xl lg:hidden">
            <nav className="max-h-[70dvh] overflow-y-auto">{nav}</nav>
          </div>
        )}

        <main className="relative mx-auto w-full max-w-6xl flex-1 px-4 pb-20 pt-7 sm:px-6 lg:pb-12 lg:pt-9">{children}</main>
      </div>
    </div>
  );
}
