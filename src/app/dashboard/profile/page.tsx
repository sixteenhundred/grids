"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import { useRole } from "@/components/dashboard/role-context";
import {
  PageHeader,
  SectionHeader,
  Surface,
  Avatar,
  MetricCard,
  MediaTile,
  TrustBadge,
  Tag,
  Button,
  Verified,
  Icon,
} from "@/components/dashboard/ui";
import { PackageRow, ReviewCard } from "@/components/dashboard/cards";
import { CREATIVES, MY_COMPANY, CREATIVE_REVIEWS, METRICS, money } from "@/lib/grid-data";

export default function ProfilePage() {
  const { role } = useRole();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (role === "client") {
    const co = MY_COMPANY;
    const initial = co.name.charAt(0).toUpperCase();

    return (
      <div className="flex flex-col gap-10">
        <div className="rise">
          <PageHeader
            eyebrow="Company profile"
            title="Your company"
            subtitle="How creators see you on Grid. A strong, on-time reputation books the best talent faster."
            tone="green"
          />

          <Surface radius="2rem" inner="p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-semibold text-white/90 ring-1 ring-white/10"
                  style={{ background: "linear-gradient(135deg,#163326,#08120c)" }}
                >
                  {initial}
                </span>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight text-white">{co.name}</h2>
                  <p className="mt-1 text-sm text-white/55">{co.industry}</p>
                  {co.paysOnTime && (
                    <div className="mt-3">
                      <TrustBadge>Pays on time</TrustBadge>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:w-72">
                <MetricCard label="Rating" value={`${co.rating} ★`} tone="gold" />
                <MetricCard label="Jobs posted" value={String(co.jobs)} />
              </div>
            </div>
          </Surface>
        </div>

        <div className="rise" style={{ animationDelay: "60ms" }}>
          <SectionHeader title="Locations" />
          <div className="flex flex-wrap gap-2">
            {co.locations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/65"
              >
                <Icon name="pin" size={14} className="text-aerial-cyan" />
                {loc}
              </span>
            ))}
          </div>
        </div>

        <div className="rise grid grid-cols-2 gap-3 sm:gap-4 sm:max-w-md" style={{ animationDelay: "120ms" }}>
          <MetricCard label="In escrow" value={money(METRICS.inEscrow)} tone="escrow" sub="held, protected" />
          <MetricCard label="Total spent" value={money(METRICS.totalSpent)} />
        </div>

        <div className="rise" style={{ animationDelay: "180ms" }}>
          <SectionHeader title="Reviews from creators" />
          <div className="grid gap-4 md:grid-cols-2">
            {co.reviews.map((r, i) => (
              <ReviewCard key={i} review={r} />
            ))}
          </div>
        </div>

        <div className="rise flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
          <Button variant="ghost">Edit company profile</Button>
          <Button variant="ghost" onClick={handleSignOut}>
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  // creator — CREATIVES[0] is "you" (John Hope)
  const c = CREATIVES[0];
  const reviews = CREATIVE_REVIEWS.john ?? [];

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Your profile"
          title="How clients see you"
          subtitle="Your public Grid profile. Keep your portfolio, packages and reviews sharp to win more bookings."
          tone="cyan"
        />

        <Surface radius="2rem" inner="p-6 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Avatar id="john" name={c.name} size={72} />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xl font-semibold tracking-tight text-white">{c.name}</h2>
                  {c.verified && <Verified size={17} className="text-grid-blue" />}
                </div>
                <p className="mt-1 text-sm text-white/55">
                  {c.type} · {c.city}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TrustBadge>ID Verified</TrustBadge>
                  {c.topRated && <TrustBadge>Top Rated</TrustBadge>}
                  {c.available && <TrustBadge>Available Today</TrustBadge>}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-72">
              <MetricCard label="Day rate" value={money(c.rate)} tone="cyan" />
              <MetricCard label="Rating" value="4.9 ★" tone="gold" sub={`${c.reviews} reviews`} />
            </div>
          </div>
          <p className="mt-6 max-w-2xl text-pretty text-sm leading-relaxed text-white/65">{c.bio}</p>
        </Surface>
      </div>

      <div className="rise" style={{ animationDelay: "60ms" }}>
        <SectionHeader title="Portfolio" onClick={() => {}} cta="Manage" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {c.portfolio.map((t) => (
            <MediaTile key={t.title} tile={t} ratio="1 / 1" label={t.title} />
          ))}
        </div>
      </div>

      <div className="rise" style={{ animationDelay: "120ms" }}>
        <SectionHeader title="Media packages" />
        <div className="flex flex-col gap-3">
          {c.packages.map((p) => (
            <PackageRow key={p.name} pkg={p} />
          ))}
        </div>
      </div>

      <div className="rise" style={{ animationDelay: "180ms" }}>
        <SectionHeader title="Reviews from clients" />
        <div className="grid gap-4 md:grid-cols-2">
          {reviews.map((r, i) => (
            <ReviewCard key={i} review={r} />
          ))}
        </div>
      </div>

      <div className="rise flex flex-wrap items-center gap-3" style={{ animationDelay: "240ms" }}>
        <Button variant="ghost">Edit profile</Button>
        <Button variant="ghost" onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
