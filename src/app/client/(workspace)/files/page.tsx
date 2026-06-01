"use client";

import { useMemo, useState } from "react";
import {
  SectionTitle,
  Panel,
  MetricCard,
  StatusBadge,
  FileUploadZone,
  ProgressBar,
  FeatureTag,
  DemoModeNotice,
} from "@/components/client/ui";
import { Button } from "@/components/dashboard/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { useClient } from "@/components/client/client-context";
import { useLocalState } from "@/components/client/use-local-state";
import { CLIENT_KEYS } from "@/lib/client/config";
import {
  MOCK_FILES,
  STORAGE_USED_GB,
  STORAGE_TOTAL_GB,
  type ClientFile,
} from "@/lib/client/mock";

/* ------------------------------------------------------------------ types -- */

type FileType = ClientFile["type"];
type TypeFilter = "all" | FileType;

const TYPE_META: Record<FileType, { icon: IconName; tone: "cyan" | "purple" | "gold" | "green"; label: string }> = {
  image: { icon: "camera", tone: "cyan", label: "Image" },
  video: { icon: "video", tone: "purple", label: "Video" },
  doc: { icon: "file", tone: "gold", label: "Doc" },
  audio: { icon: "play", tone: "green", label: "Audio" },
};

const TYPE_FILTERS: { id: TypeFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "image", label: "Image" },
  { id: "video", label: "Video" },
  { id: "doc", label: "Doc" },
  { id: "audio", label: "Audio" },
];

const DEFAULT_FOLDERS = ["Brand", "Hotel Launch", "Spring 2026"];

/* ------------------------------------------------------------- file row UI -- */

