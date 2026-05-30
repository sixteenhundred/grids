"use client";

import { useRef } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import { useAudience, AudienceToggle } from "./audience";
import { ImagePlaceholder } from "./image-placeholder";
import { Cta, Eyebrow } from "./ui";
import { EASE_GRID, staggerContainer, staggerItem } from "./motion";

const COPY = {
  client: {
    eyebrow: "Verified visual talent",
    h1a: "Book visual talent",
    h1b: "with confidence.",
    sub: "Hire verified photographers, cinematographers and drone pilots, without the back-and-forth. Every booking is protected by Grid Escrow.",
    primary: { label: "Hire a creative", href: "/signup", tone: "green" as const },
    secondary: { label: "Browse talent", href: "#talent" },
  },
  creator: {
    eyebrow: "Your creative business, on Grid",
    h1a: "Get discovered.",
    h1b: "Get booked. Get paid.",
    sub: "Show your portfolio, package your services and take secure bookings. Apply to jobs, collaborate with crew and grow your rate.",
    primary: { label: "Join as a creator", href: "/signup", tone: "blue" as const },
    secondary: { label: "See how it works", href: "#how" },
  },
};

export function Hero() {
  const { audience } = useAudience();
  const c = COPY[audience];

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  // Depth parallax — bento drifts up slowly, orbs counter-drift.
  const bentoY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const orbY = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 40]);

  return (
    <section
      ref={sectionRef}
      id="top"
      className="relative min-h-[100dvh] overflow-hidden px-4 pt-32 pb-20 sm:px-6 md:pt-40"
    >
      {/* radial mesh glows — slow living drift + scroll counter-parallax */}
      <motion.div style={{ y: orbY }} className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-1/2 top-[-10%] h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-grid-blue/15 blur-[120px]"
          animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[5%] top-[20%] h-[26rem] w-[26rem] rounded-full bg-aerial-cyan/10 blur-[120px]"
          animate={{ x: [0, 30, 0], y: [0, -24, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-10%] left-[8%] h-[24rem] w-[24rem] rounded-full bg-client-green/10 blur-[120px]"
          animate={{ x: [0, -26, 0], y: [0, 22, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
        {/* Left — copy */}
        <motion.div
          style={{ y: copyY }}
          className="flex flex-col items-start"
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={staggerItem} className="mb-6 flex flex-wrap items-center gap-3">
            <Eyebrow tone={audience === "client" ? "green" : "blue"}>
              {c.eyebrow}
            </Eyebrow>
            <AudienceToggle size="sm" />
          </motion.div>

          <motion.h1
            variants={staggerItem}
            className="text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={audience}
                initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -14, filter: "blur(10px)" }}
                transition={{ duration: 0.5, ease: EASE_GRID }}
                className="block"
              >
                {c.h1a}
                <br />
                <span className="bg-gradient-to-r from-white via-white to-white/55 bg-clip-text text-transparent">
                  {c.h1b}
                </span>
              </motion.span>
            </AnimatePresence>
          </motion.h1>

          <motion.p
            variants={staggerItem}
            className="mt-7 max-w-xl text-pretty text-base leading-relaxed text-white/60 sm:text-lg"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={audience}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="block"
              >
                {c.sub}
              </motion.span>
            </AnimatePresence>
          </motion.p>

          <motion.div variants={staggerItem} className="mt-9 flex flex-wrap items-center gap-3">
            <Cta href={c.primary.href} tone={c.primary.tone}>
              {c.primary.label}
            </Cta>
            <Cta href={c.secondary.href} variant="ghost">
              {c.secondary.label}
            </Cta>
          </motion.div>

        </motion.div>

        {/* Right — bento collage with scroll parallax + float + live card */}
        <motion.div style={{ y: bentoY }} className="relative">
          <motion.div
            className="grid grid-cols-2 grid-rows-[1.2fr_0.8fr] gap-3 sm:gap-4"
            variants={staggerContainer(0.12, 0.3)}
            initial="hidden"
            animate="show"
          >
            <FloatTile
              span
              float={{ y: [0, -10, 0], duration: 7 }}
              label="Real-estate · twilight"
              hint="hero-twilight.jpg"
              h="h-56 sm:h-72"
              priority
            />
            <FloatTile
              float={{ y: [0, 8, 0], duration: 8.5 }}
              label="Drone aerial"
              hint="aerial.jpg"
              h="h-40 sm:h-48"
            />
            <FloatTile
              float={{ y: [0, -7, 0], duration: 9.5 }}
              label="Creator on set"
              hint="on-set.jpg"
              h="h-40 sm:h-48"
            />
          </motion.div>

          {/* Floating live-booking card — product texture, escrow pulse */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 1.05, duration: 0.8, ease: EASE_GRID }}
            className="absolute -bottom-5 -left-3 z-10 hidden sm:block"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="rounded-2xl border border-white/10 bg-black/60 p-1 backdrop-blur-xl"
            >
              <div className="flex items-center gap-3 rounded-[0.85rem] bg-white/[0.04] px-4 py-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-escrow-green/15">
                  <span className="absolute inset-0 animate-ping rounded-full bg-escrow-green/20" />
                  <Lock />
                </span>
                <div className="leading-tight">
                  <div className="text-[13px] font-semibold text-white">
                    €3,600 secured
                  </div>
                  <div className="text-[11px] text-white/60">
                    Escrow · funded just now
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
}

function FloatTile({
  span = false,
  float,
  label,
  hint,
  h,
  priority = false,
}: {
  span?: boolean;
  float: { y: number[]; duration: number };
  label: string;
  hint: string;
  h: string;
  priority?: boolean;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 30, scale: 0.96, filter: "blur(8px)" },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: { duration: 0.85, ease: EASE_GRID },
        },
      }}
      className={span ? "col-span-2" : ""}
    >
      <motion.div
        animate={{ y: float.y }}
        transition={{ duration: float.duration, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.015 }}
        className="rounded-[1.75rem] border border-white/10 bg-white/[0.03] p-1.5"
      >
        <ImagePlaceholder
          priority={priority}
          label={label}
          hint={hint}
          className={`${h} rounded-[calc(1.75rem-0.375rem)]`}
        />
      </motion.div>
    </motion.div>
  );
}

function Lock() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M3.5 6V4.5a3.5 3.5 0 017 0V6M2.8 6h8.4v6H2.8z"
        stroke="#4FD07A"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
