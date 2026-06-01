"use client";

import { useMemo, useState } from "react";
import {
  SectionTitle,
  Panel,
  MetricCard,
  StatusBadge,
  FeatureTag,
  DemoModeNotice,
} from "@/components/client/ui";
import { Button } from "@/components/dashboard/ui";
import { Icon, type IconName } from "@/components/dashboard/icons";
import { useClient } from "@/components/client/client-context";
import { useLocalState } from "@/components/client/use-local-state";
import { CLIENT_KEYS } from "@/lib/client/config";
import { MOCK_ASSETS, ASSET_COLLECTIONS, type Asset } from "@/lib/client/mock";

/* ------------------------------------------------------------------ types -- */

type AssetType = Asset["type"];

const TYPE_META: Record<
  AssetType,
  { icon: IconName; label: string; text: string; bg: string }
> = {
  image: { icon: "camera", label: "Image", text: "text-aerial-cyan", bg: "bg-aerial-cyan/12" },
  video: { icon: "video", label: "Video", text: "text-ai-purple", bg: "bg-ai-purple/12" },
  doc: { icon: "file", label: "Document", text: "text-review-gold", bg: "bg-review-gold/12" },
  palette: { icon: "grid", label: "Palette", text: "text-escrow-green", bg: "bg-escrow-green/12" },
  font: { icon: "command", label: "Font", text: "text-grid-blue", bg: "bg-grid-blue/12" },
};

const ALL = "All";

/* --------------------------------------------------------------- asset card -- */

