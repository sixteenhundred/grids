"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { motion } from "motion/react";
import { SPRING_SOFT } from "./motion";

export type Audience = "client" | "creator";

type AudienceCtx = {
  audience: Audience;
  setAudience: (a: Audience) => void;
};

const Ctx = createContext<AudienceCtx | null>(null);

export function AudienceProvider({ children }: { children: ReactNode }) {
  const [audience, setAudience] = useState<Audience>("client");
  return <Ctx.Provider value={{ audience, setAudience }}>{children}</Ctx.Provider>;
}

export function useAudience() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAudience must be used within AudienceProvider");
  return ctx;
}

/**
 * Segmented Hire / Work control. Per brand: client actions lean Client Green,
 * creator actions lean Grid Blue. The thumb tints to match the active side.
 */
export function AudienceToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const { audience, setAudience } = useAudience();
  const pad = size === "sm" ? "px-3.5 py-1.5 text-xs" : "px-5 py-2 text-sm";

  const tabs: { id: Audience; label: string; thumb: string }[] = [
    {
      id: "client",
      label: "Hire talent",
      thumb: "bg-aerial-cyan/90 shadow-[0_0_24px_-4px] shadow-aerial-cyan/60",
    },
    {
      id: "creator",
      label: "Work as a creator",
      thumb: "bg-grid-blue/90 shadow-[0_0_24px_-4px] shadow-grid-blue/60",
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Choose your side"
      className="relative inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl"
    >
      {tabs.map((t) => {
        const active = audience === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => setAudience(t.id)}
            className={`relative z-10 rounded-full font-medium tracking-tight transition-colors duration-300 ${pad} ${
              active ? "text-white" : "text-white/55 hover:text-white/80"
            }`}
          >
            {active && (
              <motion.span
                layoutId="audience-thumb"
                aria-hidden
                transition={SPRING_SOFT}
                className={`absolute inset-0 -z-10 rounded-full ${t.thumb}`}
              />
            )}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
