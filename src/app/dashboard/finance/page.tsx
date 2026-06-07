"use client";

import { useEffect, useState } from "react";
import { useRole } from "@/components/dashboard/role-context";
import { PageHeader, SectionHeader, MetricCard, Card, StatusPill, Button, Icon } from "@/components/dashboard/ui";
import { useSheet, SheetHeader, SheetRow } from "@/components/dashboard/sheet";
import { CONTRACTS, METRICS, money, type Contract } from "@/lib/grid-data";
import { loadBank, saveBank, maskAccount, payoutEstimate, DEFAULT_BANK, type BankDetails } from "@/lib/bank";

/* -------------------------------------------------------------------------- */
/*  Withdraw sheet — saved bank details, editable, with payout timing          */
/* -------------------------------------------------------------------------- */

function field(label: string, value: string, onChange: (v: string) => void, placeholder?: string) {
  return (
    <div>
      <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-escrow-green/50"
      />
    </div>
  );
}

function WithdrawSheet({ amount }: { amount: number }) {
  const { close } = useSheet();
  const [bank, setBank] = useState<BankDetails>(DEFAULT_BANK);
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState<"review" | "processing" | "done">("review");
  const [result, setResult] = useState<{ instant: boolean; eta: string } | null>(null);

  useEffect(() => setBank(loadBank()), []);

  const set = <K extends keyof BankDetails>(k: K, v: BankDetails[K]) => setBank((b) => ({ ...b, [k]: v }));

  function saveDetails() {
    saveBank(bank);
    setEditing(false);
  }

  function withdraw() {
    saveBank(bank);
    setStep("processing");
    setResult(payoutEstimate(amount));
    setTimeout(() => setStep("done"), 1100);
  }

  if (step === "done" && result) {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
          <Icon name={result.instant ? "check" : "clock"} size={30} />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">{money(amount)} on its way</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
          {result.eta} to {bank.bankName} ({maskAccount(bank.accountNumber)}).
          {result.instant ? " No fee, no waiting." : " We’ll notify you the moment it lands."}
        </p>
        <div className="mt-6">
          <Button full tone="escrow" onClick={close}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SheetHeader title="Withdraw funds" subtitle={`${money(amount)} available to pay out`} />

      {editing ? (
        <div className="flex flex-col gap-4">
          {field("Account holder", bank.holder, (v) => set("holder", v))}
          {field("Bank", bank.bankName, (v) => set("bankName", v))}
          {field("Account / IBAN", bank.accountNumber, (v) => set("accountNumber", v))}
          {field("Country", bank.country, (v) => set("country", v))}
          <div className="flex gap-2.5">
            <Button tone="escrow" onClick={saveDetails}>
              Save details
            </Button>
            <Button variant="ghost" onClick={() => { setBank(loadBank()); setEditing(false); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-1">
            <SheetRow label="To" value={bank.holder} />
            <SheetRow label="Bank" value={bank.bankName} />
            <SheetRow label="Account" value={maskAccount(bank.accountNumber)} />
            <SheetRow label="Country" value={bank.country} />
          </div>
          <button onClick={() => setEditing(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-aerial-cyan transition-colors hover:text-white">
            <Icon name="file" size={14} /> Edit bank details
          </button>

          <p className="mt-5 flex items-center gap-2 text-xs text-white/50">
            <Icon name="lock" size={13} className="text-escrow-green" />
            Most payouts arrive instantly. Some take up to 1–3 business days.
          </p>

          <div className="mt-6">
            <Button full tone="escrow" arrow disabled={step === "processing"} onClick={withdraw}>
              {step === "processing" ? "Processing…" : `Withdraw ${money(amount)}`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function FinancePage() {
  const { role } = useRole();
  const { open } = useSheet();

  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="rise">
        <PageHeader
          eyebrow="Grid"
          tone="escrow"
          title="Finance"
          subtitle="Balances and payouts in one place."
        />

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <MetricCard label="Processing" value={money(METRICS.inEscrow)} tone="escrow" sub="held, protected" />
          <MetricCard label="Available" value={money(METRICS.available)} sub="ready to withdraw" />
          {role === "client" ? (
            <MetricCard label="Total spent" value={money(METRICS.totalSpent)} />
          ) : (
            <MetricCard label="This month" value={money(METRICS.thisMonth)} />
          )}
          <MetricCard label="On-time" value="100%" tone="escrow" />
        </div>
      </div>

      {/* Payment activity ledger */}
      <div className="rise" style={{ animationDelay: "80ms" }}>
        <SectionHeader title="Payment activity" />
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
          <Button tone="escrow" arrow onClick={() => open(<WithdrawSheet amount={METRICS.available} />)}>
            Withdraw available
          </Button>
        </div>
      </div>
    </div>
  );
}
