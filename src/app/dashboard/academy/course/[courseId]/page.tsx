"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Surface, Card, Button, Icon, MediaTile, StatusPill, Progress } from "@/components/dashboard/ui";
import { AddLessonSheet, EnrollAcademySheet } from "@/components/dashboard/academy-ui";
import { useSheet } from "@/components/dashboard/sheet";
import type { LearningPath, Lesson, NewLesson } from "@/lib/academy";
import { getPath, createLesson, removeLesson, removePath } from "@/lib/academy-actions";

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { open } = useSheet();
  const [path, setPath] = useState<LearningPath | null>(null);
  const [academyId, setAcademyId] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [isOwner, setIsOwner] = useState(false);
  const [locked, setLocked] = useState(false);
  const [academyPrice, setAcademyPrice] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    getPath(courseId).then((d) => {
      if (!d) {
        setState("missing");
        return;
      }
      setPath(d.path);
      setAcademyId(d.academyId);
      setLessons(d.lessons);
      setCompleted(new Set(d.completedLessonIds));
      setIsOwner(d.isOwner);
      setLocked(d.locked);
      setAcademyPrice(d.academyPrice);
      setState("ready");
    });
  }, [courseId]);

  function openEnroll() {
    if (!path) return;
    open(<EnrollAcademySheet academyId={academyId} name={path.academyName} price={academyPrice} onEnrolled={() => setLocked(false)} />);
  }

  async function addLesson(input: NewLesson) {
    const saved = await createLesson(courseId, input);
    setLessons((prev) => [...prev, saved]);
  }
  async function deleteLesson(id: string) {
    await removeLesson(id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
  }
  async function deleteCourse() {
    await removePath(courseId);
    router.push("/dashboard/academy");
  }

  if (state === "missing") {
    return (
      <div className="rise flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">Course not found</h1>
          <div className="mt-6">
            <Button href="/dashboard/academy/browse" arrow>
              Browse academies
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (state === "loading" || !path) {
    return (
      <Surface radius="2rem" inner="p-10">
        <p className="text-center text-sm text-white/45">Loading course…</p>
      </Surface>
    );
  }

  const pct = lessons.length ? Math.round((completed.size / lessons.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-8">
      {/* Course header */}
      <div className="rise">
        <Link href={`/dashboard/academy/${academyId}`} className="mb-4 inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white">
          <Icon name="chevron" size={14} className="rotate-180" /> {path.academyName}
        </Link>
        <Surface radius="2rem" inner="p-0">
          <MediaTile tile={path.coverTile} image={path.coverImage} ratio="4 / 1" rounded="rounded-t-[2rem]">
            <span className="absolute left-4 top-4">
              <StatusPill tone="gold">{path.level}</StatusPill>
            </span>
          </MediaTile>
          <div className="p-6">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">{path.title}</h1>
            {path.description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">{path.description}</p>}
            <div className="mt-5 max-w-md">
              <Progress value={pct} tone="gold" />
              <div className="mt-2 flex items-center justify-between text-xs text-white/50">
                <span>{completed.size} / {lessons.length} lessons complete</span>
                <span>{pct}%</span>
              </div>
            </div>
          </div>
        </Surface>
      </div>

      {/* Lessons */}
      <div className="rise" style={{ animationDelay: "80ms" }}>
        {locked ? (
          <Surface radius="2rem" inner="p-8">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-review-gold/12 text-review-gold ring-1 ring-review-gold/25">
                <Icon name="lock" size={22} />
              </span>
              <h3 className="mt-4 font-semibold text-white">This course is part of {path.academyName}</h3>
              <p className="mt-1 max-w-sm text-sm text-white/55">Enroll once to unlock all {lessons.length} lessons and every other course.</p>
              <div className="mt-5">
                <Button tone="gold" arrow onClick={openEnroll}>
                  Enroll · €{academyPrice}
                </Button>
              </div>
            </div>
          </Surface>
        ) : (
          <>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-white">Lessons</h2>
          {isOwner && (
            <Button tone="gold" arrow onClick={() => open(<AddLessonSheet onAdd={addLesson} />)}>
              Add lesson
            </Button>
          )}
        </div>

        {lessons.length === 0 ? (
          <Surface radius="2rem" inner="p-10">
            <p className="text-center text-sm text-white/55">{isOwner ? "No lessons yet — add your first one." : "No lessons published yet."}</p>
          </Surface>
        ) : (
          <div className="flex flex-col gap-3">
            {lessons.map((l, i) => {
              const done = completed.has(l.id);
              return (
                <Card key={l.id} className="p-0">
                  <div className="flex items-center gap-3 p-4">
                    <Link href={`/dashboard/academy/lesson/${l.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ring-1 ${done ? "bg-escrow-green/15 text-escrow-green ring-escrow-green/30" : "bg-review-gold/12 text-review-gold ring-review-gold/25"}`}>
                        {done ? <Icon name="check" size={15} /> : i + 1}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-white">{l.title}</span>
                        {l.duration && <span className="block text-xs text-white/45">{l.duration}</span>}
                      </span>
                    </Link>
                    {isOwner ? (
                      <button
                        type="button"
                        onClick={() => deleteLesson(l.id)}
                        aria-label="Delete lesson"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/40 transition-colors hover:bg-urgent-red/10 hover:text-urgent-red"
                      >
                        <Icon name="x" size={15} />
                      </button>
                    ) : (
                      <Icon name="chevron" size={16} className="shrink-0 text-white/30" />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {isOwner && (
          <div className="mt-6">
            <button onClick={deleteCourse} className="text-sm text-white/40 transition-colors hover:text-urgent-red">
              Delete this course
            </button>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
