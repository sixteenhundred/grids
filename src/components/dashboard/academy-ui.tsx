"use client";

import { useRef, useState } from "react";
import { Card, MediaTile, StatusPill, Progress, Button, Icon } from "./ui";
import { useSheet, SheetHeader } from "./sheet";
import { money } from "@/lib/grid-data";
import { fileToImageDataUrl, LEVELS, type LearningPath, type Level, type NewPath, type NewLesson } from "@/lib/academy";
import { enrollAcademy } from "@/lib/academy-actions";

/* Reusable image picker with live preview (logo, banner, path cover). */
export function ImageUpload({
  value,
  onChange,
  maxDim,
  rounded,
  ratio,
  icon,
  label,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  maxDim: number;
  rounded: string;
  ratio: string;
  icon: "camera" | "user";
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      onChange(await fileToImageDataUrl(f, maxDim));
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFile} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={{ aspectRatio: ratio }}
        className={`relative flex w-full items-center justify-center overflow-hidden border border-dashed border-white/15 bg-white/[0.03] transition-colors hover:border-review-gold/50 hover:bg-white/[0.05] ${rounded}`}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-white/45">
            <Icon name={icon} size={22} />
            <span className="text-xs">{busy ? "Processing…" : label}</span>
          </span>
        )}
      </button>
      {value && (
        <button type="button" onClick={() => onChange(null)} className="mt-2 text-xs text-white/45 transition-colors hover:text-urgent-red">
          Remove
        </button>
      )}
    </div>
  );
}

/** Price pill — "Free" or "€X". */
export function PriceTag({ price }: { price: number }) {
  return <StatusPill tone={price > 0 ? "gold" : "escrow"}>{price > 0 ? money(price) : "Free"}</StatusPill>;
}

/** Escrow-style enrollment for a priced academy. */
export function EnrollAcademySheet({
  academyId,
  name,
  price,
  onEnrolled,
}: {
  academyId: string;
  name: string;
  price: number;
  onEnrolled: () => void;
}) {
  const { close } = useSheet();
  const [step, setStep] = useState<"view" | "paying" | "done">("view");
  const fee = Math.round(price * 0.05);
  const total = price + fee;

  async function enroll() {
    setStep("paying");
    try {
      await enrollAcademy(academyId);
      onEnrolled();
    } catch {
      setStep("view");
      return;
    }
    setStep("done");
  }

  if (step === "done") {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
          <Icon name="check" size={30} />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">You’re enrolled.</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">Every course in {name} is now unlocked. Start whenever you like.</p>
        <div className="mt-6">
          <Button full tone="gold" onClick={close}>
            Start learning
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SheetHeader title={`Enroll in ${name}`} subtitle="One-time payment — lifetime access to every course." />
      <div className="rounded-2xl border border-escrow-green/25 bg-escrow-green/[0.07] p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
            <Icon name="shield" size={18} />
          </span>
          <div className="text-sm font-semibold text-white">Protected by Grid</div>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-white/55">Access</span>
          <span className="text-white/85">{money(price)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between text-sm">
          <span className="text-white/55">Grid fee (5%)</span>
          <span className="text-white/85">{money(fee)}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-2 text-sm">
          <span className="text-white/55">Total</span>
          <span className="font-semibold text-white">{money(total)}</span>
        </div>
      </div>
      <div className="mt-6">
        <Button full tone="gold" arrow disabled={step === "paying"} onClick={enroll}>
          {step === "paying" ? "Securing payment…" : `Enroll · ${money(total)}`}
        </Button>
      </div>
    </div>
  );
}

export function CourseTile({ path, onOpen, locked = false }: { path: LearningPath; onOpen: () => void; locked?: boolean }) {
  const pct = path.lessonCount ? Math.round((path.completedCount / path.lessonCount) * 100) : 0;
  return (
    <Card hover className="overflow-hidden">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <MediaTile tile={path.coverTile} image={path.coverImage} ratio="16 / 9" rounded="rounded-t-3xl">
          <span className="absolute left-3 top-3">
            <StatusPill tone="gold">{path.level}</StatusPill>
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white ring-1 ring-white/20 backdrop-blur-md">
              <Icon name={locked ? "lock" : "play"} size={20} />
            </span>
          </span>
        </MediaTile>
        <div className="p-5">
          <h3 className="font-semibold tracking-tight text-white">{path.title}</h3>
          {path.description && <p className="mt-1 line-clamp-2 text-sm text-white/55">{path.description}</p>}
          <div className="mt-4">
            <Progress value={pct} tone="gold" />
            <div className="mt-2 flex items-center justify-between text-xs text-white/50">
              <span>{path.completedCount} / {path.lessonCount} lessons</span>
              <span>{pct}%</span>
            </div>
          </div>
        </div>
      </button>
    </Card>
  );
}

export function AddCourseSheet({ onAdd }: { onAdd: (input: NewPath) => Promise<void> }) {
  const { close } = useSheet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<Level>("Beginner");
  const [cover, setCover] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && !saving;

  async function submit() {
    setSaving(true);
    await onAdd({ title: title.trim(), description: description.trim(), level, coverImage: cover });
    close();
  }

  return (
    <div>
      <SheetHeader title="Add a course" subtitle="A course of lessons learners work through in order." />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Cover</label>
      <div className="mb-4">
        <ImageUpload value={cover} onChange={setCover} maxDim={900} rounded="rounded-2xl" ratio="16 / 9" icon="camera" label="Add a cover image" />
      </div>

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Color Grading"
        className="mb-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-review-gold/50"
      />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="What learners will be able to do by the end."
        className="mb-4 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-review-gold/50"
      />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Level</label>
      <div className="mb-2 flex flex-wrap gap-2">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLevel(l)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${level === l ? "bg-review-gold text-[#101114]" : "bg-white/[0.05] text-white/60 hover:text-white"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="mt-6">
        <Button full tone="gold" arrow disabled={!canSave} onClick={submit}>
          {saving ? "Adding…" : "Add course"}
        </Button>
      </div>
    </div>
  );
}

export function AddLessonSheet({ onAdd }: { onAdd: (input: NewLesson) => Promise<void> }) {
  const { close } = useSheet();
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave = title.trim().length > 0 && !saving;

  async function submit() {
    setSaving(true);
    await onAdd({ title: title.trim(), duration: duration.trim(), content: content.trim() });
    close();
  }

  return (
    <div>
      <SheetHeader title="Add a lesson" subtitle="It's added to the end of the path." />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Reading scopes & exposure"
        className="mb-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-review-gold/50"
      />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Duration</label>
      <input
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        placeholder="e.g. 12 min"
        className="mb-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-review-gold/50"
      />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Lesson content</label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        placeholder="Write the lesson. Line breaks become paragraphs."
        className="mb-4 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-relaxed text-white outline-none transition-colors placeholder:text-white/35 focus:border-review-gold/50"
      />

      <div className="mt-2">
        <Button full tone="gold" arrow disabled={!canSave} onClick={submit}>
          {saving ? "Adding…" : "Add lesson"}
        </Button>
      </div>
    </div>
  );
}
