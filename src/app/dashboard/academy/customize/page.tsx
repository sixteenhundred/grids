"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader, Surface, Button } from "@/components/dashboard/ui";
import { ImageUpload } from "@/components/dashboard/academy-ui";
import { DEFAULT_ACADEMY, type AcademyConfig } from "@/lib/academy";
import { getMyAcademy, updateAcademyConfig } from "@/lib/academy-actions";

export default function CustomizeAcademyPage() {
  const router = useRouter();
  const [config, setConfig] = useState<AcademyConfig>(DEFAULT_ACADEMY);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getMyAcademy().then(({ config }) => setConfig(config));
  }, []);

  const set = <K extends keyof AcademyConfig>(key: K, value: AcademyConfig[K]) => setConfig((c) => ({ ...c, [key]: value }));

  async function save() {
    setSaving(true);
    await updateAcademyConfig(config);
    router.push("/dashboard/academy");
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader eyebrow="Grid Academy" tone="gold" title="Customize your academy." subtitle="Your school — logo, banner, name and story." />
      </div>

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
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Academy name</label>
              <input
                value={config.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. John Hope Academy"
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-review-gold/50"
              />
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Description</label>
            <textarea
              value={config.description}
              onChange={(e) => set("description", e.target.value)}
              rows={3}
              placeholder="What you teach and who it's for."
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-review-gold/50"
            />
          </div>
        </Surface>
      </div>

      <div className="rise" style={{ animationDelay: "90ms" }}>
        <Surface radius="2rem" inner="p-6">
          <h2 className="text-sm font-semibold text-white">Pricing</h2>
          <p className="mt-1 text-sm text-white/55">Charge once for full access to every course — or leave it at 0 to keep your academy free.</p>
          <label className="mb-2 mt-5 block text-xs uppercase tracking-[0.14em] text-white/45">Access price (€)</label>
          <input
            type="number"
            min={0}
            value={config.price}
            onChange={(e) => set("price", Math.max(0, Math.round(Number(e.target.value) || 0)))}
            className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-review-gold/50"
          />
          <p className="mt-2 text-xs text-white/40">{config.price > 0 ? `Learners pay €${config.price} once to unlock all courses.` : "Free — anyone can take your courses."}</p>
        </Surface>
      </div>

      <div className="rise flex items-center gap-3" style={{ animationDelay: "120ms" }}>
        <Button tone="gold" arrow onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save academy"}
        </Button>
        <Button variant="ghost" href="/dashboard/academy">
          Cancel
        </Button>
      </div>
    </div>
  );
}
