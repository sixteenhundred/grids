"use client";

import Link from "next/link";
import { useSheet } from "./sheet";
import { ApplyJobSheet, QuickProfileSheet } from "./sheets";
import {
  Card,
  Surface,
  MediaTile,
  Avatar,
  Stars,
  StarRow,
  StatusPill,
  Tag,
  Progress,
  StageTracker,
  Button,
  Verified,
  Icon,
} from "./ui";
import {
  money,
  findCreative,
  STAGES,
  type Creative,
  type Job,
  type Project,
  type Post,
  type Review,
  type Package,
  type Course,
  type Product,
  type Role,
} from "@/lib/grid-data";

/* -------------------------------------------------------------------------- */
/*  Creative cards                                                             */
/* -------------------------------------------------------------------------- */

export function CreativeCard({ c }: { c: Creative }) {
  return (
    <Card hover className="overflow-hidden">
      <Link href={`/dashboard/creative/${c.id}`} className="block">
        <MediaTile tile={c.portfolio[0]} image={c.portfolioImages?.[0] ?? undefined} ratio="16 / 10" rounded="rounded-t-3xl">
          {c.available && (
            <span className="absolute left-3 top-3">
              <StatusPill tone="escrow" live>
                Available
              </StatusPill>
            </span>
          )}
        </MediaTile>
        <div className="flex items-center gap-3 p-4">
          <Avatar id={c.id} name={c.name} size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-semibold text-white">{c.name}</span>
              {c.verified && <Verified size={15} className="text-grid-blue" />}
            </div>
            <span className="block truncate text-sm text-white/55">
              {c.type} · {c.city}
            </span>
          </div>
          <div className="shrink-0 text-right">
            <Stars rating={c.rating} />
            <span className="mt-0.5 block text-xs font-medium text-white/70">{money(c.rate, "/ day")}</span>
          </div>
        </div>
      </Link>
    </Card>
  );
}

