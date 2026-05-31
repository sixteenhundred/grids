"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Surface, Card, Button, Icon } from "@/components/dashboard/ui";
import { findNews, NEWS } from "@/lib/grid-data";

export default function NewsArticlePage() {
  const { id } = useParams<{ id: string }>();
  const article = findNews(id);

  if (!article) {
    return (
      <div className="rise flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">Article not found</h1>
          <div className="mt-6">
            <Button href="/dashboard/news" arrow>
              Back to News
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const more = NEWS.filter((n) => n.id !== article.id).slice(0, 2);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="rise">
        <Link href="/dashboard/news" className="inline-flex items-center gap-1.5 text-sm text-white/45 transition-colors hover:text-white">
          <Icon name="chevron" size={14} className="rotate-180" /> News
        </Link>
      </div>

      <article className="rise" style={{ animationDelay: "60ms" }}>
        <Surface radius="2rem" inner="p-6 sm:p-8">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-aerial-cyan">
            <span>{article.category}</span>
            <span className="text-white/35">· {article.when}</span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.03em] text-white sm:text-4xl">{article.title}</h1>
          <p className="mt-3 text-lg leading-relaxed text-white/65">{article.excerpt}</p>

          <div className="my-6 h-px bg-white/10" />

          <div className="flex flex-col gap-4">
            {article.body.map((p, i) => (
              <p key={i} className="text-[15px] leading-relaxed text-white/75">
                {p}
              </p>
            ))}
          </div>
        </Surface>
      </article>

      {more.length > 0 && (
        <div className="rise" style={{ animationDelay: "120ms" }}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-white/45">More updates</h2>
          <div className="flex flex-col gap-3">
            {more.map((n) => (
              <Link key={n.id} href={`/dashboard/news/${n.id}`} className="block">
                <Card hover className="flex items-center gap-4 p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-grid-blue/12 text-aerial-cyan ring-1 ring-grid-blue/25">
                    <Icon name="news" size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{n.title}</div>
                    <div className="text-xs text-white/40">{n.when}</div>
                  </div>
                  <Icon name="chevron" size={16} className="shrink-0 text-white/30" />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
