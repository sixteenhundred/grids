"use server";

/**
 * Grid Academy — server actions (database-backed).
 *
 * Owner:   getMyAcademy / updateAcademyConfig / createPath / removePath /
 *          createLesson / removeLesson.
 * Learner: listAcademies / getAcademyById / getPath / getLesson /
 *          setLessonComplete.
 */

import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { requireUser as requireAuth } from "./security/auth-guard";
import { requireFeatureAccess } from "./entitlements";
import { DEMO_MODE } from "./client/config";
import { ensureUserRow } from "./demo-user";
import { db } from "./db";
import { academy, academyEnrollment, learningPath, lesson, lessonProgress } from "./db/schema";
import {
  DEFAULT_ACADEMY,
  SEED_PATHS,
  tileForLevel,
  type AcademyConfig,
  type AcademySummary,
  type AcademyView,
  type Level,
  type LearningPath,
  type Lesson,
  type MyAcademy,
  type PathDetail,
  type LessonDetail,
  type NewPath,
  type NewLesson,
} from "./academy";

type AcademyRow = typeof academy.$inferSelect;
type PathRow = typeof learningPath.$inferSelect;
type LessonRow = typeof lesson.$inferSelect;

function genId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

async function requireUser() {
  const u = await requireAuth(); // Supabase session; throws AuthError(401) if none
  await ensureUserRow(u); // mirror row for FK-backed inserts (belt-and-suspenders)
  return u;
}

/** Running an academy is the gated "academy" feature; enrolling/learning is NOT. */
async function requireAcademyOwner() {
  const u = await requireUser();
  await requireFeatureAccess(u.id, "academy"); // throws AuthError(403) below plan; no-op in demo
  return u;
}

function toConfig(a: AcademyRow): AcademyConfig {
  return { name: a.name, description: a.description, logo: a.logo, banner: a.banner, price: a.price };
}

/** True if the user has paid access to this academy. */
async function isEnrolled(userId: string, academyId: string): Promise<boolean> {
  const row = await db
    .select()
    .from(academyEnrollment)
    .where(and(eq(academyEnrollment.userId, userId), eq(academyEnrollment.academyId, academyId)))
    .limit(1).then((r) => r[0]);
  return !!row;
}

function toPath(row: PathRow, academyName: string, lessonCount: number, completedCount: number): LearningPath {
  const level = row.level as Level;
  return {
    id: row.id,
    academyId: row.academyId,
    academyName,
    title: row.title,
    description: row.description,
    level,
    coverImage: row.coverImage,
    coverTile: tileForLevel(level),
    lessonCount,
    completedCount,
    createdAt: row.createdAt.getTime(),
  };
}

function toLesson(row: LessonRow): Lesson {
  return {
    id: row.id,
    pathId: row.pathId,
    title: row.title,
    content: row.content,
    duration: row.duration,
    position: row.position,
    createdAt: row.createdAt.getTime(),
  };
}

/** Paths for an academy, each with lesson + per-user completion counts. */
async function pathsWithCounts(academyId: string, academyName: string, userId: string): Promise<LearningPath[]> {
  const paths = await db.select().from(learningPath).where(eq(learningPath.academyId, academyId)).orderBy(asc(learningPath.createdAt));
  if (paths.length === 0) return [];
  const ids = paths.map((p) => p.id);

  const counts = await db
    .select({ pathId: lesson.pathId, n: sql<number>`count(*)` })
    .from(lesson)
    .where(inArray(lesson.pathId, ids))
    .groupBy(lesson.pathId);
  const countMap = new Map(counts.map((c) => [c.pathId, Number(c.n)]));

  const done = await db
    .select({ pathId: lesson.pathId, n: sql<number>`count(*)` })
    .from(lessonProgress)
    .innerJoin(lesson, eq(lessonProgress.lessonId, lesson.id))
    .where(and(eq(lessonProgress.userId, userId), inArray(lesson.pathId, ids)))
    .groupBy(lesson.pathId);
  const doneMap = new Map(done.map((d) => [d.pathId, Number(d.n)]));

  return paths.map((p) => toPath(p, academyName, countMap.get(p.id) ?? 0, doneMap.get(p.id) ?? 0));
}

