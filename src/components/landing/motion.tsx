"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import {
  useEffect,
  useRef,
  type ComponentProps,
  type ReactNode,
} from "react";

/* -------------------------------------------------------------------------- */
/*  Shared motion language                                                    */
/*  Grid's signature easing is a heavy, expensive spring-out. We expose both  */
/*  a cubic-bezier (for tween-based reveals) and a tuned spring (for          */
/*  interactive, physical interactions like magnetic buttons).                */
/* -------------------------------------------------------------------------- */

export const EASE_GRID = [0.32, 0.72, 0, 1] as const;

export const SPRING_SOFT = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 0.9,
} as const;

export const SPRING_SNAPPY = {
  type: "spring",
  stiffness: 400,
  damping: 32,
  mass: 0.6,
} as const;

/* Entry variant: fade + lift + de-blur, matching the old `.reveal` feel but
   now spring-aware and stagger-friendly. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.85, ease: EASE_GRID },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.9, ease: EASE_GRID } },
};

/* Container that drives a staggered cascade of its `staggerItem` children. */
export function staggerContainer(stagger = 0.09, delayChildren = 0): Variants {
  return {
    hidden: {},
    show: {
      transition: { staggerChildren: stagger, delayChildren },
    },
  };
}

export const staggerItem = fadeUp;

/* -------------------------------------------------------------------------- */
/*  Reveal — drop-in scroll entrance. Plays once when ~15% in view.           */
/* -------------------------------------------------------------------------- */

type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "span" | "figure" | "header";
} & Omit<ComponentProps<typeof motion.div>, "variants" | "initial" | "ref">;

export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
  ...rest
}: RevealProps) {
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -8% 0px" }}
      variants={{
        hidden: { opacity: 0, y: 28, filter: "blur(8px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: { duration: 0.85, ease: EASE_GRID, delay: delay / 1000 },
        },
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stagger — container + item for cascading grids.                           */
/* -------------------------------------------------------------------------- */

export function Stagger({
  children,
  className = "",
  stagger = 0.09,
  delayChildren = 0,
  amount = 0.15,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  amount?: number;
  as?: "div" | "ul" | "section";
}) {
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
      variants={staggerContainer(stagger, delayChildren)}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "figure" | "a";
}) {
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag className={className} variants={staggerItem}>
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/*  Magnetic — element subtly tracks the cursor, then springs home.           */
/*  Pure transform/opacity, GPU-safe. Disabled for coarse pointers.           */
/* -------------------------------------------------------------------------- */

export function Magnetic({
  children,
  strength = 0.35,
  className = "",
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING_SNAPPY);
  const sy = useSpring(y, SPRING_SNAPPY);

  return (
    <motion.span
      ref={ref}
      className={`inline-flex ${className}`}
      style={{ x: sx, y: sy }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/* -------------------------------------------------------------------------- */
/*  AnimatedNumber — counts up to a value the first time it scrolls in.       */
/* -------------------------------------------------------------------------- */

export function AnimatedNumber({
  value,
  prefix = "",
  suffix = "",
  duration = 1.6,
  className = "",
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) =>
    `${prefix}${Math.round(v).toLocaleString()}${suffix}`,
  );

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / (duration * 1000));
      // easeOutExpo for a confident settle
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      mv.set(value * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration, mv]);

  return (
    <motion.span ref={ref} className={className}>
      {rounded}
    </motion.span>
  );
}
