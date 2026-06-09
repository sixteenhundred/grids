"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useSheet, SheetHeader } from "./sheet";
import { Button, Icon, Toggle } from "./ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { UPLOAD_BUCKET } from "@/lib/storage-shared";
import { CONTEST_TERMS, VIDEO_MAX_BYTES, IMAGE_MAX_BYTES, VIDEO_MAX_SECONDS, type ContestType } from "@/lib/contest";
import {
  getContestSubmitContext,
  saveContestProfileBasics,
  createContestUploadUrl,
  submitToContest,
  type SubmitContext,
} from "@/lib/contest-submit-actions";

const field =
  "w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-review-gold/50";
const lbl = "mb-1.5 block text-xs uppercase tracking-[0.14em] text-white/45";

function readDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

function videoDuration(file: File): Promise<number> {
  return new Promise((res) => {
    const v = document.createElement("video");
    v.preload = "metadata";
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src);
      res(v.duration || 0);
    };
    v.onerror = () => res(0);
    v.src = URL.createObjectURL(file);
  });
}

/** Client-side type + size (+ video duration) enforcement before any upload. */
async function validateFile(file: File, type: ContestType): Promise<{ ok: boolean; error?: string; durationSec?: number }> {
  if (type === "video") {
    if (!file.type.startsWith("video/")) return { ok: false, error: "Please choose a video file." };
    if (file.size > VIDEO_MAX_BYTES) return { ok: false, error: "Video is over the 2 GB limit." };
    const d = await videoDuration(file);
    if (d > VIDEO_MAX_SECONDS + 0.5) {
      return { ok: false, error: `Video must be ${VIDEO_MAX_SECONDS / 60} minutes or less (yours is ${Math.round(d)}s).` };
    }
    return { ok: true, durationSec: Math.round(d) };
  }
  if (!file.type.startsWith("image/")) return { ok: false, error: "Please choose an image file." };
  if (file.size > IMAGE_MAX_BYTES) return { ok: false, error: "Image is over the 5 GB limit." };
  return { ok: true };
}