function AssetCard({
  asset,
  onShare,
  onDownload,
  onArchive,
}: {
  asset: Asset;
  onShare: (a: Asset) => void;
  onDownload: (a: Asset) => void;
  onArchive: (id: string) => void;
}) {
  const meta = TYPE_META[asset.type];
  return (
    <div
      className={`group flex flex-col rounded-3xl border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06] ${
        asset.archived ? "opacity-55" : ""
      }`}
    >
      {/* Preview block */}
      <div className="relative flex h-28 items-center justify-center overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02]">
        <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${meta.bg} ${meta.text}`}>
          <Icon name={meta.icon} size={24} />
        </span>
        <span className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 border-l border-t border-white/15" />
        <span className="pointer-events-none absolute bottom-2.5 right-2.5 h-3 w-3 border-b border-r border-white/15" />
        {asset.archived && (
          <span className="absolute right-2.5 top-2.5">
            <StatusBadge label="Archived" tone="gray" />
          </span>
        )}
      </div>

      {/* Meta */}
      <div className="mt-3.5 min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-white">{asset.name}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/45">
          <span className="inline-flex items-center gap-1">
            <Icon name={meta.icon} size={12} />
            {meta.label}
          </span>
          <span className="text-white/20">•</span>
          <span className="truncate">{asset.category}</span>
        </div>
        <div className="mt-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/65">
            <Icon name="folder" size={12} className="text-review-gold" />
            {asset.collection}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3.5 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onShare(asset)}
          aria-label={`Share ${asset.name}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.09]"
        >
          <Icon name="send" size={13} />
          Share
        </button>
        <button
          type="button"
          onClick={() => onDownload(asset)}
          aria-label={`Download ${asset.name}`}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-2.5 py-2 text-xs font-medium text-white/75 transition-colors hover:bg-white/[0.09]"
        >
          <Icon name="download" size={13} />
          Download
        </button>
        <button
          type="button"
          onClick={() => onArchive(asset.id)}
          disabled={asset.archived}
          aria-label={`Archive ${asset.name}`}
          className="inline-flex items-center justify-center rounded-full border border-white/12 bg-white/[0.04] p-2 text-white/55 transition-colors hover:border-review-gold/30 hover:bg-review-gold/10 hover:text-review-gold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon name="bookmark" size={14} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------- page -- */

export default function AssetLibraryPage() {
  const { toast } = useClient();
  const [assets, setAssets] = useLocalState<Asset[]>(CLIENT_KEYS.assets, MOCK_ASSETS);

  const [collections, setCollections] = useState<string[]>(ASSET_COLLECTIONS);
  const [collectionFilter, setCollectionFilter] = useState<string>(ALL);
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [collectionInput, setCollectionInput] = useState("");
  const [uploadCount, setUploadCount] = useState(0);

  /* ----------------------------------------------------------- handlers -- */

  // Upload targets the active collection (or the first one when "All").
  const targetCollection =
    collectionFilter !== ALL ? collectionFilter : collections[0] ?? "Uploads";

  const handleUpload = () => {
    const next = uploadCount + 1;
    const newAsset: Asset = {
      id: crypto.randomUUID(),
      name: `asset-${next}`,
      category: "Uploads",
      type: "image",
      collection: targetCollection,
    };
    setAssets((prev) => [newAsset, ...prev]);
    setUploadCount(next);
    toast("Asset uploaded");
  };

  const handleCreateCollection = () => {
    const name = collectionInput.trim();
    if (!name) {
      toast("Enter a collection name");
      return;
    }
    if (collections.some((c) => c.toLowerCase() === name.toLowerCase())) {
      toast("Collection already exists");
      setCollectionInput("");
      return;
    }
    setCollections((prev) => [...prev, name]);
    setCollectionFilter(name);
    setCollectionInput("");
    toast("Collection created");
  };

  const handleShare = (a: Asset) => {
    toast(`Share link copied — ${a.name}`);
  };

  const handleDownload = (a: Asset) => {
    toast(`Downloading ${a.name}`);
  };

  const handleArchive = (id: string) => {
    setAssets((prev) => prev.map((a) => (a.id === id ? { ...a, archived: true } : a)));
    toast("Asset archived");
  };

  /* -------------------------------------------------------------- derived -- */

  // Categories drawn from current assets (so newly-uploaded "Uploads" appears).
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const a of assets) set.add(a.category);
    return [ALL, ...Array.from(set).sort()];
  }, [assets]);

  // Keep the category chips valid if the selected one disappears.
  const activeCategory = categories.includes(categoryFilter) ? categoryFilter : ALL;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return assets.filter((a) => {
      const matchesCollection = collectionFilter === ALL || a.collection === collectionFilter;
      const matchesCategory = activeCategory === ALL || a.category === activeCategory;
      const matchesQuery = q === "" || a.name.toLowerCase().includes(q);
      return matchesCollection && matchesCategory && matchesQuery;
    });
  }, [assets, collectionFilter, activeCategory, search]);

  // Group the filtered assets by collection for the grouped view.
  const grouped = useMemo(() => {
    const order =
      collectionFilter === ALL ? collections : [collectionFilter];
    const groups = order
      .map((name) => ({ name, items: filtered.filter((a) => a.collection === name) }))
      .filter((g) => g.items.length > 0);
    // Catch assets whose collection isn't in the known list.
    const known = new Set(order);
    const orphans = filtered.filter((a) => !known.has(a.collection));
    if (orphans.length > 0) {
      const byName = new Map<string, Asset[]>();
      for (const a of orphans) {
        const arr = byName.get(a.collection) ?? [];
        arr.push(a);
        byName.set(a.collection, arr);
      }
      for (const [name, items] of byName) groups.push({ name, items });
    }
    return groups;
  }, [filtered, collections, collectionFilter]);

  const archivedCount = useMemo(() => assets.filter((a) => a.archived).length, [assets]);

  const hasFilters = collectionFilter !== ALL || activeCategory !== ALL || search.trim() !== "";

  /* ----------------------------------------------------------------- render -- */

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Asset Library</h1>
            <FeatureTag feature="asset-library" />
          </div>
          <p className="mt-2 max-w-xl text-sm text-white/55">
            A shared, company-wide home for brand assets, edited content and raw footage — organised into collections
            every department can reach.
          </p>
        </div>
        <DemoModeNotice />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label="Total assets" value={String(assets.length)} icon="grid" accent="text-aerial-cyan" />
        <MetricCard label="Collections" value={String(collections.length)} icon="folder" accent="text-review-gold" />
        <MetricCard
          label="Active"
          value={String(assets.length - archivedCount)}
          icon="verified"
          accent="text-escrow-green"
        />
        <MetricCard label="Archived" value={String(archivedCount)} icon="bookmark" accent="text-ai-purple" />
      </div>

      {/* Toolbar: upload + create collection + search */}
      <Panel>
        <SectionTitle
          title="Manage library"
          subtitle={`New uploads land in “${targetCollection}”. Create a collection to organise by campaign or department.`}
        />
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button tone="blue" onClick={handleUpload}>
              <Icon name="upload" size={15} />
              Upload Asset
            </Button>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <input
                value={collectionInput}
                onChange={(e) => setCollectionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateCollection();
                }}
                placeholder="New collection name…"
                className="w-full rounded-full border border-white/12 bg-white/[0.03] px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-grid-blue/40 focus:outline-none sm:max-w-xs"
              />
              <Button tone="green" onClick={handleCreateCollection}>
                <Icon name="plus" size={15} />
                Create Collection
              </Button>
            </div>
          </div>

          <div className="relative w-full lg:max-w-sm">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
              <Icon name="search" size={16} />
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets by name…"
              className="w-full rounded-full border border-white/12 bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/35 focus:border-grid-blue/40 focus:outline-none"
            />
          </div>
        </div>
      </Panel>

      {/* Filters */}
      <Panel>
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">Collection</div>
            <div className="flex flex-wrap gap-2">
              {[ALL, ...collections].map((c) => {
                const active = collectionFilter === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCollectionFilter(c)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-white text-grid-black"
                        : "border border-white/12 bg-white/[0.03] text-white/65 hover:bg-white/[0.08]"
                    }`}
                  >
                    {c !== ALL && <Icon name="folder" size={12} />}
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">Category</div>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const active = activeCategory === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategoryFilter(c)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-white text-grid-black"
                        : "border border-white/12 bg-white/[0.03] text-white/65 hover:bg-white/[0.08]"
                    }`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </Panel>

      {/* Grouped grid */}
      <div className="space-y-7">
        {grouped.length > 0 ? (
          grouped.map((group) => (
            <Panel key={group.name}>
              <SectionTitle
                title={group.name}
                subtitle={`${group.items.length} asset${group.items.length === 1 ? "" : "s"}`}
              />
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.items.map((a) => (
                  <AssetCard
                    key={a.id}
                    asset={a}
                    onShare={handleShare}
                    onDownload={handleDownload}
                    onArchive={handleArchive}
                  />
                ))}
              </div>
            </Panel>
          ))
        ) : (
          <Panel>
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/12 px-6 py-14 text-center">
              <Icon name="grid" size={24} className="text-white/30" />
              <p className="text-sm text-white/55">
                {hasFilters ? "No assets match your filters." : "No assets yet — upload one to get started."}
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setCollectionFilter(ALL);
                    setCategoryFilter(ALL);
                    setSearch("");
                  }}
                  className="mt-1 text-xs font-medium text-aerial-cyan transition-colors hover:text-white"
                >
                  Clear filters
                </button>
              )}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
