"use client";

import { useEffect, useRef, useState } from "react";
import { useRole } from "@/components/dashboard/role-context";
import { PageHeader, Surface, Card, Button, Icon, StatusPill } from "@/components/dashboard/ui";
import { useSheet, SheetHeader } from "@/components/dashboard/sheet";
import { PROJECTS, money, type Project } from "@/lib/grid-data";
import {
  loadDeliveries,
  saveDeliveries,
  acceptDelivery,
  formatSize,
  relativeTime,
  isVideoFile,
  type Delivery,
  type TransferFile,
} from "@/lib/transfers";

/* -------------------------------------------------------------------------- */
/*  Watermarked preview tile — locked until the client accepts                  */
/* -------------------------------------------------------------------------- */

const TILE_GRADIENTS = [
  "linear-gradient(135deg,#1f2a40,#0a0c12)",
  "linear-gradient(135deg,#2a2438,#0d0a12)",
  "linear-gradient(135deg,#163a3a,#08100f)",
  "linear-gradient(135deg,#3a2a1a,#0f0a06)",
];

function PreviewTile({ file, index, locked }: { file: TransferFile; index: number; locked: boolean }) {
  const video = isVideoFile(file.name);
  return (
    <div className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
      <div className="absolute inset-0" style={{ backgroundImage: TILE_GRADIENTS[index % TILE_GRADIENTS.length] }} />

      {locked && (
        <>
          <div className="absolute inset-0 backdrop-blur-[3px]" />
          <div className="pointer-events-none absolute inset-0 flex -rotate-[28deg] flex-col items-center justify-center gap-2 text-[8px] font-bold uppercase tracking-wider text-white/20">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="whitespace-nowrap">GRID • PREVIEW • GRID • PREVIEW</span>
            ))}
          </div>
        </>
      )}

      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`flex h-9 w-9 items-center justify-center rounded-full ring-1 ${locked ? "bg-black/45 text-white/80 ring-white/20" : "bg-escrow-green/20 text-escrow-green ring-escrow-green/40"}`}>
          <Icon name={locked ? "lock" : video ? "play" : "check"} size={16} />
        </span>
      </div>

      {locked ? (
        <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/80">Preview</span>
      ) : (
        <span className="absolute left-1.5 top-1.5 rounded bg-escrow-green/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-escrow-green">Full</span>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-1.5">
        <span className="block truncate text-[10px] text-white/80">{file.name}</span>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Client — review & accept a delivery                                         */
/* -------------------------------------------------------------------------- */

function DeliveryReviewSheet({ delivery, onAccept }: { delivery: Delivery; onAccept: () => void }) {
  const { close } = useSheet();
  const [accepted, setAccepted] = useState(delivery.status === "accepted");
  const [processing, setProcessing] = useState(false);

  function accept() {
    setProcessing(true);
    setTimeout(() => {
      onAccept();
      setAccepted(true);
      setProcessing(false);
    }, 900);
  }

  function downloadFolder() {
    const manifest = [`${delivery.projectTitle} — full delivery`, `Released ${new Date().toLocaleString()}`, "", ...delivery.files.map((f) => `• ${f.name} (${formatSize(f.size)})`)].join("\n");
    const blob = new Blob([manifest], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${delivery.projectTitle.replace(/\s+/g, "-").toLowerCase()}-full-folder.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <SheetHeader title={accepted ? "Full files unlocked" : "Review delivery"} subtitle={`${delivery.projectTitle} · ${delivery.files.length} file${delivery.files.length === 1 ? "" : "s"}`} />

      {accepted ? (
        <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-escrow-green/25 bg-escrow-green/[0.07] p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
            <Icon name="check" size={18} />
          </span>
          <p className="text-sm leading-snug text-white/75">Accepted — full-resolution files unlocked and {money(delivery.value)} released from protection.</p>
        </div>
      ) : (
        <div className="mb-4 flex items-center gap-2.5 rounded-2xl border border-review-gold/25 bg-review-gold/[0.07] p-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-review-gold/15 text-review-gold ring-1 ring-review-gold/30">
            <Icon name="lock" size={18} />
          </span>
          <p className="text-sm leading-snug text-white/75">These are low-res, watermarked previews. Accept to unlock the full files and release payment.</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        {delivery.files.map((f, i) => (
          <PreviewTile key={i} file={f} index={i} locked={!accepted} />
        ))}
      </div>

      {delivery.note && <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">“{delivery.note}”</p>}

      {accepted ? (
        <div className="mt-6 flex flex-col gap-2.5">
          <Button full tone="escrow" arrow onClick={downloadFolder}>
            <Icon name="download" size={15} /> Download full folder
          </Button>
          <Button full variant="ghost" onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="inline-flex items-center gap-1.5 text-sm text-white/55">
              <Icon name="shield" size={14} className="text-escrow-green" /> Processing
            </span>
            <span className="font-mono text-sm font-semibold text-white">{money(delivery.value)}</span>
          </div>
          <div className="mt-3">
            <Button full tone="escrow" arrow disabled={processing} onClick={accept}>
              {processing ? "Releasing…" : `Accept & release ${money(delivery.value)}`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Creator — send flow                                                         */
/* -------------------------------------------------------------------------- */

function TransferSheet({ onDelivered }: { onDelivered: (d: Delivery) => void }) {
  const { close } = useSheet();
  const [step, setStep] = useState<"client" | "upload" | "confirm" | "done">("client");
  const [target, setTarget] = useState<Project | null>(null);
  const [files, setFiles] = useState<TransferFile[]>([]);
  const [markDelivery, setMarkDelivery] = useState(true);
  const [note, setNote] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(list: FileList | null) {
    if (!list) return;
    setFiles((prev) => [...prev, ...Array.from(list).map((f) => ({ name: f.name, size: f.size }))]);
  }

  if (step === "client") {
    return (
      <div>
        <SheetHeader title="Deliver to which client?" subtitle="Choose the project you're sending files for." />
        <div className="flex flex-col gap-2.5">
          {PROJECTS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => { setTarget(p); setStep("upload"); }}
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:border-grid-blue/40 hover:bg-white/[0.05]"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-grid-blue/12 text-aerial-cyan ring-1 ring-grid-blue/25">
                <Icon name="building" size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-white">{p.withName}</div>
                <div className="truncate text-xs text-white/45">{p.title}</div>
              </div>
              <Icon name="chevron" size={16} className="shrink-0 text-white/30" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "upload" && target) {
    return (
      <div>
        <SheetHeader title={`Upload for ${target.withName}`} subtitle={target.title} />
        <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center transition-colors ${dragging ? "border-grid-blue/60 bg-grid-blue/[0.06]" : "border-white/15 bg-white/[0.03] hover:border-aerial-cyan/50 hover:bg-white/[0.05]"}`}
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-aerial-cyan/12 text-aerial-cyan ring-1 ring-aerial-cyan/25">
            <Icon name="upload" size={22} />
          </span>
          <div className="text-sm text-white/70">Drag &amp; drop files here</div>
          <div className="text-xs text-white/40">or</div>
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white">Upload here</span>
        </div>

        {files.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {files.map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
                <Icon name="file" size={15} className="shrink-0 text-aerial-cyan" />
                <span className="min-w-0 flex-1 truncate text-sm text-white/80">{f.name}</span>
                <span className="shrink-0 text-xs text-white/40">{formatSize(f.size)}</span>
                <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} aria-label="Remove" className="text-white/35 hover:text-urgent-red">
                  <Icon name="x" size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 flex gap-2.5">
          <Button variant="ghost" onClick={() => setStep("client")}>Back</Button>
          <Button arrow disabled={files.length === 0} onClick={() => setStep("confirm")} className="flex-1">Continue</Button>
        </div>
      </div>
    );
  }

  if (step === "confirm" && target) {
    const totalSize = files.reduce((a, f) => a + f.size, 0);
    function send() {
      onDelivered({
        id: `dl${Date.now()}`,
        client: target!.withName,
        projectId: target!.id,
        projectTitle: target!.title,
        files,
        markedDelivery: markDelivery,
        note: note.trim(),
        value: target!.budget,
        status: "pending",
        acceptedAt: null,
        createdAt: Date.now(),
      });
      setStep("done");
    }
    return (
      <div>
        <SheetHeader title="Confirm transfer" subtitle={`${files.length} file${files.length === 1 ? "" : "s"} · ${formatSize(totalSize)} → ${target.withName}`} />

        <button
          type="button"
          onClick={() => setMarkDelivery((v) => !v)}
          className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-colors ${markDelivery ? "border-escrow-green/40 bg-escrow-green/[0.07]" : "border-white/10 bg-white/[0.03]"}`}
        >
          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ${markDelivery ? "bg-escrow-green text-[#08130b] ring-escrow-green" : "bg-white/[0.06] ring-white/20"}`}>
            {markDelivery && <Icon name="check" size={13} />}
          </span>
          <span>
            <span className="block text-sm font-medium text-white">Mark as delivery</span>
            <span className="mt-0.5 block text-xs leading-snug text-white/55">
              {target.withName} gets watermarked previews to review. {money(target.budget)} is released from protection only when they accept.
            </span>
          </span>
        </button>

        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Add a note for the client (optional)"
          className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-grid-blue/50"
        />

        <div className="mt-6 flex gap-2.5">
          <Button variant="ghost" onClick={() => setStep("upload")}>Back</Button>
          <Button arrow tone={markDelivery ? "green" : "white"} onClick={send} className="flex-1">{markDelivery ? "Send delivery" : "Send files"}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
        <Icon name="check" size={30} />
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">{markDelivery ? "Delivery sent" : "Files sent"}</h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
        {target?.withName} received watermarked previews to review. You’ll be paid {money(target?.budget ?? 0)} the moment they accept.
      </p>
      <div className="mt-6">
        <Button full onClick={close}>Done</Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

function statusBadge(d: Delivery) {
  return d.status === "accepted" ? (
    <StatusPill tone="escrow">Accepted · Paid</StatusPill>
  ) : (
    <StatusPill tone="gold" live>Awaiting acceptance</StatusPill>
  );
}

export default function TransferPage() {
  const { role } = useRole();
  const { open } = useSheet();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);

  useEffect(() => setDeliveries(loadDeliveries()), []);

  function addDelivery(d: Delivery) {
    const next = [d, ...deliveries];
    setDeliveries(next);
    saveDeliveries(next);
  }
  function accept(id: string) {
    setDeliveries(acceptDelivery(id));
  }

  /* ----- Client: receive & accept ------------------------------------- */
  if (role === "client") {
    const incoming = deliveries.filter((d) => d.markedDelivery);
    return (
      <div className="flex flex-col gap-8">
        <div className="rise">
          <PageHeader eyebrow="Grid Transfer" tone="cyan" title="Your deliveries." subtitle="Review watermarked previews, then accept to unlock the full files." />
        </div>
        <div className="rise" style={{ animationDelay: "60ms" }}>
          {incoming.length === 0 ? (
            <Surface radius="2rem" inner="p-10">
              <p className="text-center text-sm text-white/55">No deliveries yet. Files your creators send will appear here.</p>
            </Surface>
          ) : (
            <div className="flex flex-col gap-3">
              {incoming.map((d) => (
                <Card key={d.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aerial-cyan/12 text-aerial-cyan ring-1 ring-aerial-cyan/25">
                        <Icon name="folder" size={18} />
                      </span>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-white">{d.projectTitle}</div>
                        <div className="truncate text-xs text-white/45">{d.files.length} file{d.files.length === 1 ? "" : "s"} · {formatSize(d.files.reduce((a, f) => a + f.size, 0))} · {relativeTime(d.createdAt)}</div>
                      </div>
                    </div>
                    {statusBadge(d)}
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
                    <span className="font-mono text-xs text-white/45">{money(d.value)} protected</span>
                    <Button tone={d.status === "accepted" ? "white" : "escrow"} variant={d.status === "accepted" ? "ghost" : "solid"} arrow onClick={() => open(<DeliveryReviewSheet delivery={d} onAccept={() => accept(d.id)} />)} className="!py-2 !pl-4">
                      {d.status === "accepted" ? "View files" : "Review & accept"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ----- Creator: send -------------------------------------------------- */
  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <PageHeader eyebrow="Grid Transfer" tone="cyan" title="Deliver your work." subtitle="Send finished files to a client in seconds — drag, drop, deliver." />
      </div>

      <div className="rise" style={{ animationDelay: "60ms" }}>
        <Surface radius="2rem" inner="p-6 sm:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-aerial-cyan/12 text-aerial-cyan ring-1 ring-aerial-cyan/25">
                <Icon name="folder" size={22} />
              </span>
              <div>
                <h3 className="font-semibold text-white">New transfer</h3>
                <p className="mt-1 max-w-md text-sm text-white/55">Pick the client, drop your files, and deliver. They review watermarked previews before payment releases.</p>
              </div>
            </div>
            <Button arrow onClick={() => open(<TransferSheet onDelivered={addDelivery} />)} className="shrink-0">
              <Icon name="upload" size={15} /> Transfer files
            </Button>
          </div>
        </Surface>
      </div>

      <div className="rise" style={{ animationDelay: "120ms" }}>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">Recent transfers</h2>
        {deliveries.length === 0 ? (
          <Surface radius="2rem" inner="p-10">
            <p className="text-center text-sm text-white/55">No transfers yet. Send your first delivery above.</p>
          </Surface>
        ) : (
          <div className="flex flex-col gap-3">
            {deliveries.map((d) => (
              <Card key={d.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-aerial-cyan/12 text-aerial-cyan ring-1 ring-aerial-cyan/25">
                      <Icon name="folder" size={18} />
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{d.client}</div>
                      <div className="truncate text-xs text-white/45">{d.projectTitle} · {d.files.length} file{d.files.length === 1 ? "" : "s"}</div>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    {d.markedDelivery ? statusBadge(d) : <StatusPill tone="blue">Sent</StatusPill>}
                    <span className="text-[11px] text-white/40">{relativeTime(d.createdAt)}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
