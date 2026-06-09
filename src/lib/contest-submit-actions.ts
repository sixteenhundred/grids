"use server";

/**
 * Contest submissions — the creator side (1c/1d). Submissions are PRIVATE
 * previews (no rights transfer) until a host redeems a token on them (Step 5).
 * Every amount/limit is enforced server-side; the client is never trusted.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { requireUser as requireAuth, getCurrentUser } from "./security/auth-guard";
import { ensureUserRow } from "./demo-user";
import { enforceRateLimit, type RateScope } from "./security/rate-guard";
import { db } from "./db";
import { contest, contestToken, contestSubmission, profile } from "./db/schema";
import { createSignedUploadUrl, getObjectSize, removeObject, deleteObject, isOwnedObjectPath } from "./services/storage.service";
import { reserveStorage } from "./quota";
import { safeInt } from "./validation";
import { VIDEO_MAX_BYTES, VIDEO_MAX_SECONDS, IMAGE_MAX_BYTES, type ContestType } from "./contest";

const genId = (p: string) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

async function requireUser(scope: RateScope = "write") {
  const u = await requireAuth();
  await ensureUserRow(u);
  await enforceRateLimit(scope, u.id);
  return u;
}

export type LiveContestView = {
  id: string;
  title: string;
  description: string;
  type: ContestType;
  prizeAmount: number;
  currency: string;
  tokenCount: number;
  submitCutoffAt: number | null;
  winnerPickAt: number | null;
  submissionCount: number;
  mySubmitted: boolean;
};

/** Live contests for the creator-facing list. */
export async function listLiveContests(): Promise<LiveContestView[]> {
  const u = await getCurrentUser();
  const rows = await db.select().from(contest).where(eq(contest.status, "live")).orderBy(desc(contest.createdAt));
  return Promise.all(
    rows.map(async (c) => {
      const [tk] = await db.select({ n: sql<number>`count(*)` }).from(contestToken).where(eq(contestToken.contestId, c.id));
      const [sc] = await db.select({ n: sql<number>`count(*)` }).from(contestSubmission).where(eq(contestSubmission.contestId, c.id));
      let mySubmitted = false;
      if (u) {
        const mine = await db
          .select({ id: contestSubmission.id })
          .from(contestSubmission)
          .where(and(eq(contestSubmission.contestId, c.id), eq(contestSubmission.creatorId, u.id)))
          .limit(1);
        mySubmitted = mine.length > 0;
      }
      return {
        id: c.id,
        title: c.title,
        description: c.description,
        type: c.type as ContestType,
        prizeAmount: c.prizeAmount,
        currency: c.currency,
        tokenCount: Number(tk?.n ?? 0),
        submitCutoffAt: c.submitCutoffAt ? c.submitCutoffAt.getTime() : null,
        winnerPickAt: c.winnerPickAt ? c.winnerPickAt.getTime() : null,
        submissionCount: Number(sc?.n ?? 0),
        mySubmitted,
      };
    }),
  );
}

export type SubmitContext = {
  contest: {
    id: string;
    title: string;
    description: string;
    type: ContestType;
    prizeAmount: number;
    currency: string;
    terms: string;
    status: string;
    submitCutoffAt: number | null;
    winnerPickAt: number | null;
    tokens: { label: string; amount: number }[];
  } | null;
  profile: { name: string; hasAvatar: boolean; hasCountry: boolean; country: string };
  mySubmissions: { id: string; title: string; status: string; addToPortfolio: boolean }[];
  open: boolean; // accepting submissions right now
};

/** Everything the submit UI needs: contest detail, my profile completeness, my entries. */
export async function getContestSubmitContext(id: string): Promise<SubmitContext> {
  const u = await requireUser("read");
  const empty = { name: "", hasAvatar: false, hasCountry: false, country: "" };
  const c = await db.select().from(contest).where(eq(contest.id, id)).limit(1).then((r) => r[0]);
  const p = await db.select().from(profile).where(eq(profile.userId, u.id)).limit(1).then((r) => r[0]);
  const name = (p?.displayName || u.name || "").trim();
  const country = (p?.country || "").trim();
  const prof = { name, hasAvatar: !!p?.avatar, hasCountry: !!country, country };

  if (!c) return { contest: null, profile: prof, mySubmissions: [], open: false };

  const tokens = await db.select().from(contestToken).where(eq(contestToken.contestId, c.id)).orderBy(contestToken.idx);
  const mine = await db
    .select()
    .from(contestSubmission)
    .where(and(eq(contestSubmission.contestId, c.id), eq(contestSubmission.creatorId, u.id)))
    .orderBy(desc(contestSubmission.createdAt));
  const open = c.status === "live" && (!c.submitCutoffAt || c.submitCutoffAt.getTime() > Date.now());

  return {
    contest: {
      id: c.id,
      title: c.title,
      description: c.description,
      type: c.type as ContestType,
      prizeAmount: c.prizeAmount,
      currency: c.currency,
      terms: c.terms,
      status: c.status,
      submitCutoffAt: c.submitCutoffAt ? c.submitCutoffAt.getTime() : null,
      winnerPickAt: c.winnerPickAt ? c.winnerPickAt.getTime() : null,
      tokens: tokens.map((t) => ({ label: t.label, amount: t.amount })),
    },
    profile: prof,
    mySubmissions: mine.map((m) => ({ id: m.id, title: m.title, status: m.status, addToPortfolio: m.addToPortfolio })),
    open,
  };
}

