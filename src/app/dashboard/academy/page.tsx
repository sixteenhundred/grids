"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Surface, Button, Icon } from "@/components/dashboard/ui";
import { StorefrontHeader } from "@/components/dashboard/storefront";
import { CourseTile, AddCourseSheet } from "@/components/dashboard/academy-ui";
import { useSheet } from "@/components/dashboard/sheet";
import { DEFAULT_ACADEMY, type AcademyConfig, type LearningPath, type NewPath } from "@/lib/academy";
import { getMyAcademy, createPath } from "@/lib/academy-actions";

export default function MyAcademyPage() {
  const router = useRouter();
  const { open } = useSheet();
  const [config, setConfig] = useState<AcademyConfig>(DEFAULT_ACADEMY);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyAcademy().then(({ config, paths }) => {
      setConfig(config);
      setPaths(paths);
      setLoading(false);
    });
  }, []);

  async function addCourse(input: NewPath) {
    const saved = await createPath(input);
    setPaths((prev) => [...prev, saved]);
  }
  const openCourse = (p: LearningPath) => router.push(`/dashboard/academy/course/${p.id}`);

  const addBtn = (
    <Button tone="gold" arrow onClick={() => open(<AddCourseSheet onAdd={addCourse} />)}>
      Add course
    </Button>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <StorefrontHeader
          config={config}
          actions={
            <>
              <Button variant="ghost" href="/dashboard/academy/browse">
                <Icon name="school" size={15} /> Browse academies
              </Button>
              <Button variant="ghost" href="/dashboard/academy/customize">
                <Icon name="layout" size={15} /> Customize
              </Button>
            </>
          }
        />
      </div>

      <div className="rise" style={{ animationDelay: "80ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Courses <span className="ml-1 text-sm font-normal text-white/40">{paths.length}</span>
          </h2>
          {paths.length > 0 && addBtn}
        </div>

        {loading ? (
          <Surface radius="2rem" inner="p-10">
            <p className="text-center text-sm text-white/45">Loading your academy…</p>
          </Surface>
        ) : paths.length === 0 ? (
          <Surface radius="2rem" inner="p-10">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-review-gold/12 text-review-gold ring-1 ring-review-gold/25">
                <Icon name="school" size={22} />
              </span>
              <p className="mt-4 text-sm text-white/55">No courses yet. Create your first one.</p>
              <div className="mt-5">{addBtn}</div>
            </div>
          </Surface>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paths.map((p) => (
              <CourseTile key={p.id} path={p} onOpen={() => openCourse(p)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