async function ensureAcademyRow(userId: string, userName?: string | null): Promise<AcademyRow> {
  const existing = await db.select().from(academy).where(eq(academy.userId, userId)).limit(1).then((r) => r[0]);
  if (existing) return existing;

  const id = genId("acad");
  const now = new Date();
  const first = userName?.trim().split(" ")[0];
  await db.insert(academy).values({
    id,
    userId,
    name: first ? `${first}'s Academy` : DEFAULT_ACADEMY.name,
    description: DEFAULT_ACADEMY.description,
    createdAt: now,
    updatedAt: now,
  });

  // Seed example paths + lessons ONLY in demo mode. At launch (DEMO_MODE=false)
  // a new academy starts empty — no sample/seed rows reach production (Rule 3).
  if (DEMO_MODE) {
    const base = Date.now();
    for (let pi = 0; pi < SEED_PATHS.length; pi++) {
      const { path, lessons } = SEED_PATHS[pi];
      const pathId = genId("path");
      await db.insert(learningPath).values({
        id: pathId,
        academyId: id,
        userId,
        title: path.title,
        description: path.description,
        level: path.level,
        coverImage: null,
        createdAt: new Date(base + pi * 1000),
      });
      if (lessons.length) {
        await db.insert(lesson).values(
          lessons.map((l, i) => ({
            id: genId("les"),
            pathId,
            userId,
            title: l.title,
            content: l.content,
            duration: l.duration,
            position: i,
            createdAt: new Date(base + i),
          })),
        );
      }
    }
  }

  return (await db.select().from(academy).where(eq(academy.id, id)).limit(1).then((r) => r[0]))!;
}

/* -------------------------------------------------------------------------- */
/*  Owner                                                                      */
/* -------------------------------------------------------------------------- */

export async function getMyAcademy(): Promise<MyAcademy> {
  const u = await requireAcademyOwner();
  const a = await ensureAcademyRow(u.id, u.name);
  return { academyId: a.id, config: toConfig(a), paths: await pathsWithCounts(a.id, a.name, u.id) };
}

export async function updateAcademyConfig(config: AcademyConfig): Promise<void> {
  const u = await requireAcademyOwner();
  const a = await ensureAcademyRow(u.id, u.name);
  await db
    .update(academy)
    .set({
      name: config.name.trim() || DEFAULT_ACADEMY.name,
      description: config.description,
      logo: config.logo,
      banner: config.banner,
      price: Math.max(0, Math.round(config.price)),
      updatedAt: new Date(),
    })
    .where(eq(academy.id, a.id));
}

export async function createPath(input: NewPath): Promise<LearningPath> {
  const u = await requireAcademyOwner();
  const a = await ensureAcademyRow(u.id, u.name);
  const id = genId("path");
  await db.insert(learningPath).values({
    id,
    academyId: a.id,
    userId: u.id,
    title: input.title.trim(),
    description: input.description.trim(),
    level: input.level,
    coverImage: input.coverImage,
    createdAt: new Date(),
  });
  const row = (await db.select().from(learningPath).where(eq(learningPath.id, id)).limit(1).then((r) => r[0]))!;
  return toPath(row, a.name, 0, 0);
}

export async function removePath(id: string): Promise<void> {
  const u = await requireAcademyOwner();
  await db.delete(learningPath).where(and(eq(learningPath.id, id), eq(learningPath.userId, u.id)));
}

export async function createLesson(pathId: string, input: NewLesson): Promise<Lesson> {
  const u = await requireAcademyOwner();
  const p = await db.select().from(learningPath).where(eq(learningPath.id, pathId)).limit(1).then((r) => r[0]);
  if (!p || p.userId !== u.id) throw new Error("Not allowed.");
  const countRow = await db.select({ n: sql<number>`count(*)` }).from(lesson).where(eq(lesson.pathId, pathId)).limit(1).then((r) => r[0]);
  const position = Number(countRow?.n ?? 0);
  const id = genId("les");
  await db.insert(lesson).values({
    id,
    pathId,
    userId: u.id,
    title: input.title.trim(),
    content: input.content.trim(),
    duration: input.duration.trim(),
    position,
    createdAt: new Date(),
  });
  return toLesson((await db.select().from(lesson).where(eq(lesson.id, id)).limit(1).then((r) => r[0]))!);
}

export async function removeLesson(id: string): Promise<void> {
  const u = await requireAcademyOwner();
  await db.delete(lesson).where(and(eq(lesson.id, id), eq(lesson.userId, u.id)));
}

/* -------------------------------------------------------------------------- */
/*  Learner                                                                    */
/* -------------------------------------------------------------------------- */

export async function listAcademies(): Promise<AcademySummary[]> {
  const rows = await db
    .select({
      id: academy.id,
      name: academy.name,
      description: academy.description,
      logo: academy.logo,
      banner: academy.banner,
      price: academy.price,
      pathCount: sql<number>`count(${learningPath.id})`,
    })
    .from(academy)
    .leftJoin(learningPath, eq(learningPath.academyId, academy.id))
    .groupBy(academy.id)
    .orderBy(desc(academy.createdAt));
  return rows.map((r) => ({ ...r, pathCount: Number(r.pathCount) }));
}

