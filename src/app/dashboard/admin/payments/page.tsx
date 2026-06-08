import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/security/auth-guard";
import { isAdminEmail } from "@/lib/admin";
import { getAdminPaymentsOverview } from "@/lib/payment-actions";
import { PageHeader, SectionHeader, MetricCard, Card, StatusPill } from "@/components/dashboard/ui";
import type { Accent } from "@/lib/grid-data";

function fmt(minor: number, currency = "eur"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(minor / 100);
  } catch {
    return `€${(minor / 100).toFixed(2)}`;
  }
}

const TONE: Record<string, Accent> = {
  paid: "blue",
  released: "escrow",
  refunded: "purple",
  disputed: "red",
  failed: "red",
  pending: "gold",
  created: "gold",
};

export default async function AdminPaymentsPage() {
  const current = await getCurrentUser();
  if (!isAdminEmail(current?.email)) redirect("/dashboard");

  const overview = await getAdminPaymentsOverview();

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader eyebrow="Admin" tone="escrow" title="Payments overview" subtitle="GRID transaction activity across the platform." />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Gross volume" value={fmt(overview.totals.grossMinor)} tone="escrow" sub={`${overview.totals.count} payments`} />
          <MetricCard label="Platform fees" value={fmt(overview.totals.feeMinor)} tone="blue" sub="GRID revenue" />
          <MetricCard label="Paid to creators" value={fmt(overview.totals.payoutMinor)} sub="released payouts" />
          <MetricCard
            label="Held"
            value={fmt((overview.totals.grossMinor - overview.totals.feeMinor) - overview.totals.payoutMinor)}
            tone="gold"
            sub="awaiting release"
          />
        </div>
      </div>

      <div className="rise" style={{ animationDelay: "80ms" }}>
        <SectionHeader title="Recent payments" />
        <div className="flex flex-col gap-2">
          {overview.recent.length === 0 ? (
            <p className="text-sm text-white/40">No payments yet.</p>
          ) : (
            overview.recent.map((r) => (
              <Card key={r.id} className="flex items-center justify-between gap-4 p-3.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white capitalize">
                    {r.itemType} · {r.provider}
                  </div>
                  <div className="truncate text-xs text-white/45">
                    {new Date(r.createdAt).toLocaleDateString()} · {r.id}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusPill tone={TONE[r.status] ?? "gold"}>{r.status}</StatusPill>
                  <span className="font-mono text-sm font-semibold text-white">{fmt(r.amountTotal, r.currency)}</span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
