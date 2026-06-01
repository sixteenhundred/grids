"use client";

/**
 * Theme system — dark (default) / light, toggled at runtime.
 *
 * The choice lives in React state for the SESSION only — intentionally NOT
 * persisted to localStorage (safe for restricted/embedded environments). The
 * provider writes `data-theme` onto <html>; all colours resolve from the CSS
 * custom properties defined per `[data-theme]` in globals.css.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "dark" | "light";

const ThemeCtx = createContext<{ theme: Theme; toggle: () => void } | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeCtx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

/* -------------------------------------------------------------------------- */
/*  Glowing sun / moon toggle                                                  */
/*  Sun shown = light mode active · Moon shown = dark mode active.             */
/* -------------------------------------------------------------------------- */

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-white transition-colors duration-300 hover:bg-white/[0.12] ${className}`}
      style={{
        // soft glow — cool for the moon, warm for the sun
        boxShadow: isDark
          ? "0 0 16px -2px rgba(120,160,255,0.55), inset 0 0 10px -4px rgba(120,160,255,0.6)"
          : "0 0 18px -2px rgba(245,196,80,0.7), inset 0 0 10px -4px rgba(245,196,80,0.7)",
      }}
    >
      {isDark ? (
        // Moon (dark mode active)
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      ) : (
        // Sun (light mode active)
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8" />
        </svg>
      )}
    </button>
  );
}
