"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "./ui";
import { getHomePins, type HomePinView } from "@/lib/pin-actions";

/** Distinct "pinned" slot at the very top of the home feed (admin-curated). */
export function PinnedSlot() {
  const [pins, setPins] = useState<HomePinView[]>([]);
  useEffect(() => {
    getHomePins().then(setPins).catch(() => {});
  }, []);
  if (!pins.length) return null;

  return (
    <section className="rise" style={{ animationDelay: "30ms" }}>
      <div className="mb-3 flex items-center gap-2">
        <Icon name="star" size={14} className="text-review-gold" />
        <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">Pinned</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {pins.map((p) => (
          <Link
            key={p.id}
            href={p.href}
            className="group overflow-hidden rounded-3xl border border-review-gold/25 bg-review-gold/[0.06] p-5 transition-colors hover:bg-review-gold/[0.1]"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-review-gold/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-review-gold ring-1 ring-review-gold/25">
              <Icon name={p.itemType === "contest" ? "gift" : "star"} size={11} /> {p.badge}
            </span>
            <div className="mt-3 text-base font-semibold text-white">{p.title}</div>
            <p className="mt-1 line-clamp-2 text-sm leading-snug text-white/55">{p.subtitle}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-review-gold">
              {p.itemType === "contest" ? "Enter contest" : "View"}
              <Icon name="chevron" size={14} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
