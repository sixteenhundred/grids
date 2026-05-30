"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from "motion/react";
import { EASE_GRID } from "./motion";

const LINKS = [
  { label: "How it works", href: "#how" },
  { label: "Talent", href: "#talent" },
  { label: "Escrow", href: "#escrow" },
  { label: "Jobs", href: "#jobs" },
  { label: "Pricing", href: "#pricing" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 24));

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* Displacement map that powers the glass refraction (see .glass-refract). */}
      <svg aria-hidden className="pointer-events-none absolute h-0 w-0">
        <filter
          id="liquid-glass"
          x="-20%"
          y="-20%"
          width="140%"
          height="140%"
          colorInterpolationFilters="sRGB"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.013 0.013"
            numOctaves={2}
            seed={11}
            result="noise"
          />
          <feGaussianBlur in="noise" stdDeviation="1.4" result="soft" />
          <feDisplacementMap
            in="SourceGraphic"
            in2="soft"
            scale="22"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4">
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: EASE_GRID, delay: 0.1 }}
          className={`glass-nav relative mt-5 mx-auto flex w-full max-w-3xl items-center justify-between gap-4 rounded-full border px-3 py-2 pl-5 transition-colors duration-500 ${
            scrolled
              ? "glass-nav--scrolled border-white/16"
              : "border-white/12"
          }`}
        >
          {/* specular highlights layered over the refracted frost */}
          <span className="glass-sheen pointer-events-none absolute inset-0 rounded-full" />
          <span className="glass-gloss pointer-events-none absolute inset-0 rounded-full" />

          <Link
            href="#top"
            className="relative text-lg font-semibold tracking-tight text-white"
          >
            Grid<span className="text-grid-blue">.</span>
          </Link>

          <div className="relative hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative rounded-full px-3.5 py-1.5 text-sm text-white/60 transition-colors duration-300 hover:text-white"
              >
                <span className="relative z-10">{l.label}</span>
                <span className="absolute inset-0 -z-0 scale-90 rounded-full bg-white/5 opacity-0 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-100 group-hover:opacity-100" />
              </a>
            ))}
          </div>

          <div className="relative flex items-center gap-2">
            <Link
              href="/login"
              className="hidden rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:text-white sm:block"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="group hidden items-center gap-2 rounded-full bg-white py-1.5 pl-4 pr-1.5 text-sm font-medium text-[#101114] transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] sm:flex"
            >
              Get started
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#101114]/8 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5">
                <Arrow />
              </span>
            </Link>

            {/* Hamburger morph */}
            <button
              aria-label="Menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/5 md:hidden"
            >
              <span
                className={`absolute h-px w-4 bg-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  open ? "rotate-45" : "-translate-y-1"
                }`}
              />
              <span
                className={`absolute h-px w-4 bg-white transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                  open ? "-rotate-45" : "translate-y-1"
                }`}
              />
            </button>
          </div>
        </motion.nav>
      </header>

      {/* Full-screen mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_GRID }}
            className="fixed inset-0 z-30 flex flex-col justify-center gap-2 bg-black/80 px-8 backdrop-blur-3xl md:hidden"
          >
            {LINKS.map((l, i) => (
              <motion.a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5, ease: EASE_GRID, delay: 0.08 + i * 0.06 }}
                className="text-4xl font-semibold tracking-tight text-white"
              >
                {l.label}
              </motion.a>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE_GRID, delay: 0.08 + LINKS.length * 0.06 }}
              className="mt-8 flex gap-3"
            >
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-full border border-white/15 px-6 py-3 text-sm text-white"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="rounded-full bg-white px-6 py-3 text-sm font-medium text-black"
              >
                Get started
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Arrow() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3 11L11 3M11 3H5M11 3V9"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
