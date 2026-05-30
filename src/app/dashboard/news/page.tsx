"use client";

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
            <Card key={item.title} hover className="p-5 flex items-center gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-grid-blue/12 text-aerial-cyan ring-1 ring-grid-blue/25">
                <Icon name="news" size={21} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-white">{item.title}</div>
                <div className="text-xs text-white/45">{item.when}</div>
              </div>
              <Icon name="chevron" size={18} className="shrink-0 text-white/30" />
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
