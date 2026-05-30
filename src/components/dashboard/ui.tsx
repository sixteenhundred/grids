import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Accent, Tile } from "@/lib/grid-data";
import { Icon, type IconName, Star, ArrowUpRight, Verified, Shield } from "./icons";

/* -------------------------------------------------------------------------- */
/*  Accent system — one source of truth for the brand color families.         */
/* -------------------------------------------------------------------------- */

type AccentClasses = {
  text: string;
  solid: string;
  tint: string;
  ring: string;
  dot: string;
  border: string;
};

export const ACCENT: Record<Accent, AccentClasses> = {
  blue: { text: "text-aerial-cyan", solid: "bg-grid-blue text-white", tint: "bg-grid-blue/12", ring: "ring-grid-blue/25", dot: "bg-grid-blue", border: "border-grid-blue/30" },
  green: { text: "text-escrow-green", solid: "bg-client-green text-white", tint: "bg-client-green/12", ring: "ring-client-green/25", dot: "bg-client-green", border: "border-client-green/30" },
  escrow: { text: "text-escrow-green", solid: "bg-escrow-green text-[#06140c]", tint: "bg-escrow-green/12", ring: "ring-escrow-green/25", dot: "bg-escrow-green", border: "border-escrow-green/30" },
  gold: { text: "text-review-gold", solid: "bg-review-gold text-[#1a1206]", tint: "bg-review-gold/12", ring: "ring-review-gold/25", dot: "bg-review-gold", border: "border-review-gold/30" },
  red: { text: "text-urgent-red", solid: "bg-urgent-red text-white", tint: "bg-urgent-red/12", ring: "ring-urgent-red/25", dot: "bg-urgent-red", border: "border-urgent-red/30" },
  purple: { text: "text-ai-purple", solid: "bg-ai-purple text-white", tint: "bg-ai-purple/12", ring: "ring-ai-purple/25", dot: "bg-ai-purple", border: "border-ai-purple/30" },
  cyan: { text: "text-aerial-cyan", solid: "bg-aerial-cyan text-[#06121f]", tint: "bg-aerial-cyan/12", ring: "ring-aerial-cyan/25", dot: "bg-aerial-cyan", border: "border-aerial-cyan/30" },
};

/* -------------------------------------------------------------------------- */
/*  Surface — the landing's signature double-border card.                      */
/*  Outer rim (p-1.5 border) + inner radial-gradient panel + inset highlight.  */
/* -------------------------------------------------------------------------- */

export function Surface({
  children,
  className = "",
  radius = "2rem",
  inner = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  radius?: string;
  inner?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`group relative border border-white/10 bg-white/[0.03] p-1.5 ${
        hover ? "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:bg-white/[0.05]" : ""
      } ${className}`}
      style={{ borderRadius: radius }}
    >
      <div
        className={`flex h-full flex-col bg-[radial-gradient(130%_130%_at_0%_0%,#141519_0%,#0a0b0d_70%)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] ${inner}`}
        style={{ borderRadius: `calc(${radius} - 0.375rem)` }}
      >
        {children}
      </div>
    </div>
  );
}

/** Flat single-border card — lighter weight than Surface. */
export function Card({
  children,
  className = "",
  hover = false,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "li" | "article";
}) {
  return (
    <As
      className={`rounded-3xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] ${
        hover ? "transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.055]" : ""
      } ${className}`}
    >
      {children}
    </As>
  );
}

/* -------------------------------------------------------------------------- */
/*  Headings                                                                   */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  tone = "blue",
  action,
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  tone?: Accent;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
        <h1 className={`text-balance text-3xl font-semibold tracking-[-0.03em] text-white sm:text-4xl ${eyebrow ? "mt-4" : ""}`}>
          {title}
        </h1>
        {subtitle && <p className="mt-3 max-w-2xl text-pretty text-sm leading-relaxed text-white/55 sm:text-base">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function SectionHeader({
  title,
  href,
  cta = "See all",
  onClick,
}: {
  title: string;
  href?: string;
  cta?: string;
  onClick?: () => void;
}) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
      {href ? (
        <Link href={href} className="text-sm text-aerial-cyan transition-colors hover:text-white">
          {cta}
        </Link>
      ) : onClick ? (
        <button onClick={onClick} className="text-sm text-aerial-cyan transition-colors hover:text-white">
          {cta}
        </button>
      ) : null}
    </div>
  );
}

