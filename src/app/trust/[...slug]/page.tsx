import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "@/components/dashboard/icons";
import { ACCENT } from "@/components/dashboard/ui";
import {
  findTrustDoc,
  trustCategory,
  trustDocsByCategory,
  type TrustDoc,
  type TrustCategory,
} from "@/lib/trust";

export default async function TrustSlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const path = slug.join("/");

  const doc = findTrustDoc(path);
  if (doc) return <DocView doc={doc} />;

  const cat = trustCategory(path);
  if (cat) return <CategoryView cat={cat} />;

  notFound();
}

/* -------------------------------------------------------------------------- */

function Crumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1.5 text-xs text-white/40">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-white/20">/</span>}
          {it.href ? (
            <Link href={it.href} className="transition-colors hover:text-white/70">{it.label}</Link>
          ) : (
            <span className="text-white/60">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

function StatusBadge({ status }: { status: TrustDoc["status"] }) {
  const published = status === "published";
  const a = published ? ACCENT.escrow : ACCENT.gold;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ring-1 ${a.text} ${a.tint} ${a.ring}`}>
      {published ? "Published" : "Summary · in review"}
    </span>
  );
}

function DocView({ doc }: { doc: TrustDoc }) {
  const cat = trustCategory(doc.category);
  const siblings = trustDocsByCategory(doc.category).filter((d) => d.path !== doc.path);

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Crumbs
        items={[
          { label: "Trust Center", href: "/trust" },
          ...(cat ? [{ label: cat.title, href: `/trust/${cat.id}` }] : []),
          { label: doc.title },
        ]}
      />

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-white sm:text-4xl">{doc.title}</h1>
        <StatusBadge status={doc.status} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
        <span>Version {doc.version}</span>
        <span>Last reviewed {doc.updated}</span>
      </div>

      <p className="mt-6 text-pretty text-lg leading-relaxed text-white/75">{doc.summary}</p>

      {doc.sections && doc.sections.length > 0 && (
        <div className="mt-8 flex flex-col gap-7 border-t border-white/8 pt-8">
          {doc.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="text-base font-semibold tracking-tight text-white">{s.heading}</h2>
              <div className="mt-2 flex flex-col gap-2">
                {s.body.map((p, i) => (
                  <p key={i} className="text-sm leading-relaxed text-white/65">{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {doc.status === "in-review" && (
        <div className="mt-8 flex items-start gap-2.5 rounded-2xl border border-review-gold/25 bg-review-gold/[0.06] px-4 py-3">
          <Icon name="file" size={16} className="mt-0.5 shrink-0 text-review-gold" />
          <p className="text-xs leading-relaxed text-white/60">
            This is a plain-language summary. The complete binding document is in final legal review and will be
            published here with its full text, version and effective date before launch.
          </p>
        </div>
      )}

      {siblings.length > 0 && (
        <div className="mt-12 border-t border-white/8 pt-8">
          <div className="mb-3 text-[10px] font-medium uppercase tracking-[0.2em] text-white/40">More in {cat?.title}</div>
          <div className="flex flex-col gap-1.5">
            {siblings.map((d) => (
              <Link key={d.path} href={`/trust/${d.path}`} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]">
                <span className="text-sm text-white/80">{d.title}</span>
                <Icon name="chevron" size={15} className="text-white/30" />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryView({ cat }: { cat: TrustCategory }) {
  const docs = trustDocsByCategory(cat.id);
  const a = ACCENT[cat.tone];
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <Crumbs items={[{ label: "Trust Center", href: "/trust" }, { label: cat.title }]} />
      <div className="mt-5 flex items-center gap-3">
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${a.tint} ${a.text} ring-1 ${a.ring}`}>
          <Icon name={cat.icon} size={21} />
        </span>
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-white">{cat.title}</h1>
          <p className="mt-1 text-sm text-white/55">{cat.blurb}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-2.5">
        {docs.map((d) => (
          <Link
            key={d.path}
            href={`/trust/${d.path}`}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.055]"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-white">{d.title}</span>
              <StatusBadge status={d.status} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-white/55">{d.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
