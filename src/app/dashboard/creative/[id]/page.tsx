"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Surface,
  Card,
  SectionHeader,
  MetricCard,
  TrustBadge,
  Stars,
  Avatar,
  MediaTile,
  Button,
  Verified,
  Icon,
} from "@/components/dashboard/ui";
import { ReviewCard, PackageRow } from "@/components/dashboard/cards";
import { useSheet } from "@/components/dashboard/sheet";
import { useRole } from "@/components/dashboard/role-context";
import { BookingFlow, MessageSheet } from "@/components/dashboard/sheets";
import { money, type Creative, type Review } from "@/lib/grid-data";
import { getCreator, getCreatorReviews } from "@/lib/profile-actions";

export default function CreativeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { open } = useSheet();
  const { role } = useRole();
  const [c, setC] = useState<Creative | null | undefined>(undefined);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!id) return;
    getCreator(id).then(setC).catch(() => setC(null));
    getCreatorReviews(id).then(setReviews).catch(() => setReviews([]));
  }, [id]);

  if (c === undefined) {
    return (
      <div className="rise flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-white/45">Loading profile…</p>
      </div>
    );
  }

  if (!c) {
    return (
      <div className="rise flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">Creative not found</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            We couldn’t find that profile. It may have been removed or the link is incorrect.
          </p>
          <div className="mt-6 flex justify-center">
            <Button href="/dashboard/browse" arrow>
              Back to browse
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const firstName = c.name.split(" ")[0];
  const hasPackages = c.packages.length > 0;
  const book = (pkgIndex = 0) =>
    open(<BookingFlow creative={c} pkg={c.packages[pkgIndex]} />);
  const message = () =>
    open(<MessageSheet name={c.name} avatarId={c.id} subtitle={`${c.type} · ${c.city} · ${money(c.rate)}/day`} />);
  const isClient = role === "client";

  return (
    <div className="flex flex-col gap-10">
      {/* Hero — banner + identity */}
      <section className="rise">
        <Surface radius="2rem" inner="overflow-hidden">
          <MediaTile
            tile={c.portfolio[0]}
            image={c.portfolioImages?.[0] ?? undefined}
            ratio="16 / 9"
            rounded="rounded-[calc(2rem-0.375rem)] rounded-b-none"
            label={c.portfolio[0].title}
          />
          <div className="flex flex-col gap-6 p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <Avatar id={c.id} name={c.name} size={60} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white sm:text-3xl">
                      {c.name}
                    </h1>
                    {c.verified && <Verified size={20} className="text-grid-blue" />}
                  </div>
                  <p className="mt-1 text-sm text-white/55">
                    {c.type} · {c.city}
                  </p>
                  <div className="mt-2.5 flex items-center gap-2">
                    <Stars rating={c.rating} />
                    <span className="text-sm text-white/45">({c.reviews} reviews)</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:w-64">
                <MetricCard label="Day rate" value={money(c.rate)} tone="cyan" />
                <MetricCard label="Rating" value={`${c.rating} ★`} tone="gold" />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {c.verified && <TrustBadge>ID Verified</TrustBadge>}
              {c.topRated && <TrustBadge>Top Rated</TrustBadge>}
              {c.licensed && <TrustBadge>Licensed Drone Pilot</TrustBadge>}
              {c.available && <TrustBadge>Available Today</TrustBadge>}
              <TrustBadge>Escrow Protected</TrustBadge>
            </div>

            <p className="max-w-2xl text-pretty text-sm leading-relaxed text-white/65 sm:text-base">
              {c.bio}
            </p>

            <div className="flex flex-wrap gap-2.5">
              {isClient && hasPackages && (
                <Button tone="green" arrow onClick={() => book(0)}>
                  Book {firstName}
                </Button>
              )}
              <Button tone={isClient ? "white" : "blue"} variant={isClient ? "ghost" : "solid"} arrow onClick={message}>
                <Icon name="comment" size={15} /> Message {firstName}
              </Button>
            </div>
          </div>
        </Surface>
      </section>

      {/* Portfolio */}
      <section className="rise" style={{ animationDelay: "60ms" }}>
        <SectionHeader title="Portfolio" />
        {c.portfolioImages && c.portfolioImages.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {c.portfolio.map((t, i) => (
              <MediaTile key={`${t.title}-${i}`} tile={t} image={c.portfolioImages?.[i] ?? undefined} ratio="1 / 1" label={t.title} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-white/55">
            No portfolio work shared yet.
          </div>
        )}
      </section>

      {/* Packages */}
      {hasPackages && (
        <section className="rise" style={{ animationDelay: "120ms" }}>
          <SectionHeader title="Packages" />
          <div className="flex flex-col gap-3">
            {c.packages.map((p, i) => (
              <PackageRow key={p.name} pkg={p} onBook={isClient ? () => book(i) : undefined} />
            ))}
          </div>
        </section>
      )}

      {/* Reviews */}
      {reviews && reviews.length > 0 && (
        <section className="rise" style={{ animationDelay: "180ms" }}>
          <SectionHeader title="Reviews from clients" />
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.map((r, i) => (
              <ReviewCard key={`${r.by}-${i}`} review={r} />
            ))}
          </div>
        </section>
      )}

      {/* Prominent closing CTA */}
      <section className="rise" style={{ animationDelay: "240ms" }}>
        <Surface radius="2rem" inner="p-6 sm:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <Avatar id={c.id} name={c.name} size={48} />
              <div>
                <h3 className="font-semibold text-white">Work with {firstName}</h3>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/55">
                  {isClient
                    ? `Funds are held by Grid Escrow the moment you sign and released only after you approve the delivery. ${money(c.rate)} day rate · ${c.city}.`
                    : `Reach out to talk through a collaboration or custom brief. ${money(c.rate)} day rate · ${c.city}.`}
                </p>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-col gap-2.5 sm:w-auto">
              {isClient && hasPackages && (
                <Button tone="green" arrow full onClick={() => book(0)}>
                  Book {firstName}
                </Button>
              )}
              <Button tone={isClient ? "white" : "blue"} variant={isClient ? "ghost" : "solid"} arrow full onClick={message}>
                Message {firstName}
              </Button>
            </div>
          </div>
        </Surface>
      </section>
    </div>
  );
}
