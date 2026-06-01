"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "@/components/dashboard/icons";
import { CLIENT_KEYS, type ClientPlanId } from "@/lib/client/config";
import { DEFAULT_COMPANY, type CompanyProfile } from "@/lib/client/mock";

type Toast = { id: number; message: string };

type ClientCtx = {
  ready: boolean;
  plan: ClientPlanId;
  setPlan: (p: ClientPlanId) => void;
  company: CompanyProfile;
  setCompany: (c: CompanyProfile) => void;
  toast: (message: string) => void;
};

const Ctx = createContext<ClientCtx | null>(null);

export function ClientProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [plan, setPlanState] = useState<ClientPlanId>("free");
  const [company, setCompanyState] = useState<CompanyProfile>(DEFAULT_COMPANY);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    try {
      const p = localStorage.getItem(CLIENT_KEYS.plan) as ClientPlanId | null;
      if (p && ["free", "agency", "enterprise"].includes(p)) setPlanState(p);
      const c = localStorage.getItem(CLIENT_KEYS.profile);
      if (c) setCompanyState({ ...DEFAULT_COMPANY, ...(JSON.parse(c) as Partial<CompanyProfile>) });
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const setPlan = useCallback((p: ClientPlanId) => {
    setPlanState(p);
    try {
      localStorage.setItem(CLIENT_KEYS.plan, p);
    } catch {
      /* ignore */
    }
  }, []);

  const setCompany = useCallback((c: CompanyProfile) => {
    setCompanyState(c);
    try {
      localStorage.setItem(CLIENT_KEYS.profile, JSON.stringify(c));
    } catch {
      /* ignore */
    }
  }, []);

  const toast = useCallback((message: string) => {
    const id = (seq.current += 1);
    setToasts((t) => [...t, { id, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  }, []);

  return (
    <Ctx.Provider value={{ ready, plan, setPlan, company, setCompany, toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-[120] flex -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-2.5 rounded-full border border-white/12 bg-[#0c1117]/95 px-4 py-2.5 text-sm font-medium text-white shadow-[0_16px_50px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-escrow-green/20 text-escrow-green">
              <Icon name="check" size={13} />
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useClient() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useClient must be used within a ClientProvider");
  return c;
}
