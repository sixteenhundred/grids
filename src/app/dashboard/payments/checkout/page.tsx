"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Card, Button, Icon } from "@/components/dashboard/ui";
import { getPaymentBreakdown, startCheckout, type PriceBreakdown } from "@/lib/payment-actions";

function fmt(minor: number, currency = "eur"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency.toUpperCase() }).format(minor / 100);
  } catch {
    return `€${(minor / 100).toFixed(2)}`;
  }
}

type Provider = "stripe" | "paypal";

export default function CheckoutPage() {
  const [item, setItem] = useState<{ itemType: string; itemId: string } | null>(null);
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null);
  const [provider, setProvider] = useState<Provider>("stripe");
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const itemType = q.get("itemType");
    const itemId = q.get("itemId");
    if (!itemType || !itemId) {
      setError("Missing item to pay for.");
      setLoading(false);
      return;
    }
    setItem({ itemType, itemId });
    getPaymentBreakdown(itemType, itemId)
      .then((b) => {
        if (!b) setError("This item isn't available for purchase.");
        else setBreakdown(b);
      })
      .catch(() => setError("Couldn't load this checkout."))
      .finally(() => setLoading(false));
  }, []);

  async function pay() {
    if (!item) return;
    setRedirecting(true);
    setError(null);
    try {
      const { url } = await startCheckout({ itemType: item.itemType, itemId: item.itemId, provider });
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start checkout.");
      setRedirecting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Grid" tone="escrow" title="Checkout" subtitle="Pay securely. Funds are held until you approve the work." />
      </div>

      {loading ? (
        <p className="text-sm text-white/40">Loading…</p>
      ) : !breakdown ? (
        <Card className="p-6">
          <p className="text-sm text-urgent-red">{error ?? "Unavailable."}</p>
          <div className="mt-4">
            <Button variant="ghost" href="/dashboard/payments">
              Back to payments
            </Button>
          </div>
        </Card>
      ) : (
        <div className="rise" style={{ animationDelay: "60ms" }}>
          <Card className="p-6">
            <div className="text-sm font-semibold text-white">{breakdown.name}</div>

            {/* Price breakdown */}
            <div className="mt-4 rounded-2xl border border-escrow-green/25 bg-escrow-green/[0.06] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/55">Item price</span>
                <span className="text-white/85">{fmt(breakdown.price, breakdown.currency)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-white/55">GRID platform fee</span>
                <span className="text-white/85">{fmt(breakdown.platformFee, breakdown.currency)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-sm">
                <span className="text-white/55">Total due</span>
                <span className="font-semibold text-white">{fmt(breakdown.amountTotal, breakdown.currency)}</span>
              </div>
            </div>

            {/* Provider choice */}
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              {(["stripe", "paypal"] as Provider[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors ${
                    provider === p
                      ? "border-escrow-green/50 bg-escrow-green/[0.08] text-white"
                      : "border-white/10 bg-white/[0.02] text-white/55 hover:text-white"
                  }`}
                >
                  <Icon name={p === "stripe" ? "wallet" : "globe"} size={16} />
                  {p === "stripe" ? "Card" : "PayPal"}
                </button>
              ))}
            </div>

            {error && <p className="mt-3 text-xs text-urgent-red">{error}</p>}

            <div className="mt-5">
              <Button full tone="escrow" arrow disabled={redirecting} onClick={pay}>
                {redirecting ? "Redirecting…" : `Pay ${fmt(breakdown.amountTotal, breakdown.currency)}`}
              </Button>
            </div>

            <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-white/40">
              <Icon name="lock" size={13} className="mt-0.5 shrink-0 text-escrow-green" />
              You'll complete payment on {provider === "stripe" ? "Stripe's" : "PayPal's"} secure page.
              GRID never sees or stores your card or login details.
            </p>
          </Card>

          <div className="mt-4">
            <Link href="/dashboard/payments" className="text-sm text-white/45 transition-colors hover:text-white">
              ← Back to payments
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
