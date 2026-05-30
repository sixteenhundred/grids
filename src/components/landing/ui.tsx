import Link from "next/link";
import type { ReactNode } from "react";

export function Eyebrow({
  children,
  tone = "blue",
}: {
  children: ReactNode;
  tone?: "blue" | "green" | "gold" | "red" | "neutral";
}) {
  const tint = {
    blue: "text-aerial-cyan/90 ring-grid-blue/20",
    green: "text-escrow-green/90 ring-escrow-green/20",
    gold: "text-review-gold/90 ring-review-gold/20",
    red: "text-urgent-red/90 ring-urgent-red/25",
    neutral: "text-white/70 ring-white/12",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] ring-1 ${tint}`}
    >
      {children}
    </span>
  );
}

type CtaProps = {
  href: string;
  children: ReactNode;
  variant?: "solid" | "ghost";
  tone?: "blue" | "green" | "white";
};

/**
 * Calm CTA. Hover is deliberately restrained — the trailing arrow nudges a
 * hair and the surface lifts slightly. No cursor-magnetism, no sheen sweep.
 */
export function Cta({ href, children, variant = "solid", tone = "white" }: CtaProps) {
  if (variant === "ghost") {
    return (
      <Link
        href={href}
        className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] py-2.5 pl-5 pr-2.5 text-sm font-medium text-white transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-white/[0.07]"
      >
        {children}
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/12 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
          <Arrow />
        </span>
      </Link>
    );
  }

  const solid = {
    white: "bg-white text-[#101114]",
    blue: "bg-grid-blue text-white shadow-[0_8px_40px_-10px] shadow-grid-blue/50",
    green:
      "bg-client-green text-white shadow-[0_8px_40px_-10px] shadow-client-green/50",
  }[tone];
  const innerBg = tone === "white" ? "bg-[#101114]/8" : "bg-white/20";

  return (
    <Link
      href={href}
      className={`group inline-flex items-center gap-2 rounded-full py-2.5 pl-6 pr-2.5 text-sm font-semibold tracking-tight transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] ${solid}`}
    >
      {children}
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full ${innerBg} transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5`}
      >
        <Arrow />
      </span>
    </Link>
  );
}

function Arrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 11L11 3M11 3H5M11 3V9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
