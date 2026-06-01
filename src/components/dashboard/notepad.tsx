"use client";

/**
 * Quick Notepad — a global, always-available scratchpad for the dashboard.
 *
 * A floating launcher opens a compact pop-out pad. Freeform text only (it's not
 * a task manager — that's "Today's Priorities"). Autosaves to localStorage with
 * a debounce, so there's nothing to "boot up" — just jot and go. Content
 * persists across pages and reloads; opens closed by default.
 */

import { useEffect, useRef, useState } from "react";
import { Icon } from "./icons";

const KEY = "grid:notepad";

export function Notepad() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [mounted, setMounted] = useState(false);
  const [saved, setSaved] = useState(false);
  const saveTimer = useRef<number | undefined>(undefined);

  // Hydrate after mount (never read storage in a useState initializer).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw != null) setText(raw);
    } catch {
      /* ignore */
    }
    setMounted(true);
  }, []);

  // Debounced autosave.
  useEffect(() => {
    if (!mounted) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(KEY, text);
        setSaved(true);
      } catch {
        /* ignore */
      }
    }, 400);
    return () => window.clearTimeout(saveTimer.current);
  }, [text, mounted]);

  // Flash the "Saved" confirmation briefly, then settle.
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => setSaved(false), 1400);
    return () => clearTimeout(t);
  }, [saved]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const words = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notepad"
        aria-expanded={open}
        title="Notepad"
        className="fixed right-5 bottom-24 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-soft-black/90 text-white shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-transform hover:scale-105 lg:bottom-6"
      >
        <Icon name={open ? "x" : "file"} size={19} />
        {!open && mounted && text.trim() && (
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-grid-blue ring-2 ring-soft-black" />
        )}
      </button>

      {/* Pop-out pad */}
      {open && (
        <div className="fixed right-5 bottom-40 z-40 flex w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-white/12 bg-soft-black/95 shadow-[0_24px_70px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl lg:bottom-20">
          <div className="flex items-center gap-2 border-b border-white/8 px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-grid-blue/15 text-grid-blue">
              <Icon name="file" size={15} />
            </span>
            <span className="text-sm font-semibold text-white">Notepad</span>
            <button onClick={() => setOpen(false)} aria-label="Close notepad" className="ml-auto flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition-colors hover:bg-white/8 hover:text-white">
              <Icon name="x" size={16} />
            </button>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            placeholder="Jot something down — a shot idea, a client ask, a quote… It saves automatically."
            className="h-64 w-full resize-none bg-transparent px-4 py-3 text-sm leading-relaxed text-white outline-none placeholder:text-white/35"
          />

          <div className="flex items-center gap-3 border-t border-white/8 px-4 py-2.5 text-[11px] text-white/40">
            <span>{words} {words === 1 ? "word" : "words"}</span>
            <span className="inline-flex items-center gap-1">
              <Icon name="check" size={12} className={saved ? "text-escrow-green" : "text-white/35"} />
              {saved ? "Saved" : "Auto-saves"}
            </span>
            {text && (
              <button onClick={() => setText("")} className="ml-auto transition-colors hover:text-urgent-red">
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