/** Compact card for horizontal rails (home featured). Opens a quick profile. */
export function FeaturedCreativeCard({ c }: { c: Creative }) {
  const { open } = useSheet();
  return (
    <button onClick={() => open(<QuickProfileSheet creative={c} />)} className="group block w-56 shrink-0 text-left">
      <Card hover className="h-full overflow-hidden">
        <MediaTile tile={c.portfolio[0]} image={c.portfolioImages?.[0] ?? undefined} ratio="4 / 3" rounded="rounded-t-3xl" />
        <div className="p-4">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-white">{c.name}</span>
            {c.verified && <Verified size={14} className="text-grid-blue" />}
          </div>
          <span className="mt-0.5 block text-sm text-white/55">{c.type}</span>
          <div className="mt-3 flex items-center justify-between">
            <Stars rating={c.rating} size={12} />
            <span className="text-xs font-medium text-white/70">{money(c.rate, "/ day")}</span>
          </div>
        </div>
      </Card>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Job cards                                                                  */
/* -------------------------------------------------------------------------- */

export function JobCard({ job }: { job: Job }) {
  const { open } = useSheet();
  return (
    <Card hover className="flex h-full flex-col overflow-hidden">
      <MediaTile tile={job.cover} ratio="16 / 9" rounded="rounded-t-3xl">
        <span className="absolute left-3 top-3">
          {job.urgent ? (
            <StatusPill tone="red" live>
              Urgent
            </StatusPill>
          ) : (
            <StatusPill tone="blue">{job.cat}</StatusPill>
          )}
        </span>
        <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2.5 py-1 font-mono text-sm font-semibold text-white backdrop-blur">
          {money(job.budget)}
          {job.budgetPer ? <span className="font-normal text-white/70"> {job.budgetPer}</span> : null}
        </span>
      </MediaTile>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-base font-semibold leading-snug tracking-tight text-white">{job.title}</h3>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-xs text-white/55">
          <span className="inline-flex items-center gap-1">
            <Icon name="building" size={13} /> {job.company}
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="pin" size={13} /> {job.loc}
          </span>
          {job.term !== "One-off" && job.term !== "Urgent" && <span>· {job.term}</span>}
        </p>
        <p className="mt-3 line-clamp-2 flex-1 text-sm leading-relaxed text-white/55">{job.desc}</p>
        <div className="mt-5 flex items-center justify-between">
          <span className="text-xs text-white/40">{job.posted}</span>
          <Button variant="ghost" arrow className="!py-2 !pl-4" onClick={() => open(<ApplyJobSheet job={job} />)}>
            Apply
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function JobRow({ job }: { job: Job }) {
  return (
    <Card hover className="flex items-center gap-4 p-4">
      <MediaTile tile={job.cover} className="h-14 w-14 shrink-0" rounded="rounded-xl" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {job.urgent && <StatusPill tone="red">Urgent</StatusPill>}
          {job.term !== "One-off" && job.term !== "Urgent" && <Tag>{job.term}</Tag>}
        </div>
        <h3 className="mt-1 truncate text-sm font-medium text-white">{job.title}</h3>
        <p className="truncate font-mono text-xs text-white/50">
          {job.company} · {job.loc}
        </p>
      </div>
      <span className="shrink-0 font-mono text-sm font-semibold text-white">{money(job.budget)}</span>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Project card                                                               */
/* -------------------------------------------------------------------------- */

export function ProjectCard({ p, role = "creator" }: { p: Project; role?: Role }) {
  const delivered = p.stage >= STAGES.length - 1;
  return (
    <Surface radius="1.75rem" inner="p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-white">{p.title}</h3>
          <p className="mt-1 text-sm text-white/55">
            {role === "client" ? "with" : "for"} {p.withName} · {money(p.budget)}
          </p>
        </div>
        <StatusPill tone={delivered ? "escrow" : "blue"} live={!delivered}>
          {delivered ? "Delivered" : STAGES[p.stage]}
        </StatusPill>
      </div>
      <StageTracker stages={STAGES} current={p.stage} />
      <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs text-white/50">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="clock" size={13} /> Due {p.due}
        </span>
        <Tag>{p.cat}</Tag>
      </div>
    </Surface>
  );
}

/* -------------------------------------------------------------------------- */
/*  Community post                                                             */
/* -------------------------------------------------------------------------- */

export function PostCard({ post }: { post: Post }) {
  const c = findCreative(post.by);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Avatar id={post.by} name={c?.name ?? "Creator"} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-white">{c?.name}</span>
            {c?.verified && <Verified size={13} className="text-grid-blue" />}
          </div>
          <span className="block truncate text-xs text-white/50">
            {c?.type} · {c?.city}
          </span>
        </div>
        <span className="shrink-0 text-xs text-white/40">{post.when}</span>
      </div>
      <MediaTile tile={post.image} ratio="3 / 2" rounded="rounded-none" />
      <div className="p-4">
        <p className="text-sm leading-relaxed text-white/75">
          <span className="font-medium text-white">{c?.name.split(" ")[0]}</span> {post.caption}
        </p>
        <div className="mt-3 flex items-center gap-5 text-white/50">
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Icon name="heart" size={16} /> {post.likes}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm">
            <Icon name="comment" size={16} /> {post.comments}
          </span>
        </div>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Reviews + packages                                                         */
/* -------------------------------------------------------------------------- */

export function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="flex h-full flex-col p-5">
      <StarRow n={review.rating} />
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-white/75">“{review.text}”</blockquote>
      <figcaption className="mt-4 border-t border-white/8 pt-3 text-sm font-medium text-white">{review.by}</figcaption>
    </Card>
  );
}

export function PackageRow({ pkg, onBook }: { pkg: Package; onBook?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="min-w-0">
        <div className="font-medium text-white">{pkg.name}</div>
        <div className="mt-0.5 text-sm text-white/55">{pkg.detail}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-semibold text-white">{money(pkg.price)}</div>
        {onBook && (
          <button onClick={onBook} className="mt-1 text-xs font-medium text-aerial-cyan transition-colors hover:text-white">
            Book →
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Course + product                                                           */
/* -------------------------------------------------------------------------- */

export function CourseCard({ course }: { course: Course }) {
  const pct = Math.round((course.done / course.lessons.length) * 100);
  return (
    <Card hover className="overflow-hidden">
      <MediaTile tile={course.cover} ratio="16 / 9" rounded="rounded-t-3xl">
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md ring-1 ring-white/20">
            <Icon name="play" size={20} />
          </span>
        </span>
      </MediaTile>
      <div className="p-5">
        <h3 className="font-semibold tracking-tight text-white">{course.title}</h3>
        <p className="mt-1 text-sm text-white/55">
          {course.by} · {course.duration}
        </p>
        <div className="mt-4">
          <Progress value={pct} tone="purple" />
          <div className="mt-2 flex items-center justify-between text-xs text-white/50">
            <span>
              {course.done} / {course.lessons.length} lessons
            </span>
            <span>{pct}%</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card hover className="overflow-hidden">
      <MediaTile tile={product.cover} ratio="4 / 3" rounded="rounded-t-3xl">
        <span className="absolute left-3 top-3">
          <StatusPill tone="purple">{product.type}</StatusPill>
        </span>
      </MediaTile>
      <div className="flex items-center justify-between gap-3 p-4">
        <h3 className="min-w-0 truncate text-sm font-medium text-white">{product.title}</h3>
        <span className="shrink-0 font-semibold text-white">{money(product.price)}</span>
      </div>
    </Card>
  );
}
