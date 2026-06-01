"use client";

/**
 * PlanProvider — holds the signed-in account's subscription plan and per-feature
 * trial credits. Demo only: switching plans never charges anything; state lives
 * in localStorage so the freemium flow can be felt end-to-end.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  type PlanId,
  TRIAL_CREDITS,
  planIncludesFeature,
} from "@/lib/plans";

const PLAN_KEY = "grid:plan";
const TRIAL_KEY = "grid:trials";

type Trials = Record<string, number>;

type PlanCtx = {
  ready: boolean;
  plan: PlanId;
  setPlan: (p: PlanId) => void;
  hasAccess: (key: string | null) => boolean;
  trialCredits: (key: string) => number | undefined;
  startTrial: (key: string) => void;
  consumeTrial: (key: string) => void;
};

const Ctx = createContext<PlanCtx | null>(null);

// Module-level guard so a single navigation (incl. React StrictMode's
// double-invoked effects in dev) only burns one trial credit.
let lastConsume = { key: "", t: 0 };

export function PlanProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [plan, setPlanState] = useState<PlanId>("free");
  const [trials, setTrials] = useState<Trials>({});

  // Hydrate from localStorage after mount (never in the initializer — keeps SSR
  // and first client render identical).
  useEffect(() => {
    try {
      const p = localStorage.getItem(PLAN_KEY) as PlanId | null;
      if (p && ["free", "silver", "diamond", "platinum"].includes(p)) setPlanState(p);
      const t = localStorage.getItem(TRIAL_KEY);
      if (t) setTrials(JSON.parse(t) as Trials);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setPlan = useCallback((p: PlanId) => {
    setPlanState(p);
    try {
      localStorage.setItem(PLAN_KEY, p);
    } catch {
      /* ignore */
    }
  }, []);

  const persistTrials = (next: Trials) => {
    try {
      localStorage.setItem(TRIAL_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const startTrial = useCallback((key: string) => {
    setTrials((prev) => {
      if (prev[key] !== undefined) return prev;
      const next = { ...prev, [key]: TRIAL_CREDITS };
      persistTrials(next);
      return next;
    });
  }, []);

  const consumeTrial = useCallback((key: string) => {
    const now = Date.now();
    if (lastConsume.key === key && now - lastConsume.t < 2500) return;
    lastConsume = { key, t: now };
    setTrials((prev) => {
      const c = prev[key] ?? 0;
      const next = { ...prev, [key]: Math.max(0, c - 1) };
      persistTrials(next);
      return next;
    });
  }, []);

  const hasAccess = useCallback(
    (key: string | null) => planIncludesFeature(plan, key),
    [plan],
  );

  const trialCredits = useCallback(
    (key: string) => trials[key],
    [trials],
  );

  return (
    <Ctx.Provider
      value={{ ready, plan, setPlan, hasAccess, trialCredits, startTrial, consumeTrial }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function usePlan() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePlan must be used within a PlanProvider");
  return ctx;
}
