"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EASE_GRID } from "@/components/landing/motion";
import { X } from "./icons";

type SheetCtx = {
  open: (node: ReactNode) => void;
  close: () => void;
};

const Ctx = createContext<SheetCtx | null>(null);

export function SheetProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<ReactNode | null>(null);

  const open = useCallback((n: ReactNode) => setNode(n), []);
  const close = useCallback(() => setNode(null), []);

  useEffect(() => {
    if (!node) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [node, close]);

  return (
    <Ctx.Provider value={{ open, close }}>
      {children}
      <AnimatePresence>
        {node && (
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_GRID }}
            onClick={close}
            className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-md sm:items-center sm:p-6"
          >
            <motion.div
              key="sheet-panel"
              onClick={(e) => e.stopPropagation()}
              initial={{ y: "8%", opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: "8%", opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.42, ease: EASE_GRID }}
              role="dialog"
              aria-modal="true"
              className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-[radial-gradient(130%_120%_at_50%_0%,#121318_0%,#08090b_60%)] shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.9)] sm:max-w-md sm:rounded-[28px]"
            >
              {/* grab handle (mobile) */}
              <div className="sticky top-0 z-10 flex items-center justify-center bg-gradient-to-b from-[#0f1014] to-transparent pb-2 pt-3 sm:hidden">
                <span className="h-1.5 w-10 rounded-full bg-white/20" />
              </div>
              <button
                onClick={close}
                aria-label="Close"
                className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/8 text-white/70 transition-colors hover:bg-white/14 hover:text-white"
              >
                <X size={16} />
              </button>
              <div className="px-6 pb-9 pt-4 sm:pt-7">{node}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}

export function useSheet() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSheet must be used within SheetProvider");
  return ctx;
}

/* Shared sheet building blocks ------------------------------------------------ */

export function SheetHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5 pr-8">
      <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm leading-relaxed text-white/55">{subtitle}</p>}
    </div>
  );
}

export function SheetRow({ label, value, strong = false }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-white/8 py-3 text-sm last:border-0">
      <span className="text-white/55">{label}</span>
      <span className={strong ? "font-semibold text-white" : "text-white/85"}>{value}</span>
    </div>
  );
}