export function Eyebrow({ children, tone = "blue" }: { children: ReactNode; tone?: Accent }) {
  const a = ACCENT[tone];
  return (
    <span className={`inline-flex items-center rounded-full bg-white/[0.04] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] ring-1 ${a.text} ${a.ring}`}>
      {children}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Metrics                                                                    */
/* -------------------------------------------------------------------------- */

export function MetricCard({ label, value, tone, sub }: { label: string; value: string; tone?: Accent; sub?: string }) {
  return (
    <Card className="p-5">
      <span className="text-xs uppercase tracking-[0.14em] text-white/45">{label}</span>
      <div className={`mt-2 text-2xl font-semibold tracking-tight ${tone ? ACCENT[tone].text : "text-white"}`}>{value}</div>
      {sub && <span className="mt-1 text-xs text-white/45">{sub}</span>}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pills, badges, chips                                                       */
/* -------------------------------------------------------------------------- */

export function StatusPill({ children, tone = "blue", live = false }: { children: ReactNode; tone?: Accent; live?: boolean }) {
  const a = ACCENT[tone];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ring-1 ${a.text} ${a.tint} ${a.ring}`}>
      {live && (
        <span className="relative flex h-1.5 w-1.5">
          <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${a.dot} opacity-70`} />
          <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${a.dot}`} />
        </span>
      )}
      {children}
    </span>
  );
}

export function TrustBadge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/65">
      <Shield size={12} className="text-escrow-green" />
      {children}
    </span>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/55">{children}</span>;
}

/* -------------------------------------------------------------------------- */
/*  Stars                                                                      */
/* -------------------------------------------------------------------------- */

export function Stars({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-review-gold">
      <Star size={size} />
      <span className="text-sm font-medium text-white">{rating.toFixed(1)}</span>
    </span>
  );
}

export function StarRow({ n = 5, size = 13 }: { n?: number; size?: number }) {
  return (
    <span className="inline-flex gap-0.5 text-review-gold">
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} size={size} />
      ))}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Avatar — gradient + initials                                               */
/* -------------------------------------------------------------------------- */

const AV_GRADIENTS: Record<string, string> = {
  john: "linear-gradient(135deg,#1b2a4a,#0a0c12)",
  maya: "linear-gradient(135deg,#3a2a4a,#0d0a12)",
  theo: "linear-gradient(135deg,#163a3a,#08100f)",
  sara: "linear-gradient(135deg,#4a2a2a,#100808)",
  leo: "linear-gradient(135deg,#2a2a4a,#0a0a12)",
  nadia: "linear-gradient(135deg,#3a3320,#0f0d08)",
};

export function Avatar({ id, name, size = 44 }: { id?: string; name: string; size?: number }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white/90 ring-1 ring-white/10"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: (id && AV_GRADIENTS[id]) || "linear-gradient(135deg,#2a2a33,#101015)",
      }}
    >
      {initials}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Media tile (gradient stand-in for real photo/video)                        */
/* -------------------------------------------------------------------------- */

export function MediaTile({
  tile,
  className = "",
  label,
  meta,
  rounded = "rounded-2xl",
  ratio,
  children,
}: {
  tile: Tile;
  className?: string;
  label?: string;
  meta?: ReactNode;
  rounded?: string;
  ratio?: string;
  children?: ReactNode;
}) {
  const style: CSSProperties = {
    backgroundImage: `linear-gradient(150deg, ${tile.from}, ${tile.to})`,
    aspectRatio: ratio,
  };
  return (
    <div className={`relative overflow-hidden ${rounded} ${className}`} style={style}>
      {/* viewfinder bracket — matches landing ImagePlaceholder cue */}
      <span className="pointer-events-none absolute left-3 top-3 h-3.5 w-3.5 border-l border-t border-white/25" />
      <span className="pointer-events-none absolute bottom-3 right-3 h-3.5 w-3.5 border-b border-r border-white/25" />
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
      {(label || meta) && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          {label && <span className="text-xs font-semibold text-white drop-shadow">{label}</span>}
          {meta && <span className="font-mono text-[11px] text-white/70">{meta}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Stage tracker — Planning → Shoot → Edit → Fixes → Delivery                 */
/* -------------------------------------------------------------------------- */

export function StageTracker({ stages, current }: { stages: readonly string[]; current: number }) {
  return (
    <div className="mt-4">
      <div className="flex items-center">
        {stages.map((s, i) => {
          const done = i < current;
          const active = i === current;
          return (
            <div key={s} className="flex flex-1 items-center last:flex-none">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-medium ${
                  done
                    ? "bg-escrow-green text-[#06140c]"
                    : active
                      ? "bg-[#0a0c0e] text-escrow-green ring-1 ring-escrow-green/50"
                      : "bg-[#0a0c0e] text-white/45 ring-1 ring-white/12"
                }`}
              >
                {done ? <Icon name="check" size={12} /> : i + 1}
              </span>
              {i < stages.length - 1 && <span className={`mx-1.5 h-px flex-1 ${done ? "bg-escrow-green/70" : "bg-white/12"}`} />}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between">
        {stages.map((s, i) => (
          <span key={s} className={`text-[10px] ${i === current ? "text-escrow-green" : i < current ? "text-white/55" : "text-white/35"}`}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Progress({ value, tone = "blue" }: { value: number; tone?: Accent }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
      <div className={`h-full rounded-full ${ACCENT[tone].solid}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Buttons                                                                    */
/* -------------------------------------------------------------------------- */

type BtnProps = {
  children: ReactNode;
  tone?: Accent | "white";
  variant?: "solid" | "ghost" | "dark";
  href?: string;
  onClick?: () => void;
  className?: string;
  full?: boolean;
  type?: "button" | "submit";
  arrow?: boolean;
  disabled?: boolean;
};

export function Button({
  children,
  tone = "white",
  variant = "solid",
  href,
  onClick,
  className = "",
  full = false,
  type = "button",
  arrow = false,
  disabled = false,
}: BtnProps) {
  const ease = "ease-[cubic-bezier(0.32,0.72,0,1)]";
  let surface: string;
  let innerBg = "bg-white/20";
  if (variant === "ghost") {
    surface = "border border-white/15 bg-white/[0.03] text-white hover:bg-white/[0.08]";
  } else if (variant === "dark") {
    surface = "bg-white/8 text-white hover:bg-white/12";
  } else if (tone === "white") {
    surface = "bg-white text-[#101114]";
    innerBg = "bg-[#101114]/10";
  } else {
    surface = ACCENT[tone].solid;
  }

  const cls = `group inline-flex items-center justify-center gap-2 rounded-full text-sm font-semibold tracking-tight transition-colors duration-300 ${ease} disabled:opacity-50 ${
    arrow ? "py-2.5 pl-6 pr-2.5" : "px-6 py-3"
  } ${full ? "w-full" : ""} ${surface} ${className}`;

  const inner = (
    <>
      {children}
      {arrow && (
        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${innerBg} transition-transform duration-300 ${ease} group-hover:translate-x-0.5`}>
          <ArrowUpRight size={13} />
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={cls}>
      {inner}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Icon tile — the prototype's "fbox" launcher, as a link or button.          */
/* -------------------------------------------------------------------------- */

export function IconTile({
  icon,
  label,
  desc,
  tone = "blue",
  href,
  onClick,
}: {
  icon: IconName;
  label: string;
  desc?: string;
  tone?: Accent;
  href?: string;
  onClick?: () => void;
}) {
  const a = ACCENT[tone];
  const inner = (
    <>
      <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${a.tint} ${a.text} ring-1 ${a.ring}`}>
        <Icon name={icon} size={21} />
      </span>
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        {desc && <div className="mt-0.5 text-xs leading-snug text-white/45">{desc}</div>}
      </div>
    </>
  );
  const cls =
    "flex h-full flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.055]";
  if (href)
    return (
      <Link href={href} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Empty state + ambient background                                           */
/* -------------------------------------------------------------------------- */

export function AmbientGlow({ tone = "blue" }: { tone?: Accent }) {
  const c = {
    blue: "bg-grid-blue/10",
    green: "bg-client-green/10",
    escrow: "bg-escrow-green/10",
    gold: "bg-review-gold/10",
    red: "bg-urgent-red/10",
    purple: "bg-ai-purple/10",
    cyan: "bg-aerial-cyan/10",
  }[tone];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`absolute -top-24 left-1/3 h-[28rem] w-[28rem] rounded-full ${c} blur-[120px]`} />
    </div>
  );
}

export { Icon, Verified };
