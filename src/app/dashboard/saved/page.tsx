"use client";

import { PageHeader, Card, Button, Icon } from "@/components/dashboard/ui";
import { CreativeCard } from "@/components/dashboard/cards";
import { SAVED_CREATIVE_IDS, findCreative, type Creative } from "@/lib/grid-data";

export default function SavedPage() {
  const saved = SAVED_CREATIVE_IDS.map(findCreative).filter(Boolean) as Creative[];

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Saved"
          tone="blue"
          title="Saved creatives"
          subtitle="Talent you’ve shortlisted."
        />

        {saved.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {saved.map((c) => (
              <CreativeCard key={c.id} c={c} />
            ))}
          </div>
        ) : (
          <Card className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-grid-blue/12 text-aerial-cyan ring-1 ring-grid-blue/25">
              <Icon name="heart" size={22} />
            </span>
            <div>
              <h3 className="text-base font-semibold text-white">No saved creatives yet</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-white/55">
                Shortlist talent as you browse the marketplace and they’ll show up here for quick access.
              </p>
            </div>
            <Button variant="ghost" arrow href="/dashboard/browse">
              Browse creatives
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
