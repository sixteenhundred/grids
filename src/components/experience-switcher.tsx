"use client";

import { useState } from "react";
import Link from "next/link";
import { Icon, type IconName } from "@/components/dashboard/icons";

type ExperienceId = "all" | "creators" | "clients";

const EXPERIENCES: { id: ExperienceId; label: string; short: string; desc: string; href: string; icon: IconName }[] = [
  { id: "all", label: "Grid for All", short: "For All", desc: "The main site", href: "/", icon: "globe" },
  { id: "creators", label: "Grid for Creators", short: "For Creators", desc: "Your creative workspace", href: "/dashboard", icon: "camera" },
  { id: "clients", label: "Grid for Clients", short: "For Clients", desc: "Company command center", href: "/client/subscriptions", icon: "building" },
];

/**
 * Global switcher to move between the three Grid experiences — Grid for All
 * (landing), Grid for Creators (dashboard) and Grid for Clients (/client).
 * Self-contained dropdown; click-outside closes via a transparent backdrop.
 */
export function ExperienceSwitcher({
  current,
  align = "left",
  className = "",
}: {
  current: ExperienceId;
  align?: "left" | "right";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const cur = EXPERIENCES.find((e) => e.id === current) ?? EXPERIENCES[0];

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] py-1.5 pl-3 pr-2.5 text-sm text-white transition-colors hover:bg-white/[0.1]"
      >
        <Icon name={cur.icon} size={15} className="text-aerial-cyan" />
        <span className="font-medium">{cur.short}</span>
        <Icon name="chevron" size={13} className={`text-white/40 transition-transform duration-200 ${open ? "rotate-90" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className={`absolute z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-white/12 bg-[#0c1117]/95 p-1.5 shadow-[0_22px_60px_-15px_rgba(0,0,0,0.85)] backdrop-blur-xl ${align === "right" ? "right-0" : "left-0"}`}
          >
            <div className="px-2.5 pb-1.5 pt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/35">
              Switch experience
            </div>
            {EXPERIENCES.map((e) => {
              const active = e.id === current;
              return (
                <Link
                  key={e.id}
                  href={e.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-2.5 py-2.5 transition-colors ${active ? "bg-white/[0.07]" : "hover:bg-white/[0.04]"}`}
                >
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ${active ? "text-aerial-cyan" : "text-white/60"}`}>
                    <Icon name={e.icon} size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5 text-sm font-medium text-white">
                      {e.label}
                      {active && (
                        <span className="rounded-full bg-aerial-cyan/15 px-1.5 py-0.5 text-[9px] uppercase tracking-wide text-aerial-cyan">
                          Here
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs text-white/45">{e.desc}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
