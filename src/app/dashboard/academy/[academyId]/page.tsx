"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Surface, Card, Button, Icon, StatusPill } from "@/components/dashboard/ui";
import { StorefrontHeader } from "@/components/dashboard/storefront";
import { CourseTile, EnrollAcademySheet, PriceTag } from "@/components/dashboard/academy-ui";
import { useSheet } from "@/components/dashboard/sheet";
import type { AcademyConfig, LearningPath } from "@/lib/academy";
import { getAcademyById } from "@/lib/academy-actions";

export default function AcademyStorefrontPage() {
  const { academyId } = useParams<{ academyId: string }>();
  const router = useRouter();
  const { open } = useSheet();
  const [config, setConfig] = useState<AcademyConfig | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [locked, setLocked] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    getAcademyById(academyId).then((a) => {
      if (!a) {
        setState("missing");
        return;
      }
      setConfig(a.config);
      setPaths(a.paths);
      setLocked(a.locked);
      setIsOwner(a.isOwner);
      setEnrolled(a.enrolled);
      setState("ready");
    });
  }, [academyId]);

  function openEnroll() {
    if (!config) return;
    open(
      <EnrollAcademySheet
        academyId={academyId}
        name={config.name}
        price={config.price}
        onEnrolled={() => {
          setLocked(false);
          setEnrolled(true);
        }}
      />,
    );
  }

  function openCourse(p: LearningPath) {
    if (locked) openEnroll();
    else router.push(`/dashboard/academy/course/${p.id}`);
  }

  if (state === "missing") {
    return (
      <div className="rise flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">Academy not found</h1>
          <div className="mt-6">
            <Button href="/dashboard/academy/browse" arrow>
              Browse academies
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (state === "loading" || !config) {
    return (
      <Surface radius="2rem" inner="p-10">
        <p className="text-center text-sm text-white/45">Loading academy…</p>
      </Surface>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <StorefrontHeader
          config={config}
          actions={
            <>
              {enrolled && !isOwner ? <StatusPill tone="escrow">Enrolled</StatusPill> : <PriceTag price={config.price} />}
              {locked ? (
                <Button tone="gold" arrow onClick={openEnroll}>
                  Enroll
                </Button>
              ) : (
                <Button variant="ghost" href="/dashboard/academy/browse">
                  <Icon name="school" size={15} /> All academies
                </Button>
              )}
            </>
          }
        />
      </div>

      {/* Locked notice */}
      {locked && (
        <div className="rise" style={{ animationDelay: "60ms" }}>
          <Surface radius="2rem" inner="p-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-review-gold/12 text-review-gold ring-1 ring-review-gold/25">
                  <Icon name="lock" size={20} />
                </span>
                <div>
                  <h3 className="font-semibold text-white">Enroll to start learning</h3>
                  <p className="mt-1 max-w-xl text-sm text-white/55">Preview the courses below. Enroll once to unlock every lesson in {config.name}.</p>
                </div>
              </div>
              <Button tone="gold" arrow onClick={openEnroll} className="shrink-0">
                Enroll
              </Button>
            </div>
          </Surface>
        </div>
      )}

      <div className="rise" style={{ animationDelay: "80ms" }}>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">
          Courses <span className="ml-1 text-sm font-normal text-white/40">{paths.length}</span>
        </h2>
        {paths.length === 0 ? (
          <Surface radius="2rem" inner="p-10">
            <p className="text-center text-sm text-white/55">This academy hasn’t published any courses yet.</p>
          </Surface>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((p) => (
              <CourseTile key={p.id} path={p} locked={locked} onOpen={() => openCourse(p)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