export function ContestSubmitSheet({ contestId, onSubmitted }: { contestId: string; onSubmitted?: () => void }) {
  const { close } = useSheet();
  const [ctx, setCtx] = useState<SubmitContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // profile-gate fields
  const [pName, setPName] = useState("");
  const [pCountry, setPCountry] = useState("");
  const [pAvatar, setPAvatar] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // submission fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [addToPortfolio, setAddToPortfolio] = useState(false);
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    try {
      const c = await getContestSubmitContext(contestId);
      setCtx(c);
      setPName(c.profile.name);
      setPCountry(c.profile.country);
    } catch {
      setError("Couldn't load this contest.");
    }
  }
  useEffect(() => {
    void load();
  }, [contestId]);

  if (!ctx) return <div className="py-6 text-center text-sm text-white/40">{error ?? "Loading…"}</div>;
  if (!ctx.contest) return <div className="py-6 text-center text-sm text-white/55">This contest is unavailable.</div>;
  const C = ctx.contest;

  if (done) {
    return (
      <div className="py-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
          <Icon name="check" size={30} />
        </span>
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">Entry submitted</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
          Your submission stays a private preview. {C.title} winners are picked{" "}
          {C.winnerPickAt ? new Date(C.winnerPickAt).toLocaleDateString() : "soon"}.
        </p>
        <div className="mt-6">
          <Button full tone="escrow" onClick={close}>
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (!ctx.open) {
    return (
      <div>
        <SheetHeader title={C.title} subtitle="Submissions closed" />
        <p className="py-2 text-center text-sm text-white/55">This contest isn’t accepting submissions right now.</p>
      </div>
    );
  }

  const profileComplete = ctx.profile.hasAvatar && ctx.profile.hasCountry && !!ctx.profile.name;

  /* ---------- Profile gate (1d: name + picture + country required) ---------- */
  if (!profileComplete) {
    const onAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (!f.type.startsWith("image/")) return setError("Picture must be an image.");
      if (f.size > 2_500_000) return setError("Picture is too large (max ~2 MB).");
      setError(null);
      setPAvatar(await readDataUrl(f));
    };
    const saveProfile = async () => {
      if (!pName.trim() || !pCountry.trim() || !(pAvatar || ctx.profile.hasAvatar)) {
        return setError("Name, picture and country are all required.");
      }
      setSavingProfile(true);
      setError(null);
      try {
        await saveContestProfileBasics({ name: pName, country: pCountry, avatarDataUrl: pAvatar });
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't save your profile.");
      } finally {
        setSavingProfile(false);
      }
    };
    return (
      <div>
        <SheetHeader title="Complete your profile" subtitle="Contests require your name, picture and country." />
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] bg-cover bg-center"
              style={pAvatar ? { backgroundImage: `url(${pAvatar})` } : undefined}
            >
              {!pAvatar && <Icon name="user" size={24} className="text-white/40" />}
            </span>
            <label className="cursor-pointer rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm text-white transition-colors hover:bg-white/[0.08]">
              Upload picture
              <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
            </label>
          </div>
          <div>
            <label className={lbl}>Name</label>
            <input className={field} value={pName} onChange={(e) => setPName(e.target.value)} placeholder="Your name" />
          </div>
          <div>
            <label className={lbl}>Country</label>
            <input className={field} value={pCountry} onChange={(e) => setPCountry(e.target.value)} placeholder="e.g. Norway" />
          </div>
          {error && <p className="text-xs text-urgent-red">{error}</p>}
          <Button full tone="gold" disabled={savingProfile} onClick={saveProfile}>
            {savingProfile ? "Saving…" : "Save & continue"}
          </Button>
        </div>
      </div>
    );
  }

  /* ----------------------------- Submission form ---------------------------- */
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    const v = await validateFile(f, C.type);
    if (!v.ok) {
      setError(v.error ?? "Invalid file.");
      setFile(null);
      setDurationSec(null);
      return;
    }
    setFile(f);
    setDurationSec(v.durationSec ?? null);
  };

  const submit = async () => {
    if (!title.trim()) return setError("Add a title.");
    if (!file) return setError(`Add your ${C.type} file.`);
    if (!accept) return setError("Please accept the terms of admission.");
    setError(null);
    try {
      setBusy("upload");
      const { path, token } = await createContestUploadUrl(C.id, file.name, file.size);
      const supabase = createSupabaseBrowserClient();
      const { error: upErr } = await supabase.storage.from(UPLOAD_BUCKET).uploadToSignedUrl(path, token, file);
      if (upErr) throw new Error("Upload failed — please try again.");
      setBusy("submit");
      await submitToContest({
        contestId: C.id,
        title,
        description,
        filePath: path,
        fileType: file.type,
        fileSize: file.size,
        durationSec,
        addToPortfolio,
        acceptTerms: accept,
      });
      setDone(true);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit your entry.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <SheetHeader title={`Submit to ${C.title}`} subtitle={C.type === "video" ? "Video · 4K, max 2 minutes" : "Image · up to 5 GB"} />
      <div className="flex flex-col gap-4">
        <div>
          <label className={lbl}>Title</label>
          <input className={field} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Name your entry" />
        </div>
        <div>
          <label className={lbl}>Description</label>
          <textarea className={`${field} min-h-[64px] resize-y`} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell the host about it" />
        </div>
        <div>
          <label className={lbl}>{C.type === "video" ? "Video file" : "Image file"}</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4 transition-colors hover:bg-white/[0.04]">
            <Icon name="upload" size={18} className="text-review-gold" />
            <span className="min-w-0 flex-1 truncate text-sm text-white/70">
              {file ? file.name : `Choose a ${C.type} (${C.type === "video" ? "≤2 min, ≤2 GB" : "≤5 GB"})`}
            </span>
            <input type="file" accept={C.type === "video" ? "video/*" : "image/*"} className="hidden" onChange={onFile} />
          </label>
          {durationSec != null && <p className="mt-1 text-xs text-white/40">Duration: {durationSec}s</p>}
        </div>

        <label className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
          <span className="text-sm text-white/80">Add to my portfolio after the contest</span>
          <Toggle checked={addToPortfolio} onChange={setAddToPortfolio} tone="gold" label="Add to portfolio after contest" />
        </label>

        {/* Terms of admission (1c) */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Terms of admission</div>
          <p className="mt-2 text-xs leading-relaxed text-white/55">{C.terms || CONTEST_TERMS}</p>
          <label className="mt-3 flex items-start gap-2 text-sm text-white/80">
            <input type="checkbox" checked={accept} onChange={(e) => setAccept(e.target.checked)} className="mt-0.5 accent-review-gold" />
            I have read and accept the terms.
          </label>
        </div>

        {error && <p className="text-xs text-urgent-red">{error}</p>}
        <Button full tone="gold" arrow disabled={!!busy} onClick={submit}>
          {busy === "upload" ? "Uploading…" : busy === "submit" ? "Submitting…" : "Submit entry"}
        </Button>
      </div>
    </div>
  );
}
