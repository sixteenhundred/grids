"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Surface, Button, Icon } from "@/components/dashboard/ui";
import { fileToImageDataUrl, LAYOUTS, DEFAULT_CONFIG, type ShopConfig, type ShopLayout } from "@/lib/shop";
import { getMyShop, updateShopConfig } from "@/lib/shop-actions";

/* Reusable image picker with live preview --------------------------------- */
function ImageUpload({
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
      /* ignore unreadable files */
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
        className={`relative flex w-full items-center justify-center overflow-hidden border border-dashed border-white/15 bg-white/[0.03] transition-colors hover:border-ai-purple/50 hover:bg-white/[0.05] ${rounded}`}
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

/* Mini wireframe shown inside each layout option --------------------------- */
function LayoutPreview({ layout }: { layout: ShopLayout }) {
  const block = "rounded-[3px] bg-white/15";
  if (layout === "grid")
    return (
      <div className="grid grid-cols-3 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className={`${block} h-4`} />
        ))}
      </div>
    );
  if (layout === "spotlight")
    return (
      <div className="flex flex-col gap-1">
        <span className={`${block} h-6`} />
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <span key={i} className={`${block} h-3`} />
          ))}
        </div>
      </div>
    );
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 3 }).map((_, i) => (
        <span key={i} className={`${block} h-3 w-full`} />
      ))}
    </div>
  );
}

export default function CustomizeShopPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ShopConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyShop().then(({ config }) => setConfig(config));
  }, []);

  const set = <K extends keyof ShopConfig>(key: K, value: ShopConfig[K]) => setConfig((c) => ({ ...c, [key]: value }));

  async function save() {
    setSaving(true);
    await updateShopConfig(config);
    router.push("/dashboard/shop");
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader eyebrow="Grid Shop" tone="purple" title="Customize your shop." subtitle="Your storefront — logo, banner, story and layout." />
      </div>

      {/* Branding */}
      <div className="rise" style={{ animationDelay: "60ms" }}>
        <Surface radius="2rem" inner="p-6">
          <h2 className="text-sm font-semibold text-white">Branding</h2>

          <div className="mt-5">
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Banner</label>
            <ImageUpload value={config.banner} onChange={(v) => set("banner", v)} maxDim={1200} rounded="rounded-2xl" ratio="3 / 1" icon="camera" label="Upload a banner" />
          </div>

          <div className="mt-6 flex items-end gap-5">
            <div className="w-28 shrink-0">
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Logo</label>
              <ImageUpload value={config.logo} onChange={(v) => set("logo", v)} maxDim={256} rounded="rounded-full" ratio="1 / 1" icon="user" label="Logo" />
            </div>
            <div className="flex-1">
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Shop name</label>
              <input
                value={config.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. John Hope Studio"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-ai-purple/50"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Description</label>
            <textarea
              value={config.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="Tell buyers what you make and who it's for."
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-ai-purple/50"
            />
          </div>
        </Surface>
      </div>

      {/* Layout */}
      <div className="rise" style={{ animationDelay: "120ms" }}>
        <Surface radius="2rem" inner="p-6">
          <h2 className="text-sm font-semibold text-white">Layout</h2>
          <p className="mt-1 text-sm text-white/55">How your products are arranged on the storefront.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {LAYOUTS.map((l) => {
              const active = config.layout === l.key;
              return (
                <button
                  key={l.key}
                  type="button"
                  onClick={() => set("layout", l.key)}
                  aria-pressed={active}
                  className={`rounded-2xl border p-4 text-left transition-all ${active ? "border-ai-purple/50 bg-ai-purple/10" : "border-white/10 bg-white/[0.03] hover:border-white/20"}`}
                >
                  <div className="rounded-xl bg-black/30 p-3">
                    <LayoutPreview layout={l.key} />
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{l.label}</span>
                    {active && <Icon name="check" size={16} className="text-ai-purple" />}
                  </div>
                  <p className="mt-1 text-xs leading-snug text-white/45">{l.desc}</p>
                </button>
              );
            })}
          </div>
        </Surface>
      </div>

      {/* Actions */}
      <div className="rise flex items-center gap-3" style={{ animationDelay: "180ms" }}>
        <Button tone="purple" arrow onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save shop"}
        </Button>
        <Button variant="ghost" href="/dashboard/shop">
          Cancel
        </Button>
      </div>
    </div>
  );
}
