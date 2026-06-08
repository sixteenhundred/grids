"use client";

import { useEffect, useState, useTransition } from "react";
import { useRole } from "@/components/dashboard/role-context";
import { PageHeader, SectionHeader, MetricCard, Card, StatusPill, Button, Icon } from "@/components/dashboard/ui";
import { PaymentConnections } from "@/components/dashboard/payment-connections";
import type { Accent } from "@/lib/grid-data";
import {
  listClientPayments,
  listCreatorEarnings,
  releasePayment,
  refundPayment,
  type ClientPaymentView,
  type CreatorEarningsView,
} from "@/lib/payment-actions";

/** Minor-unit, currency-aware formatter. */
function fmt(minor: number, currency = "eur"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(minor / 100);
  } catch {
    return `€${(minor / 100).toFixed(2)}`;
  }
}

const STATUS: Record<string, { label: string; tone: Accent; live?: boolean }> = {
  created: { label: "Processing", tone: "gold" },
  pending: { label: "Processing", tone: "gold" },
  paid: { label: "Held", tone: "blue", live: true },
  released: { label: "Released", tone: "escrow" },
  failed: { label: "Failed", tone: "red" },
  canceled: { label: "Canceled", tone: "red" },
  expired: { label: "Expired", tone: "red" },
  refunded: { label: "Refunded", tone: "purple" },
  disputed: { label: "Disputed", tone: "red" },
};

function PayStatus({ status }: { status: string }) {
  const s = STATUS[status] ?? STATUS.pending;
  return (
    <StatusPill tone={s.tone} live={s.live}>
      {s.label}
    </StatusPill>
  );
}

function Banner() {
  const [status, setStatus] = useState<string | null>(null);
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("status");
    if (p) setStatus(p);
  }, []);
  if (!status) return null;
  const map: Record<string, { icon: "check" | "clock" | "x"; tone: string; text: string }> = {
    success: { icon: "check", tone: "text-escrow-green", text: "Payment received — funds are held securely until you approve the work." },
    pending: { icon: "clock", tone: "text-review-gold", text: "Payment is processing. We'll update this page as soon as it settles." },
    cancel: { icon: "x", tone: "text-white/60", text: "Checkout was canceled. No charge was made." },
    error: { icon: "x", tone: "text-urgent-red", text: "Something went wrong with that payment. Please try again." },
  };
  const m = map[status] ?? map.error;
  return (
    <Card className="mb-6 flex items-center gap-3 p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] ${m.tone}`}>
        <Icon name={m.icon} size={18} />
      </span>
      <span className="text-sm text-white/80">{m.text}</span>
    </Card>
  );
}

export default function PaymentsPage() {
  const { role } = useRole();
  const [client, setClient] = useState<ClientPaymentView[] | null>(null);
  const [earnings, setEarnings] = useState<CreatorEarningsView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function load() {
    try {
      const [c, e] = await Promise.all([listClientPayments(), listCreatorEarnings()]);
      setClient(c);
      setEarnings(e);
    } catch {
      setError("Couldn't load your payments.");
    }
  }
  useEffect(() => {
    void load();
  }, []);

  function act(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Action failed.");
      }
    });
  }

  const isClient = role === "client";
  const spent = (client ?? []).filter((p) => ["paid", "released"].includes(p.status)).reduce((s, p) => s + p.amountTotal, 0);

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Grid"
          tone="escrow"
          title="Payments"
          subtitle={isClient ? "Your GRID payments, held securely until you approve." : "Your GRID earnings and payout connection."}
        />
        <Banner />

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {isClient ? (
            <>
              <MetricCard label="Total paid" value={fmt(spent)} tone="escrow" />
              <MetricCard label="Payments" value={String((client ?? []).length)} sub="all time" />
            </>
          ) : (
            <>
              <MetricCard label="Held" value={fmt(earnings?.heldTotal ?? 0, earnings?.currency)} tone="blue" sub="awaiting release" />
              <MetricCard label="Released to you" value={fmt(earnings?.releasedTotal ?? 0, earnings?.currency)} tone="escrow" sub="paid out via GRID" />
            </>
          )}
        </div>
      </div>

      {/* Connection (creator-facing, but useful to anyone who sells) */}
      <div className="rise" style={{ animationDelay: "80ms" }}>
        <SectionHeader title="Get paid" />
        <PaymentConnections />
      </div>

      {/* History */}
      <div className="rise" style={{ animationDelay: "160ms" }}>
        <SectionHeader title={isClient ? "Your payments" : "GRID earnings"} />
        {error && <p className="mb-3 text-sm text-urgent-red">{error}</p>}

        {isClient ? (
          <ClientList rows={client} pending={pending} onAct={act} />
        ) : (
          <CreatorList data={earnings} fmt={fmt} />
        )}
      </div>
    </div>
  );
}

function ClientList({
  rows,
  pending,
  onAct,
}: {
  rows: ClientPaymentView[] | null;
  pending: boolean;
  onAct: (fn: () => Promise<void>) => void;
}) {
  if (!rows) return <p className="text-sm text-white/40">Loading…</p>;
  if (rows.length === 0) return <p className="text-sm text-white/40">No payments yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {rows.map((p) => (
        <Card key={p.id} className="flex items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-escrow-green/12 text-escrow-green ring-1 ring-escrow-green/25">
              <Icon name={p.status === "released" ? "check" : "lock"} size={18} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white capitalize">{p.itemType}</div>
              <div className="truncate text-xs text-white/45">
                {new Date(p.createdAt).toLocaleDateString()} · {p.provider}
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {p.status === "paid" && (
              <div className="flex items-center gap-2">
                <Button tone="escrow" disabled={pending} onClick={() => onAct(() => releasePayment(p.id))}>
                  Approve &amp; release
                </Button>
                <Button variant="ghost" disabled={pending} onClick={() => onAct(() => refundPayment(p.id))}>
                  Refund
                </Button>
              </div>
            )}
            <PayStatus status={p.status} />
            <span className="font-mono text-sm font-semibold text-white">{fmt(p.amountTotal, p.currency)}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CreatorList({ data, fmt: f }: { data: CreatorEarningsView | null; fmt: (m: number, c?: string) => string }) {
  if (!data) return <p className="text-sm text-white/40">Loading…</p>;
  if (data.payments.length === 0) return <p className="text-sm text-white/40">No GRID earnings yet.</p>;
  return (
    <div className="flex flex-col gap-3">
      {data.payments.map((p) => (
        <Card key={p.id} className="flex items-center justify-between gap-4 p-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-escrow-green/12 text-escrow-green ring-1 ring-escrow-green/25">
              <Icon name={p.status === "released" ? "check" : "lock"} size={18} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white capitalize">{p.itemType}</div>
              <div className="truncate text-xs text-white/45">{new Date(p.createdAt).toLocaleDateString()}</div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <PayStatus status={p.status} />
            <span className="font-mono text-sm font-semibold text-white">{f(p.creatorAmount, p.currency)}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
