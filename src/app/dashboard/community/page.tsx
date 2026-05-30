"use client";

import { PageHeader } from "@/components/dashboard/ui";
import { PostCard } from "@/components/dashboard/cards";
import { POSTS } from "@/lib/grid-data";

export default function CommunityPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Community"
          tone="cyan"
          title="From the network."
          subtitle="Work and updates from creatives on Grid."
        />
      </div>

      <div className="rise grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ animationDelay: "60ms" }}>
        {POSTS.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </div>
  );
}
