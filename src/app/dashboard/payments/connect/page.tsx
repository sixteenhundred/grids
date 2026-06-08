"use client";

import { useEffect, useState } from "react";
import { PageHeader, Card, Button, Icon } from "@/components/dashboard/ui";
import { refreshStripeConnection, type ConnectionView } from "@/lib/payment-actions";

/**
 * Stripe Connect return lander. Stripe redirects here after onboarding; we pull
 * the latest account status and show where the creator stands.
 */
export default function ConnectReturnPage() {
  const [conn, setConn] = useState<ConnectionView | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshStripeConnection()
      .then(setConn)
      .catch(() => setError("Couldn't refresh your connection status."));
  }, []);

  const connected = conn?.status === "connected";
  const needsMore = conn?.status === "action_required" || conn?.status === "pending";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Grid" tone="escrow" title="Payment setup" subtitle="Finishing your Stripe connection." />
      </div>

      <Card className="p-6 text-center">
        {error ? (
          <p className="text-sm text-urgent-red">{error}</p>
        ) : !conn ? (
          <p className="text-sm text-white/40">Checking your status…</p>
        ) : (
          <>
            <span
              className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ring-1 ${
                connected ? "bg-escrow-green/15 text-escrow-green ring-escrow-green/30" : "bg-review-gold/15 text-review-gold ring-review-gold/30"
              }`}
            >
              <Icon name={connected ? "check" : "clock"} size={30} />
            </span>
            <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">
              {connected ? "You're all set" : needsMore ? "Almost there" : "Connection updated"}
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
              {connected
                ? "Your Stripe account is connected. GRID earnings will be paid out to you after a client approves the work."
                : needsMore
                  ? "Stripe still needs a few more details before payouts can be enabled. You can resume any time."
                  : "We've refreshed your Stripe connection status."}
            </p>
            <div className="mt-6">
              <Button full tone="escrow" href="/dashboard/payments">
                Back to payments
              </Button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
