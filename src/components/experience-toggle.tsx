"use client";

import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import { SPRING_SOFT } from "@/components/landing/motion";

/**
 * The single Creator / Client switch (top-right of both shells). Creator is the
 * /dashboard experience; Client is the /client experience. Switching writes the
 * role to localStorage (so shared dashboard tools render in the right mode) and
 * navigates to that experience's home. No multi-way "hopping" — you move
 * between exactly the two sides, matching how accounts work at launch.
 */
const DEST = { creator: "/dashboard", client: "/client/dashboard" } as const;

export function ExperienceToggle({
  current,
  size = "md",
}: {
  current: "creator" | "client";
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const pad = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm";

  const tabs = [
    { id: "creator", label: "Creator", thumb: "bg-grid-blue/90 shadow-[0_0_22px_-4px] shadow-grid-blue/60" },
    { id: "client", label: "Client", thumb: "bg-client-green/90 shadow-[0_0_22px_-4px] shadow-client-green/60" },
  ] as const;

  const go = (id: "creator" | "client") => {
    if (id === current) return;
    try {
      localStorage.setItem("grid:role", id);
    } catch {
      /* ignore */
    }
    router.push(DEST[id]);
  };

  return (
    <div role="tablist" aria-label="Switch experience" className="relative inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
      {tabs.map((t) => {
        const active = current === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => go(t.id)}
            className={`relative z-10 rounded-full font-medium tracking-tight transition-colors duration-300 ${pad} ${active ? "text-on-accent" : "text-white/55 hover:text-white/80"}`}
          >
            {active && <motion.span layoutId="experience-thumb" aria-hidden transition={SPRING_SOFT} className={`absolute inset-0 -z-10 rounded-full ${t.thumb}`} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
