/**
 * Saved payout bank details (localStorage) + withdrawal timing.
 *
 * Demo-only: a real integration would store these with a payment provider,
 * never in the browser. Swap loadBank/saveBank for server actions when ready.
 */

export type BankDetails = {
  holder: string;
  bankName: string;
  accountNumber: string; // IBAN / account number
  country: string;
};

const KEY = "grid:bank";

export const DEFAULT_BANK: BankDetails = {
  holder: "John Hope",
  bankName: "Revolut",
  accountNumber: "GB29 NWBK 6016 1331 9268 19",
  country: "United Kingdom",
};

export function loadBank(): BankDetails {
  if (typeof window === "undefined") return DEFAULT_BANK;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null) return DEFAULT_BANK;
    return { ...DEFAULT_BANK, ...(JSON.parse(raw) as Partial<BankDetails>) };
  } catch {
    return DEFAULT_BANK;
  }
}

export function saveBank(b: BankDetails): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(b));
  } catch {
    /* ignore */
  }
}

/** Mask all but the last 4 characters of an account number. */
export function maskAccount(acc: string): string {
  const trimmed = acc.replace(/\s+/g, "");
  if (trimmed.length <= 4) return trimmed;
  return `•••• ${trimmed.slice(-4)}`;
}

/** Decide payout speed. Instant for smaller amounts or ~40% of the time. */
export function payoutEstimate(amount: number): { instant: boolean; eta: string } {
  const instant = amount <= 1500 || Math.random() < 0.4;
  return instant ? { instant: true, eta: "Arriving instantly" } : { instant: false, eta: "Arrives in 1–3 business days" };
}
