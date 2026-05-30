"use client";

import { useRole } from "@/components/dashboard/role-context";
import { Card, PageHeader, StatusPill } from "@/components/dashboard/ui";
import { CONTRACTS, money, type Contract } from "@/lib/grid-data";

function statusTone(status: Contract["status"]): { tone: "blue" | "escrow" | "gold"; live: boolean } {
  if (status === "Active") return { tone: "blue", live: true };
  if (status === "Completed") return { tone: "escrow", live: false };
  return { tone: "gold", live: false };
}

export default function ContractsPage() {
  const { role } = useRole();

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Grid Contracts"
          tone="blue"
          title="Contracts"
          subtitle="All your signed agreements."
        />
      </div>

      <div className="rise flex flex-col gap-3" style={{ animationDelay: "60ms" }}>
        {CONTRACTS.map((c) => {
          const { tone, live } = statusTone(c.status);
          return (
            <Card key={c.id} hover className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">{c.pkg}</div>
                  <p className="mt-0.5 truncate text-sm text-white/55">
                    {role === "client" ? "with" : "for"} {c.withName} · {c.date}
                  </p>
                  <p className="mt-1 font-mono text-xs text-white/40">{"#" + c.id}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                  <StatusPill tone={tone} live={live}>
                    {c.status}
                  </StatusPill>
                  <div>
                    <div className="text-xs text-white/45">Total in escrow</div>
                    <div className="mt-0.5 font-mono font-semibold text-white">{money(c.total)}</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
