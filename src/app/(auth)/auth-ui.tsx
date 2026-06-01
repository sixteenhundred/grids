"use client";

import type { InputHTMLAttributes } from "react";

/** Branded input used across the auth flows. */
export function Field({
  label,
  accent = "blue",
  ...props
}: { label: string; accent?: "blue" | "green" } & InputHTMLAttributes<HTMLInputElement>) {
  const focus = accent === "green" ? "focus:border-client-green/60" : "focus:border-grid-blue/60";
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-[0.14em] text-white/45">{label}</span>
      <input
        {...props}
        className={`w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 ${focus}`}
      />
    </label>
  );
}

export function AuthError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="flex items-center gap-2 rounded-xl border border-urgent-red/25 bg-urgent-red/10 px-3.5 py-2.5 text-sm text-urgent-red">
      {children}
    </p>
  );
}
