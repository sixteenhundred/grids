"use client";

import { useRole } from "@/components/dashboard/role-context";
import { PageHeader, SectionHeader, MetricCard, Card, StatusPill, Button, Icon } from "@/components/dashboard/ui";
import { CONTRACTS, METRICS, money, type Contract } from "@/lib/grid-data";

export default function FinancePage() {
  const { role } = useRole();

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="rise">
        <PageHeader
          eyebrow="Grid Escrow"
          tone="escrow"
          title="Finance"
          subtitle="Escrow balances and payouts in one place."
        />

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="In escrow" value={money(METRICS.inEscrow)} tone="escrow" sub="held, protected" />
          <MetricCard label="Available" value={money(METRICS.available)} sub="ready to withdraw" />
          {role === "client" ? (
            <MetricCard label="Total spent" value={money(METRICS.totalSpent)} />
          ) : (
            <MetricCard label="This month" value={money(METRICS.thisMonth)} />
          )}
          <MetricCard label="On-time" value="100%" tone="escrow" />
        </div>
      </div>

      {/* Escrow activity ledger */}
      <div className="rise" style={{ animationDelay: "80ms" }}>
        <SectionHeader title="Escrow activity" />
        <div className="flex flex-col gap-3">
          {CONTRACTS.map((c: Contract) => {
            const active = c.status === "Active";
            return (
              <Card key={c.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-escrow-green/12 text-escrow-green ring-1 ring-escrow-green/25">
                    <Icon name={active ? "lock" : "check"} size={18} />
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{c.pkg}</div>
                    <div className="truncate text-xs text-white/45">
                      {c.withName} · {c.date}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-4">
                  {active ? (
                    <StatusPill tone="blue" live>
                      Held
                    </StatusPill>
                  ) : (
                    <StatusPill tone="escrow">Released</StatusPill>
                  )}
                  <span className="font-mono text-sm font-semibold text-white">{money(c.total)}</span>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Withdraw */}
        <div className="mt-6">
          <Button
            tone="escrow"
            onClick={() => console.log(`Withdraw ${money(METRICS.available)} available`)}
          >
            Withdraw available
          </Button>
        </div>
      </div>
    </div>
  );
}
