"use client";

import { PageHeader, Card, StatusPill, Icon } from "@/components/dashboard/ui";
import { TRENDS } from "@/lib/grid-data";

export default function TrendsPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Trends"
          tone="gold"
          title="Rising this month."
          subtitle="What clients are booking and creatives are shooting."
        />
      </div>

      <div className="rise flex flex-col gap-3" style={{ animationDelay: "60ms" }}>
        {TRENDS.map((t, i) => (
          <Card key={t.title} className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-mono text-white/40">{String(i + 1).padStart(2, "0")}</span>
              <span className="font-medium text-white">{t.title}</span>
              <Icon name="trending" size={16} className="text-escrow-green" />
            </div>
            <StatusPill tone="escrow">{t.change}</StatusPill>
          </Card>
        ))}
      </div>
    </div>
  );
}
