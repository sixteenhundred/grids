"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Demo persistence hook — like useState but mirrored to localStorage. Hydrates
 * after mount (never in the initializer) so SSR and first client render match.
 * Returns [value, setValue, ready].
 */
export function useLocalState<T>(
  key: string,
  initial: T,
): [T, (next: T | ((prev: T) => T)) => void, boolean] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const val = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(val));
        } catch {
          /* ignore */
        }
        return val;
      });
    },
    [key],
  );

  return [value, set, ready];
}
