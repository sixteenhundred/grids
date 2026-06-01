"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import type { Role } from "@/lib/grid-data";
import { SPRING_SOFT } from "@/components/landing/motion";

type RoleCtx = {
  role: Role;
  setRole: (r: Role) => void;
  ready: boolean;
};

const Ctx = createContext<RoleCtx | null>(null);
const KEY = "grid:role";

export function RoleProvider({ children, initial = "creator" }: { children: ReactNode; initial?: Role }) {
  const [role, setRoleState] = useState<Role>(initial);
  const [ready, setReady] = useState(false);

  // Hydrate the chosen side from the last session (set at signup or via the toggle).
  useEffect(() => {
    const saved = typeof window !== "undefined" ? (localStorage.getItem(KEY) as Role | null) : null;
    if (saved === "creator" || saved === "client") setRoleState(saved);
    setReady(true);
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    try {
      localStorage.setItem(KEY, r);
    } catch {
      /* ignore */
    }
  };

  return <Ctx.Provider value={{ role, setRole, ready }}>{children}</Ctx.Provider>;
}

export function useRole() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRole must be used within RoleProvider");
  return ctx;
}

/**
 * Segmented Creator / Client switch. Creator side leans Grid Blue, client side
 * leans Client Green — same brand rule as the landing's audience toggle.
 */
export function RoleToggle({ size = "md" }: { size?: "sm" | "md" }) {
  const { role, setRole } = useRole();
  const pad = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm";

  const tabs: { id: Role; label: string; thumb: string }[] = [
    { id: "creator", label: "Creator", thumb: "bg-grid-blue/90 shadow-[0_0_22px_-4px] shadow-grid-blue/60" },
    { id: "client", label: "Client", thumb: "bg-client-green/90 shadow-[0_0_22px_-4px] shadow-client-green/60" },
  ];

  return (
    <div role="tablist" aria-label="Switch view" className="relative inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
      {tabs.map((t) => {
        const active = role === t.id;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={active}
            onClick={() => setRole(t.id)}
            className={`relative z-10 rounded-full font-medium tracking-tight transition-colors duration-300 ${pad} ${active ? "text-on-accent" : "text-white/55 hover:text-white/80"}`}
          >
            {active && <motion.span layoutId="role-thumb" aria-hidden transition={SPRING_SOFT} className={`absolute inset-0 -z-10 rounded-full ${t.thumb}`} />}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
