"use server";

/**
 * Contest server actions. Admin-only surface for Step 2 (create / manage /
 * promote). Funding (brand hold / GRID-funded), creator submissions, and token
 * redemption arrive in later steps. Amounts are MINOR units; the token split is
 * validated server-side to sum exactly to the prize (never trust the client).
 */
import { desc, eq, sql } from "drizzle-orm";
import { requireAdmin } from "./security/auth-guard";
import { db } from "./db";
import { contest, contestToken, contestSubmission } from "./db/schema";
import {
  CONTEST_TERMS,
  validateSplit,
  type ContestStatus,
  type ContestType,
  type ContestView,
  type FundingSource,
  type TokenInput,
} from "./contest";
import { createBroadcastNotification } from "./notifications";

const genId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const toMs = (d: Date | null) => (d ? d.getTime() : null);
function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** All contests with their tokens + submission counts (admin overview). */
export async function listContests(): Promise<ContestView[]> {
  await requireAdmin();
  const rows = await db.select().from(contest).orderBy(desc(contest.createdAt));
  return Promise.all(
    rows.map(async (c) => {
      const tokens = await db.select().from(contestToken).where(eq(contestToken.contestId, c.id)).orderBy(contestToken.idx);
      const [cnt] = await db
        .select({ n: sql<number>`count(*)` })
        .from(contestSubmission)
        .where(eq(contestSubmission.contestId, c.id));
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        type: c.type as ContestType,
        status: c.status as ContestStatus,
        fundingSource: c.fundingSource as FundingSource,
        prizeAmount: c.prizeAmount,
        platformFee: c.platformFee,
        currency: c.currency,
        submitCutoffAt: toMs(c.submitCutoffAt),
        winnerPickAt: toMs(c.winnerPickAt),
        tokens: tokens.map((t) => ({ id: t.id, idx: t.idx, label: t.label, amount: t.amount, status: t.status })),
        submissionCount: Number(cnt?.n ?? 0),
        createdAt: c.createdAt.getTime(),
      };
    }),
  );
}

/** Create a contest + its prize tokens. GRID-funded goes live immediately (fee 0);
 *  brand-funded starts pending_funding (the deposit is collected in the funding step). */
export async function createContest(input: {
  title: string;
  description: string;
  type: ContestType;
  fundingSource: FundingSource;
  prizeAmount: number; // minor units, total
  currency?: string;
  submitCutoffAt: string | null;
  winnerPickAt: string | null;
  tokens: TokenInput[];
}): Promise<void> {
  const admin = await requireAdmin();

  const title = input.title.trim();
  if (!title) throw new Error("Title is required.");
  const prize = Math.max(0, Math.round(input.prizeAmount));
  if (prize <= 0) throw new Error("Prize amount must be greater than zero.");

  const tokens = input.tokens.map((t, i) => ({
    label: (t.label || `Prize ${i + 1}`).trim(),
    amount: Math.max(0, Math.round(t.amount)),
  }));
  const v = validateSplit(tokens, prize);
  if (!v.ok) throw new Error(v.error ?? "Invalid token split.");

  const id = genId("ctst");
  const status: ContestStatus = input.fundingSource === "grid" ? "live" : "pending_funding";

  await db.transaction(async (tx) => {
    await tx.insert(contest).values({
      id,
      title,
      description: input.description?.trim() ?? "",
      type: input.type,
      status,
      fundingSource: input.fundingSource,
      hostId: null, // GRID/platform-hosted when created from admin
      prizeAmount: prize,
      platformFee: 0, // brand-funded fee is computed at the funding step
      currency: (input.currency || "eur").toLowerCase(),
      submitCutoffAt: parseDate(input.submitCutoffAt),
      winnerPickAt: parseDate(input.winnerPickAt),
      terms: CONTEST_TERMS,
      createdBy: admin.id,
    });
    await tx.insert(contestToken).values(
      tokens.map((t, i) => ({
        id: genId("ctok"),
        contestId: id,
        idx: i,
        label: t.label,
        amount: t.amount,
        status: "available" as const,
      })),
    );
  });
}

/** Close / cancel / re-open a contest (admin). */
export async function updateContestStatus(id: string, status: "live" | "closed" | "canceled"): Promise<void> {
  await requireAdmin();
  await db.update(contest).set({ status, updatedAt: new Date() }).where(eq(contest.id, id));
}

/** Delete a contest (cascades tokens + submissions). */
export async function deleteContest(id: string): Promise<void> {
  await requireAdmin();
  await db.delete(contest).where(eq(contest.id, id));
}

/** Promote a contest — fires a broadcast notification to ALL users. */
export async function promoteContest(id: string): Promise<void> {
  await requireAdmin();
  const c = await db.select().from(contest).where(eq(contest.id, id)).limit(1).then((r) => r[0]);
  if (!c) throw new Error("Contest not found.");
  await createBroadcastNotification({
    type: "contest",
    title: `New contest: ${c.title}`,
    body: c.description?.slice(0, 200) || "A new contest is live on GRID. Enter to win a share of the prize.",
    icon: "gift",
    link: `/dashboard/contests/${c.id}`,
  });
}
