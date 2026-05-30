"use client";

import { PageHeader, SectionHeader } from "@/components/dashboard/ui";
import { CourseCard } from "@/components/dashboard/cards";
import { COURSES } from "@/lib/grid-data";

export default function AcademyPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Grid Academy"
          tone="gold"
          title="Sharpen your craft."
          subtitle="Courses on lighting, drone movement, pricing and client work."
        />
      </div>

      <div className="rise" style={{ animationDelay: "60ms" }}>
        <SectionHeader title="Continue learning" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COURSES.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
