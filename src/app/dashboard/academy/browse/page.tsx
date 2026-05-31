"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Surface, Card, Button, Icon, StatusPill } from "@/components/dashboard/ui";
import { ShopLogo } from "@/components/dashboard/storefront";
import { PriceTag } from "@/components/dashboard/academy-ui";
import type { AcademySummary } from "@/lib/academy";
import { listAcademies, listMyEnrollments } from "@/lib/academy-actions";

export default function BrowseAcademiesPage() {
  const [academies, setAcademies] = useState<AcademySummary[]>([]);
  const [enrolled, setEnrolled] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listAcademies(), listMyEnrollments()]).then(([a, mine]) => {
      setAcademies(a);
      setEnrolled(new Set(mine));
      setLoading(false);
    });
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <div className="rise flex items-end justify-between gap-4">
        <PageHeader eyebrow="Grid Academy" tone="gold" title="Browse academies." subtitle="Learn from working photographers, filmmakers and drone pilots." />
        <Button variant="ghost" href="/dashboard/academy">
          <Icon name="school" size={15} /> My academy
        </Button>
      </div>

      <div className="rise" style={{ animationDelay: "60ms" }}>
        {loading ? (
          <Surface radius="2rem" inner="p-10">
            <p className="text-center text-sm text-white/45">Loading academies…</p>
          </Surface>
        ) : academies.length === 0 ? (
          <Surface radius="2rem" inner="p-10">
            <p className="text-center text-sm text-white/55">No academies yet.</p>
          </Surface>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {academies.map((a) => (
              <Link key={a.id} href={`/dashboard/academy/${a.id}`} className="block">
                <Card hover className="h-full overflow-hidden">
                  <div className="flex items-center gap-4 p-5">
                    <ShopLogo config={{ name: a.name, description: a.description, logo: a.logo, banner: a.banner }} size={56} />
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold tracking-tight text-white">{a.name}</h3>
                      <p className="text-xs text-review-gold">{a.pathCount} {a.pathCount === 1 ? "course" : "courses"}</p>
                    </div>
                    {enrolled.has(a.id) ? <StatusPill tone="escrow">Enrolled</StatusPill> : <PriceTag price={a.price} />}
                  </div>
                  {a.description && <p className="line-clamp-2 px-5 pb-5 text-sm text-white/55">{a.description}</p>}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
