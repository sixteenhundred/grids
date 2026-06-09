"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
} from "motion/react";
import { useAudience, AudienceToggle } from "./audience";
import { ImagePlaceholder } from "./image-placeholder";
import { Cta, Eyebrow } from "./ui";
import { ContestBox } from "./contest-cta";
import { EASE_GRID, staggerContainer, staggerItem } from "./motion";

const COPY = {
  client: {
    eyebrow: "Verified visual talent",
    h1a: "Book visual talent",
    h1b: "with confidence.",
    sub: "Hire verified photographers, cinematographers and drone pilots, without the back-and-forth. Every booking is protected by Grid.",
    primary: { label: "Hire a creative", href: "/signup", tone: "blue" as const },
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
      className="relative overflow-hidden px-4 pt-28 pb-10 sm:px-6 md:pt-32"
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
          className="absolute bottom-[-10%] left-[8%] h-[24rem] w-[24rem] rounded-full bg-aerial-cyan/10 blur-[120px]"
          animate={{ x: [0, -26, 0], y: [0, 22, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left — copy */}
        <motion.div
          style={{ y: copyY }}
          className="flex flex-col items-start"
          variants={staggerContainer(0.08, 0.05)}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={staggerItem} className="mb-6 flex flex-wrap items-center gap-3">
            <Eyebrow tone="blue">
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

        {/* Right — contest box stacked over a single live tile (tetris) */}
        <motion.div
          style={{ y: bentoY }}
          className="grid gap-3 sm:gap-4"
          variants={staggerContainer(0.12, 0.3)}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={staggerItem}>
            <ContestBox />
          </motion.div>
          <FloatTile float={{ y: [0, -8, 0], duration: 8 }} src="/gallery/top.jpg" h="h-44 sm:h-52" priority />
        </motion.div>
      </div>

    </section>
  );
}

function FloatTile({
  span = false,
  float,
  src,
  h,
  priority = false,
}: {
  span?: boolean;
  float: { y: number[]; duration: number };
  src?: string;
  h: string;
  priority?: boolean;
}) {
  // Plain <img> over a clean viewfinder frame: if the photo isn't on disk yet,
  // onError keeps the frame visible instead of showing a broken image.
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // A cached image can finish loading before React attaches onLoad — catch that.
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true);
  }, []);
  const radius = "rounded-[calc(1.75rem-0.375rem)]";
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
        <div className={`relative overflow-hidden ${h} ${radius}`}>
          {/* clean, text-free frame — also the graceful fallback */}
          <ImagePlaceholder priority={priority} className="absolute inset-0 h-full w-full" />
          {src && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt=""
                onLoad={() => setLoaded(true)}
                onError={() => setLoaded(false)}
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
              />
              {loaded && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

