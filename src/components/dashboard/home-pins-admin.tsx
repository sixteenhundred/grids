"use client";

import { useEffect, useState, useTransition } from "react";
import { Card, Button, Icon } from "./ui";
import { POSTS } from "@/lib/grid-data";
import { listHomePinsAdmin, pinToHome, unpinFromHome, movePin, type AdminPinRow } from "@/lib/pin-actions";

/** Admin: order the home-feed pins + pin a community post (contests are pinned
 *  from the Contests list). Renders below the Contests section. */
export function HomePinsManager() {
  const [pins, setPins] = useState<AdminPinRow[] | null>(null);
  const [postId, setPostId] = useState("");
  const [pending, start] = useTransition();

  async function load() {
    try {
      setPins(await listHomePinsAdmin());
    } catch {
      setPins([]);
    }
  }
  useEffect(() => {
    void load();
  }, []);

  function act(fn: () => Promise<void>) {
    start(async () => {
      try {
        await fn();
        await load();
      } catch {
        /* admin-gated; ignore */
      }
    });
  }

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-2">
        <Icon name="star" size={18} className="text-review-gold" />
        <h2 className="text-lg font-semibold tracking-tight text-white">Pinned to home</h2>
      </div>
      <Card className="p-5">
        {/* Pin a community post */}
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-[12rem] flex-1">
            <label className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45">Pin a community post</label>
            <select
              value={postId}
              onChange={(e) => setPostId(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none focus:border-review-gold/50"
            >
              <option value="">Select a post…</option>
              {POSTS.map((p) => (
                <option key={p.id} value={p.id}>
                  @{p.by} — {p.caption.slice(0, 44)}…
                </option>
              ))}
            </select>
          </div>
          <Button
            tone="gold"
            disabled={!postId || pending}
            onClick={() => {
              const id = postId;
              if (id) {
                setPostId("");
                act(() => pinToHome("post", id));
              }
            }}
          >
            Pin post
          </Button>
        </div>

        {/* Current pins, in display order */}
        <div className="mt-4 flex flex-col gap-2">
          {!pins ? (
            <p className="text-sm text-white/40">Loading…</p>
          ) : pins.length === 0 ? (
            <p className="text-sm text-white/40">Nothing pinned. Pin a contest from the Contests list, or a post above.</p>
          ) : (
            pins.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-2.5">
                <div className="min-w-0">
                  <span className="text-[10px] uppercase tracking-wider text-white/40">{p.itemType}</span>
                  <div className="truncate text-sm text-white">{p.label}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    disabled={i === 0 || pending}
                    onClick={() => act(() => movePin(p.id, "up"))}
                    aria-label="Move up"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:text-white disabled:opacity-30"
                  >
                    <Icon name="chevron" size={15} className="-rotate-90" />
                  </button>
                  <button
                    disabled={i === pins.length - 1 || pending}
                    onClick={() => act(() => movePin(p.id, "down"))}
                    aria-label="Move down"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/60 transition-colors hover:text-white disabled:opacity-30"
                  >
                    <Icon name="chevron" size={15} className="rotate-90" />
                  </button>
                  <Button variant="ghost" disabled={pending} onClick={() => act(() => unpinFromHome(p.itemType, p.itemId))}>
                    Unpin
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </section>
  );
}
