"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, Button, Icon, StatusPill } from "./ui";
import type { Accent } from "@/lib/grid-data";
import {
  getPaymentConnections,
  connectStripe,
  refreshStripeConnection,
  disconnectStripe,
  registerPayPalPayoutInterest,
  type ConnectionView,
} from "@/lib/payment-actions";

/**
 * Creator "Connect Payments" card. Shows GRID-relevant connection status only —
 * never the creator's real Stripe/PayPal balance. Stripe is fully wired
 * (Connect onboarding); PayPal payouts are "coming soon / manual verification".
 */

const STATUS_META: Record<string, { label: string; tone: Accent }> = {
  connected: { label: "Connected", tone: "escrow" },
  pending: { label: "Pending", tone: "gold" },
  action_required: { label: "Action needed", tone: "gold" },
  disabled: { label: "Disabled", tone: "red" },
  not_connected: { label: "Not connected", tone: "blue" },
};

function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status] ?? STATUS_META.not_connected;
  if (status === "not_connected") {
    return <span className="text-xs font-medium text-white/40">Not connected</span>;
  }
  return <StatusPill tone={meta.tone}>{meta.label}</StatusPill>;
}

export function PaymentConnections() {
  const [conns, setConns] = useState<ConnectionView[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function load() {
    try {
      setConns(await getPaymentConnections());
    } catch {
      setError("Couldn't load your payment connections.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const stripe = conns?.find((c) => c.provider === "stripe");
  const paypal = conns?.find((c) => c.provider === "paypal");

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        await load();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  }

  async function goConnectStripe() {
    setError(null);
    try {
      const { url } = await connectStripe();
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Stripe is unavailable right now.");
    }
  }

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-escrow-green/12 text-escrow-green ring-1 ring-escrow-green/25">
          <Icon name="wallet" size={18} />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-white">Connect payments</h3>
          <p className="text-xs text-white/45">Get paid for your GRID work.</p>
        </div>
      </div>

      {/* Stripe */}
      <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            Stripe
            {stripe && <StatusBadge status={stripe.status} />}
          </div>
          <p className="mt-0.5 text-xs text-white/45">
            {stripe?.status === "connected"
              ? "Payouts enabled. You'll receive GRID earnings here."
              : stripe?.status === "action_required"
                ? "Stripe needs a little more information to finish setup."
                : stripe?.status === "disabled"
                  ? "This connection is disabled — reconnect to keep getting paid."
                  : "Connect a Stripe account to receive payouts from GRID projects."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {stripe?.status === "connected" ? (
            <Button variant="ghost" disabled={pending} onClick={() => run(disconnectStripe)}>
              Disconnect
            </Button>
          ) : (
            <Button tone="escrow" disabled={pending} onClick={goConnectStripe}>
              {stripe && (stripe.status === "pending" || stripe.status === "action_required") ? "Resume setup" : "Connect Stripe"}
            </Button>
          )}
        </div>
      </div>

      {/* PayPal — coming soon */}
      <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-medium text-white">
            PayPal
            {paypal?.status === "pending" ? <StatusPill tone="gold">Pending review</StatusPill> : <span className="text-xs font-medium text-white/40">Coming soon</span>}
          </div>
          <p className="mt-0.5 text-xs text-white/45">
            PayPal payouts are being rolled out. Register interest and we'll verify your
            account manually when it's ready.
          </p>
        </div>
        <div className="shrink-0">
          <Button
            variant="ghost"
            disabled={pending || paypal?.status === "pending"}
            onClick={() => run(registerPayPalPayoutInterest)}
          >
            {paypal?.status === "pending" ? "Requested" : "Notify me"}
          </Button>
        </div>
      </div>

      {error && <p className="mt-3 text-xs text-urgent-red">{error}</p>}

      {/* Balance disclaimer (required) */}
      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-white/40">
        <Icon name="lock" size={13} className="mt-0.5 shrink-0 text-escrow-green" />
        GRID shows only your GRID earnings and connection status — never your full Stripe
        or PayPal balance. We never store your card, bank, or login details.
      </p>
    </Card>
  );
}
