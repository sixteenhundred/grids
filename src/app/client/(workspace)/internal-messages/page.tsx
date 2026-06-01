"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useClient } from "@/components/client/client-context";
import { useLocalState } from "@/components/client/use-local-state";
import {
  SectionTitle,
  Panel,
  StatusBadge,
  FeatureTag,
  DemoModeNotice,
  FeatureGate,
} from "@/components/client/ui";
import { Button } from "@/components/dashboard/ui";
import { Icon } from "@/components/dashboard/icons";
import { CLIENT_KEYS } from "@/lib/client/config";
import { MOCK_CHANNELS, type Channel } from "@/lib/client/mock";

/* -------------------------------------------------------------------------- */
/*  Types + helpers                                                            */
/* -------------------------------------------------------------------------- */

type ChannelMessage = Channel["messages"][number];

const fieldClasses =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-white/35 outline-none transition-colors focus:border-grid-blue/50 focus:bg-white/[0.06]";

/** Deterministic initials — no random / no time, hydration safe. */
function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();
}

/* -------------------------------------------------------------------------- */
/*  Message row                                                                */
/* -------------------------------------------------------------------------- */

function MessageRow({
  message,
  onTogglePin,
}: {
  message: ChannelMessage;
  onTogglePin: () => void;
}) {
  return (
    <div className="group flex gap-3 rounded-2xl px-2 py-2 transition-colors hover:bg-white/[0.03]">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-grid-blue/15 text-[11px] font-semibold text-aerial-cyan ring-1 ring-grid-blue/25">
        {initials(message.author) || "?"}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-semibold text-white">{message.author}</span>
          <span className="text-[11px] text-white/40">{message.time}</span>
          {message.pinned && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-review-gold">
              <Icon name="pin" size={10} /> Pinned
            </span>
          )}
        </div>
        <p className="mt-0.5 break-words text-sm leading-relaxed text-white/75">{message.text}</p>
      </div>
      <button
        type="button"
        onClick={onTogglePin}
        aria-label={message.pinned ? "Unpin message" : "Pin message"}
        className={`shrink-0 self-start rounded-full p-2 transition-colors ${
          message.pinned
            ? "text-review-gold hover:bg-review-gold/10"
            : "text-white/35 opacity-0 hover:bg-white/10 hover:text-white group-hover:opacity-100"
        }`}
      >
        <Icon name="pin" size={14} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function InternalMessagesPage() {
  const { toast, company } = useClient();
  const [channels, setChannels] = useLocalState<Channel[]>(CLIENT_KEYS.channels, MOCK_CHANNELS);

  const [activeId, setActiveId] = useState<string>(MOCK_CHANNELS[0]?.id ?? "");
  const [newChannel, setNewChannel] = useState("");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep a valid active channel if the list changes (e.g. after hydration or delete).
  useEffect(() => {
    if (channels.length === 0) return;
    if (!channels.some((c) => c.id === activeId)) setActiveId(channels[0].id);
  }, [channels, activeId]);

  const active = channels.find((c) => c.id === activeId) ?? null;

  const pinned = useMemo(
    () => (active ? active.messages.filter((m) => m.pinned) : []),
    [active],
  );

  const visible = useMemo(() => {
    if (!active) return [];
    const q = search.trim().toLowerCase();
    if (!q) return active.messages;
    return active.messages.filter(
      (m) => m.text.toLowerCase().includes(q) || m.author.toLowerCase().includes(q),
    );
  }, [active, search]);

  const totalMessages = useMemo(
    () => channels.reduce((sum, c) => sum + c.messages.length, 0),
    [channels],
  );

  /* ---- handlers (random / time only inside handlers — hydration safe) ---- */

  function handleCreateChannel() {
    const name = newChannel.trim().replace(/^#/, "").replace(/\s+/g, "-").toLowerCase();
    if (!name) return;
    const channel: Channel = { id: crypto.randomUUID(), name, messages: [] };
    setChannels((prev) => [...prev, channel]);
    setActiveId(channel.id);
    setNewChannel("");
    setSearch("");
    toast("Channel created");
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || !active) return;
    const message: ChannelMessage = {
      id: crypto.randomUUID(),
      author: company.name || "You",
      text,
      time: "now",
    };
    setChannels((prev) =>
      prev.map((c) => (c.id === active.id ? { ...c, messages: [...c.messages, message] } : c)),
    );
    setDraft("");
    // Scroll to the newest message after it renders.
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }

  function handleSendKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleTogglePin(messageId: string) {
    if (!active) return;
    const target = active.messages.find((m) => m.id === messageId);
    const willPin = !target?.pinned;
    setChannels((prev) =>
      prev.map((c) =>
        c.id === active.id
          ? {
              ...c,
              messages: c.messages.map((m) =>
                m.id === messageId ? { ...m, pinned: !m.pinned } : m,
              ),
            }
          : c,
      ),
    );
    toast(willPin ? "Message pinned" : "Message unpinned");
  }

  function handleAttach() {
    toast("File attached");
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <SectionTitle
        title="Internal messages"
        subtitle="Keep your whole company aligned — private channels for campaigns, approvals and creative, all in one place."
        action={
          <div className="flex items-center gap-3">
            <FeatureTag feature="internal-messages" />
            <DemoModeNotice />
          </div>
        }
      />

      <FeatureGate feature="internal-messages">
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          {/* -------------------------------------------------- channel list -- */}
          <Panel className="flex flex-col gap-4 p-4 sm:p-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">
                Channels
              </h3>
              <span className="text-[11px] text-white/40">{channels.length}</span>
            </div>

            <div className="flex flex-col gap-1.5">
              {channels.length === 0 ? (
                <p className="px-1 py-4 text-sm text-white/45">
                  No channels yet — create one below to start the conversation.
                </p>
              ) : (
                channels.map((c) => {
                  const isActive = c.id === activeId;
                  const pinnedCount = c.messages.filter((m) => m.pinned).length;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setActiveId(c.id);
                        setSearch("");
                      }}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                        isActive
                          ? "bg-grid-blue/15 text-white ring-1 ring-grid-blue/30"
                          : "text-white/65 hover:bg-white/[0.05] hover:text-white"
                      }`}
                    >
                      <span className={isActive ? "text-aerial-cyan" : "text-white/35"}>#</span>
                      <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                      {pinnedCount > 0 && (
                        <Icon name="pin" size={11} className="shrink-0 text-review-gold/70" />
                      )}
                      <span className="shrink-0 text-[11px] text-white/35">
                        {c.messages.length}
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Create channel */}
            <div className="mt-auto border-t border-white/8 pt-4">
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-white/45">
                Create channel
              </label>
              <div className="flex gap-2">
                <input
                  className={fieldClasses}
                  value={newChannel}
                  onChange={(e) => setNewChannel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateChannel();
                    }
                  }}
                  placeholder="#new-channel"
                  aria-label="New channel name"
                />
                <Button
                  tone="blue"
                  onClick={handleCreateChannel}
                  disabled={!newChannel.trim()}
                  className="shrink-0 !px-4 !py-2.5"
                >
                  <Icon name="plus" size={15} />
                </Button>
              </div>
            </div>
          </Panel>

          {/* --------------------------------------------------- chat panel -- */}
          <Panel className="flex min-h-[34rem] flex-col p-0">
            {active ? (
              <>
                {/* Channel header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-1.5 text-base font-semibold tracking-tight text-white">
                      <span className="text-aerial-cyan">#</span>
                      <span className="truncate">{active.name}</span>
                    </h3>
                    <p className="mt-0.5 text-xs text-white/45">
                      {active.messages.length} message{active.messages.length === 1 ? "" : "s"}
                      {pinned.length > 0 ? ` · ${pinned.length} pinned` : ""}
                    </p>
                  </div>
                  <div className="relative w-full sm:w-56">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35">
                      <Icon name="search" size={14} />
                    </span>
                    <input
                      className={`${fieldClasses} pl-9`}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search messages"
                      aria-label="Search messages"
                    />
                  </div>
                </div>

                {/* Pinned messages */}
                {pinned.length > 0 && (
                  <div className="border-b border-white/8 bg-review-gold/[0.04] px-5 py-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-review-gold">
                      <Icon name="pin" size={12} /> Pinned
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {pinned.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-start justify-between gap-3 rounded-xl border border-review-gold/15 bg-white/[0.02] px-3 py-2"
                        >
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-white/85">{m.author}</span>
                            <p className="mt-0.5 break-words text-sm text-white/70">{m.text}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleTogglePin(m.id)}
                            aria-label="Unpin message"
                            className="shrink-0 rounded-full p-1.5 text-review-gold transition-colors hover:bg-review-gold/10"
                          >
                            <Icon name="x" size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Message list */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 sm:px-4">
                  {visible.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-white/50">
                        <Icon name="comment" size={22} />
                      </span>
                      <p className="mt-4 text-sm text-white/55">
                        {search.trim()
                          ? "No messages match your search."
                          : "No messages yet — say hello to get the channel started."}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-0.5">
                      {visible.map((m) => (
                        <MessageRow
                          key={m.id}
                          message={m}
                          onTogglePin={() => handleTogglePin(m.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Composer */}
                <div className="border-t border-white/8 p-3 sm:p-4">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAttach}
                      aria-label="Attach file"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Icon name="upload" size={16} />
                    </button>
                    <input
                      className={fieldClasses}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={handleSendKey}
                      placeholder={`Message #${active.name}`}
                      aria-label="Message"
                    />
                    <Button
                      tone="blue"
                      onClick={handleSend}
                      disabled={!draft.trim()}
                      className="shrink-0"
                    >
                      <Icon name="send" size={15} />
                      <span className="hidden sm:inline">Send</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center py-20 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.06] text-white/50">
                  <Icon name="comment" size={24} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-white">No channel selected</h3>
                <p className="mt-2 max-w-sm text-sm text-white/55">
                  Create a channel to start messaging your team.
                </p>
              </div>
            )}
          </Panel>
        </div>

        {/* Footer status line */}
        <div className="mt-4 flex flex-wrap items-center gap-2 px-1 text-xs text-white/45">
          <StatusBadge label={`${channels.length} channels`} tone="blue" />
          <StatusBadge label={`${totalMessages} messages`} tone="gray" />
          <span>End-to-end private to your company workspace.</span>
        </div>
      </FeatureGate>
    </div>
  );
}
