"use client";

import Link from "next/link";
import { Card, PageHeader, Icon } from "@/components/dashboard/ui";
import { NEWS } from "@/lib/grid-data";

export default function NewsPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="News"
          tone="blue"
          title="What’s new on Grid."
          subtitle="Product updates and announcements."
        />

        <div className="flex flex-col gap-3">
          {NEWS.map((item) => (
            <Link key={item.id} href={`/dashboard/news/${item.id}`} className="block">
              <Card hover className="flex items-center gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-grid-blue/12 text-aerial-cyan ring-1 ring-grid-blue/25">
                  <Icon name="news" size={21} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-aerial-cyan">{item.category}</span>
                    <span className="text-xs text-white/35">· {item.when}</span>
                  </div>
                  <div className="mt-0.5 font-medium text-white">{item.title}</div>
                  <p className="mt-1 line-clamp-1 text-sm text-white/50">{item.excerpt}</p>
                </div>
                <Icon name="chevron" size={18} className="shrink-0 text-white/30" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
