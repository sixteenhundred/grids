"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Surface, Card, Button, Icon } from "@/components/dashboard/ui";
import { EnrollAcademySheet } from "@/components/dashboard/academy-ui";
import { useSheet } from "@/components/dashboard/sheet";
import type { LessonDetail } from "@/lib/academy";
import { getLesson, setLessonComplete } from "@/lib/academy-actions";

export default function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const router = useRouter();
  const { open } = useSheet();
  const [data, setData] = useState<LessonDetail | null>(null);
  const [completed, setCompleted] = useState(false);
  const [locked, setLocked] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    getLesson(lessonId).then((d) => {
      if (!d) {
        setState("missing");
        return;
      }
      setData(d);
      setCompleted(d.completed);
      setLocked(d.locked);
      setState("ready");
    });
  }, [lessonId]);

  async function toggleComplete() {
    if (!data) return;
    const next = !completed;
    setCompleted(next);
    await setLessonComplete(data.lesson.id, next);
  }

  if (state === "missing") {
    return (
      <div className="rise flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">Lesson not found</h1>
          <div className="mt-6">
            <Button href="/dashboard/academy/browse" arrow>
              Browse academies
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (state === "loading" || !data) {
    return (
      <Surface radius="2rem" inner="p-10">
        <p className="text-center text-sm text-white/45">Loading lesson…</p>
      </Surface>
    );
  }

  const { lesson, pathId, pathTitle, academyId, academyName, academyPrice, index, total, prevId, nextId } = data;
  const paras = lesson.content.split("\n").filter((p) => p.trim().length > 0);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      {/* Breadcrumb */}
      <div className="rise">
        <Link href={`/dashboard/academy/course/${pathId}`} className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white">
          <Icon name="chevron" size={14} className="rotate-180" /> {pathTitle}
        </Link>
      </div>

      {locked ? (
        <div className="rise" style={{ animationDelay: "60ms" }}>
          <Surface radius="2rem" inner="p-8">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-review-gold/12 text-review-gold ring-1 ring-review-gold/25">
                <Icon name="lock" size={22} />
              </span>
              <h3 className="mt-4 font-semibold text-white">Enroll to watch this lesson</h3>
              <p className="mt-1 max-w-sm text-sm text-white/55">This lesson is part of {academyName}. Enroll once to unlock it and every other course.</p>
              <div className="mt-5">
                <Button
                  tone="gold"
                  arrow
                  onClick={() => open(<EnrollAcademySheet academyId={academyId} name={academyName} price={academyPrice} onEnrolled={() => setLocked(false)} />)}
                >
                  Enroll · €{academyPrice}
                </Button>
              </div>
            </div>
          </Surface>
        </div>
      ) : (
      <>
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <Surface radius="2rem" inner="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-review-gold">
            <span>Lesson {index} of {total}</span>
            {lesson.duration && <span className="text-white/35">· {lesson.duration}</span>}
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">{lesson.title}</h1>

          {/* Video placeholder */}
          <div className="mt-6 flex aspect-video items-center justify-center rounded-2xl border border-white/10 bg-[radial-gradient(120%_120%_at_50%_0%,#1a1622_0%,#0a0a10_70%)]">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/12 text-white ring-1 ring-white/20 backdrop-blur-md">
              <Icon name="play" size={22} />
            </span>
          </div>

          {/* Body */}
          <div className="mt-6 flex flex-col gap-4">
            {paras.length > 0 ? (
              paras.map((p, i) => (
                <p key={i} className="text-[15px] leading-relaxed text-white/75">
                  {p}
                </p>
              ))
            ) : (
              <p className="text-sm text-white/45">No notes for this lesson yet.</p>
            )}
          </div>

          <div className="mt-8">
            <Button full tone={completed ? "green" : "gold"} onClick={toggleComplete}>
              <Icon name="check" size={15} /> {completed ? "Completed — mark as not done" : "Mark lesson complete"}
            </Button>
          </div>
        </Surface>
      </div>

      {/* Prev / next */}
      <div className="rise flex items-center justify-between gap-3" style={{ animationDelay: "120ms" }}>
        {prevId ? (
          <Button variant="ghost" onClick={() => router.push(`/dashboard/academy/lesson/${prevId}`)}>
            <Icon name="chevron" size={15} className="rotate-180" /> Previous
          </Button>
        ) : (
          <span />
        )}
        {nextId ? (
          <Button tone="gold" arrow onClick={() => router.push(`/dashboard/academy/lesson/${nextId}`)}>
            Next lesson
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => router.push(`/dashboard/academy/course/${pathId}`)}>
            Back to course
          </Button>
        )}
      </div>
      </>
      )}
    </div>
  );
}