function FileRow({
  file,
  onToggleShare,
  onDelete,
}: {
  file: ClientFile;
  onToggleShare: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = TYPE_META[file.type];
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.02] p-3 transition-colors hover:bg-white/[0.05] sm:flex-nowrap">
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ${
          meta.tone === "cyan"
            ? "text-aerial-cyan"
            : meta.tone === "purple"
              ? "text-ai-purple"
              : meta.tone === "gold"
                ? "text-review-gold"
                : "text-escrow-green"
        }`}
      >
        <Icon name={meta.icon} size={18} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-white">{file.name}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-white/45">
          <span>{file.size}</span>
          <span className="text-white/20">•</span>
          <span className="truncate">{file.project}</span>
          <span className="text-white/20">•</span>
          <span>{file.date}</span>
        </div>
      </div>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        {file.shared && <StatusBadge label="Shared" tone="green" />}
        <button
          type="button"
          onClick={() => onToggleShare(file.id)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.09]"
        >
          <Icon name={file.shared ? "lock" : "send"} size={13} />
          {file.shared ? "Unshare" : "Share"}
        </button>
        <button
          type="button"
          onClick={() => onDelete(file.id)}
          aria-label={`Delete ${file.name}`}
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.04] p-2 text-white/55 transition-colors hover:border-urgent-red/30 hover:bg-urgent-red/10 hover:text-urgent-red"
        >
          <Icon name="x" size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- page -- */

export default function FilesPage() {
  const { toast } = useClient();
  const [files, setFiles] = useLocalState<ClientFile[]>(CLIENT_KEYS.files, MOCK_FILES);

  const [folders, setFolders] = useState<string[]>(DEFAULT_FOLDERS);
  const [folderInput, setFolderInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [addedCount, setAddedCount] = useState(0);

  /* ----------------------------------------------------------- handlers -- */

  const handleUpload = () => {
    const next = addedCount + 1;
    const newFile: ClientFile = {
      id: crypto.randomUUID(),
      name: `upload-${next}.jpg`,
      type: "image",
      size: "1.2 GB",
      project: "Uploads",
      date: "2026-06-11",
      shared: false,
    };
    setFiles((prev) => [newFile, ...prev]);
    setAddedCount(next);
    toast("File uploaded");
  };

  const handleAddFolder = () => {
    const name = folderInput.trim();
    if (!name) {
      toast("Enter a folder name");
      return;
    }
    if (folders.some((f) => f.toLowerCase() === name.toLowerCase())) {
      toast("Folder already exists");
      setFolderInput("");
      return;
    }
    setFolders((prev) => [...prev, name]);
    setFolderInput("");
    toast("Folder created");
  };

  const handleToggleShare = (id: string) => {
    let nowShared = false;
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        nowShared = !f.shared;
        return { ...f, shared: nowShared };
      }),
    );
    toast(nowShared ? "File shared" : "Sharing turned off");
  };

  const handleDelete = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    toast("File deleted");
  };

  /* -------------------------------------------------------------- derived -- */

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return files.filter((f) => {
      const matchesType = typeFilter === "all" || f.type === typeFilter;
      const matchesQuery = q === "" || f.name.toLowerCase().includes(q);
      return matchesType && matchesQuery;
    });
  }, [files, search, typeFilter]);

  const sharedFiles = useMemo(() => filtered.filter((f) => f.shared), [filtered]);
  const brandFiles = useMemo(() => filtered.filter((f) => f.project === "Brand"), [filtered]);

  // Storage grows ~0.6 GB per uploaded file in the demo.
  const usedGb = STORAGE_USED_GB + addedCount * 0.6;
  const usedPct = (usedGb / STORAGE_TOTAL_GB) * 100;
  const storageTone =
    usedPct > 90 ? "bg-urgent-red" : usedPct > 70 ? "bg-review-gold" : "bg-grid-blue";

  const typeCounts = useMemo(() => {
    const c = { image: 0, video: 0, doc: 0, audio: 0 } as Record<FileType, number>;
    for (const f of files) c[f.type] += 1;
    return c;
  }, [files]);

  /* ----------------------------------------------------------------- render -- */

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Files</h1>
            <FeatureTag feature="files" />
          </div>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            Upload, organise and share project deliverables, raw footage and brand assets in one place.
          </p>
        </div>
        <DemoModeNotice />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Total files" value={String(files.length)} icon="folder" accent="text-aerial-cyan" />
        <MetricCard label="Shared" value={String(files.filter((f) => f.shared).length)} icon="send" accent="text-escrow-green" />
        <MetricCard label="Folders" value={String(folders.length)} icon="layout" accent="text-review-gold" />
        <MetricCard
          label="Storage used"
          value={`${usedGb.toFixed(0)} GB`}
          sub={`of ${STORAGE_TOTAL_GB} GB`}
          icon="chart"
          accent="text-ai-purple"
        />
      </div>

      {/* Upload + storage */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <SectionTitle title="Upload" subtitle="Drag & drop or click — demo adds a sample file." />
          <FileUploadZone onAdd={handleUpload} />
        </Panel>

        <Panel className="lg:col-span-2">
          <SectionTitle title="Storage" />
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-semibold tracking-tight text-white">{usedGb.toFixed(1)} GB</span>
            <span className="text-xs text-white/45">of {STORAGE_TOTAL_GB} GB</span>
          </div>
          <div className="mt-3">
            <ProgressBar value={usedPct} tone={storageTone} />
          </div>
          <p className="mt-2 text-xs text-white/45">{(100 - usedPct).toFixed(0)}% free on the Enterprise plan.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {(Object.keys(TYPE_META) as FileType[]).map((t) => (
              <div key={t} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
                <span className="flex items-center gap-1.5 text-xs text-white/55">
                  <Icon name={TYPE_META[t].icon} size={13} />
                  {TYPE_META[t].label}
                </span>
                <span className="text-xs font-semibold text-white/80">{typeCounts[t]}</span>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* Folders */}
      <Panel>
        <SectionTitle title="Folders" subtitle="Group files by campaign, client or season." />
        <div className="flex flex-wrap gap-2">
          {folders.map((f) => (
            <span
              key={f}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3.5 py-2 text-sm text-white/80 transition-colors hover:bg-white/[0.07]"
            >
              <Icon name="folder" size={15} className="text-review-gold" />
              {f}
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={folderInput}
            onChange={(e) => setFolderInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAddFolder();
            }}
            placeholder="New folder name…"
            className="w-full rounded-full border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-grid-blue/40 focus:outline-none sm:max-w-xs"
          />
          <Button tone="blue" onClick={handleAddFolder}>
            <Icon name="plus" size={15} />
            New folder
          </Button>
        </div>
      </Panel>

      {/* Search + filter */}
      <Panel>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <Icon name="search" size={16} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files by name…"
              className="w-full rounded-full border border-white/12 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/35 focus:border-grid-blue/40 focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {TYPE_FILTERS.map((t) => {
              const active = typeFilter === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTypeFilter(t.id)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                    active
                      ? "bg-white text-grid-black"
                      : "border border-white/12 bg-white/[0.03] text-white/65 hover:bg-white/[0.08]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </Panel>

      {/* Recent uploads */}
      <Panel>
        <SectionTitle
          title="Recent uploads"
          subtitle={`${filtered.length} file${filtered.length === 1 ? "" : "s"}${
            search || typeFilter !== "all" ? " match your filters" : ""
          }`}
        />
        <div className="overflow-x-auto">
          <div className="flex min-w-[34rem] flex-col gap-2 sm:min-w-0">
            {filtered.length > 0 ? (
              filtered.map((f) => (
                <FileRow key={f.id} file={f} onToggleShare={handleToggleShare} onDelete={handleDelete} />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 px-6 py-12 text-center">
                <Icon name="folder" size={22} className="text-white/30" />
                <p className="text-sm text-white/55">No files match your search.</p>
              </div>
            )}
          </div>
        </div>
      </Panel>

      {/* Shared files */}
      <Panel>
        <SectionTitle title="Shared files" subtitle="Visible to creatives and external collaborators." />
        <div className="overflow-x-auto">
          <div className="flex min-w-[34rem] flex-col gap-2 sm:min-w-0">
            {sharedFiles.length > 0 ? (
              sharedFiles.map((f) => (
                <FileRow key={f.id} file={f} onToggleShare={handleToggleShare} onDelete={handleDelete} />
              ))
            ) : (
              <p className="px-1 py-6 text-center text-sm text-white/45">No files are shared yet.</p>
            )}
          </div>
        </div>
      </Panel>

      {/* Brand assets */}
      <Panel>
        <SectionTitle title="Brand assets" subtitle="Logos, guidelines and core brand files." />
        <div className="overflow-x-auto">
          <div className="flex min-w-[34rem] flex-col gap-2 sm:min-w-0">
            {brandFiles.length > 0 ? (
              brandFiles.map((f) => (
                <FileRow key={f.id} file={f} onToggleShare={handleToggleShare} onDelete={handleDelete} />
              ))
            ) : (
              <p className="px-1 py-6 text-center text-sm text-white/45">No brand files match your filters.</p>
            )}
          </div>
        </div>
      </Panel>
    </div>
  );
}