/** Academy IDs the current user has paid access to. */
export async function listMyEnrollments(): Promise<string[]> {
  const u = await requireUser();
  const rows = await db.select({ academyId: academyEnrollment.academyId }).from(academyEnrollment).where(eq(academyEnrollment.userId, u.id));
  return rows.map((r) => r.academyId);
}

export async function enrollAcademy(academyId: string): Promise<void> {
  const u = await requireUser();
  const a = await db.select().from(academy).where(eq(academy.id, academyId)).limit(1).then((r) => r[0]);
  if (!a) throw new Error("Academy not found.");
  if (await isEnrolled(u.id, academyId)) return;
  await db.insert(academyEnrollment).values({ id: genId("enr"), userId: u.id, academyId, price: a.price, createdAt: new Date() });
}

export async function getAcademyById(academyId: string): Promise<AcademyView | null> {
  const u = await requireUser();
  const a = await db.select().from(academy).where(eq(academy.id, academyId)).limit(1).then((r) => r[0]);
  if (!a) return null;
  const isOwner = a.userId === u.id;
  const enrolled = isOwner ? true : await isEnrolled(u.id, a.id);
  const locked = a.price > 0 && !isOwner && !enrolled;
  return { academyId: a.id, config: toConfig(a), paths: await pathsWithCounts(a.id, a.name, u.id), isOwner, enrolled, locked };
}

export async function getPath(pathId: string): Promise<PathDetail | null> {
  const u = await requireUser();
  const p = await db.select().from(learningPath).where(eq(learningPath.id, pathId)).limit(1).then((r) => r[0]);
  if (!p) return null;
  const a = await db.select().from(academy).where(eq(academy.id, p.academyId)).limit(1).then((r) => r[0]);
  const academyName = a?.name ?? "Academy";
  const academyPrice = a?.price ?? 0;
  const isOwner = p.userId === u.id;
  const locked = academyPrice > 0 && !isOwner && !(await isEnrolled(u.id, p.academyId));
  const lessons = await db.select().from(lesson).where(eq(lesson.pathId, pathId)).orderBy(asc(lesson.position), asc(lesson.createdAt));
  const done = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .innerJoin(lesson, eq(lessonProgress.lessonId, lesson.id))
    .where(and(eq(lessonProgress.userId, u.id), eq(lesson.pathId, pathId)));
  const completedLessonIds = done.map((d) => d.lessonId);
  return {
    path: toPath(p, academyName, lessons.length, completedLessonIds.length),
    academyId: p.academyId,
    academyName,
    academyPrice,
    lessons: lessons.map(toLesson),
    completedLessonIds,
    isOwner,
    locked,
  };
}

export async function getLesson(lessonId: string): Promise<LessonDetail | null> {
  const u = await requireUser();
  const l = await db.select().from(lesson).where(eq(lesson.id, lessonId)).limit(1).then((r) => r[0]);
  if (!l) return null;
  const p = await db.select().from(learningPath).where(eq(learningPath.id, l.pathId)).limit(1).then((r) => r[0]);
  const a = p ? await db.select().from(academy).where(eq(academy.id, p.academyId)).limit(1).then((r) => r[0]) : null;
  const academyPrice = a?.price ?? 0;
  const isOwner = l.userId === u.id;
  const locked = academyPrice > 0 && !isOwner && !(p ? await isEnrolled(u.id, p.academyId) : false);
  const siblings = await db.select({ id: lesson.id }).from(lesson).where(eq(lesson.pathId, l.pathId)).orderBy(asc(lesson.position), asc(lesson.createdAt));
  const idx = siblings.findIndex((s) => s.id === lessonId);
  const done = await db
    .select()
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, u.id), eq(lessonProgress.lessonId, lessonId)))
    .limit(1).then((r) => r[0]);
  return {
    lesson: toLesson(l),
    pathId: l.pathId,
    pathTitle: p?.title ?? "Path",
    academyId: p?.academyId ?? "",
    academyName: a?.name ?? "Academy",
    academyPrice,
    completed: !!done,
    isOwner,
    locked,
    prevId: idx > 0 ? siblings[idx - 1].id : null,
    nextId: idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1].id : null,
    index: idx + 1,
    total: siblings.length,
  };
}

export async function setLessonComplete(lessonId: string, done: boolean): Promise<void> {
  const u = await requireUser();
  if (done) {
    const existing = await db
      .select()
      .from(lessonProgress)
      .where(and(eq(lessonProgress.userId, u.id), eq(lessonProgress.lessonId, lessonId)))
      .limit(1).then((r) => r[0]);
    if (!existing) {
      await db.insert(lessonProgress).values({ id: genId("prog"), userId: u.id, lessonId, createdAt: new Date() });
    }
  } else {
    await db.delete(lessonProgress).where(and(eq(lessonProgress.userId, u.id), eq(lessonProgress.lessonId, lessonId)));
  }
}