/** Fill the contest-required profile basics (name, picture, country) inline. */
export async function saveContestProfileBasics(input: {
  name: string;
  avatarDataUrl?: string | null;
  country: string;
}): Promise<void> {
  const u = await requireUser("write");
  const existing = await db.select().from(profile).where(eq(profile.userId, u.id)).limit(1).then((r) => r[0]);

  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (input.name?.trim()) patch.displayName = input.name.trim().slice(0, 80);
  if (input.country?.trim()) patch.country = input.country.trim().slice(0, 80);
  if (input.avatarDataUrl) {
    if (!input.avatarDataUrl.startsWith("data:image/")) throw new Error("Profile picture must be an image.");
    if (input.avatarDataUrl.length > 3_000_000) throw new Error("Profile picture is too large (max ~2 MB).");
    patch.avatar = input.avatarDataUrl;
  }

  if (existing) {
    await db.update(profile).set(patch).where(eq(profile.userId, u.id));
  } else {
    await db.insert(profile).values({ id: genId("prof"), userId: u.id, role: "creative", ...patch });
  }
}

/** A signed URL to upload the submission file. Size validated against the contest type. */
export async function createContestUploadUrl(
  contestId: string,
  fileName: string,
  size: number,
): Promise<{ path: string; token: string }> {
  const u = await requireUser("upload");
  const c = await db.select().from(contest).where(eq(contest.id, contestId)).limit(1).then((r) => r[0]);
  if (!c || c.status !== "live") throw new Error("This contest isn't accepting submissions.");
  const limit = c.type === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (size <= 0 || size > limit) {
    throw new Error(c.type === "video" ? "Video exceeds the 2 GB limit." : "Image exceeds the 5 GB limit.");
  }
  const res = await createSignedUploadUrl({ userId: u.id, category: "contests", name: fileName.slice(0, 300), bytes: size });
  if (!res.ok) throw new Error(res.error);
  return { path: res.data.path, token: res.data.token };
}

/** Record a contest submission. Re-validates window, profile, terms, file ownership + size. */
export async function submitToContest(input: {
  contestId: string;
  title: string;
  description: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  durationSec?: number | null;
  addToPortfolio: boolean;
  acceptTerms: boolean;
}): Promise<void> {
  const u = await requireUser("write");
  if (!input.acceptTerms) throw new Error("You must accept the terms of admission to enter.");

  const c = await db.select().from(contest).where(eq(contest.id, input.contestId)).limit(1).then((r) => r[0]);
  if (!c) throw new Error("Contest not found.");
  if (c.status !== "live") throw new Error("This contest isn't accepting submissions.");
  if (c.submitCutoffAt && c.submitCutoffAt.getTime() <= Date.now()) throw new Error("The submission deadline has passed.");

  // Required profile fields (1d): name, picture, country.
  const p = await db.select().from(profile).where(eq(profile.userId, u.id)).limit(1).then((r) => r[0]);
  const name = (p?.displayName || u.name || "").trim();
  if (!name || !p?.avatar || !(p?.country || "").trim()) {
    throw new Error("Add your name, profile picture and country before submitting.");
  }

  // File must belong to this user (validate BEFORE any storage call).
  if (!input.filePath || !isOwnedObjectPath(u.id, input.filePath)) throw new Error("Invalid upload.");

  // Enforce the 2-minute rule server-side for video contests; bound the value
  // regardless so the integer column can't be poisoned with NaN/huge input.
  const durationSec = safeInt(input.durationSec ?? 0, { min: 0, max: 86_400 });
  if (c.type === "video" && durationSec > VIDEO_MAX_SECONDS) {
    await removeObject(input.filePath);
    throw new Error("Video exceeds the 2-minute limit.");
  }

  // Re-check the stored size against the limit.
  const sizeRes = await getObjectSize(input.filePath);
  if (!sizeRes.ok) throw new Error("Uploaded file not found.");
  const storedSize = sizeRes.data;
  const limit = c.type === "video" ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (storedSize > limit) {
    await removeObject(input.filePath);
    throw new Error("File exceeds the allowed size.");
  }

  // Charge the upload against the creator's storage quota — closes the exhaustion
  // bypass (every other upload path reserves; this one must too).
  const reserved = await reserveStorage(u.id, storedSize);
  if (!reserved.ok) {
    await removeObject(input.filePath);
    throw new Error(reserved.reason);
  }

  try {
    await db.insert(contestSubmission).values({
      id: genId("csub"),
      contestId: c.id,
      creatorId: u.id,
      title: input.title.trim().slice(0, 160) || "Untitled",
      description: input.description?.trim().slice(0, 4000) ?? "",
      filePath: input.filePath,
      fileType: input.fileType?.slice(0, 100) || null,
      fileSize: storedSize,
      durationSec,
      status: "submitted",
      addToPortfolio: !!input.addToPortfolio,
      termsAccepted: true,
    });
  } catch (e) {
    // Roll back the reserved quota + orphaned object if the insert fails.
    await deleteObject(u.id, input.filePath, storedSize);
    throw e;
  }
}
