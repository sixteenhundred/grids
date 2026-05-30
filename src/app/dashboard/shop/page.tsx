"use client";

import { PageHeader, Surface, Button, Icon } from "@/components/dashboard/ui";
import { ProductCard } from "@/components/dashboard/cards";
import { PRODUCTS } from "@/lib/grid-data";

export default function ShopPage() {
  return (
    <div className="flex flex-col gap-10">
      <div className="rise">
        <PageHeader
          eyebrow="Grid Shop"
          tone="purple"
          title="Sell what you use."
          subtitle="Presets, LUTs and templates from creators."
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>

      <div className="rise" style={{ animationDelay: "120ms" }}>
        <Surface radius="2rem" inner="p-6 sm:p-8">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ai-purple/12 text-ai-purple ring-1 ring-ai-purple/25">
                <Icon name="sparkles" size={22} />
              </span>
              <div>
                <h3 className="font-semibold text-white">Sell your own presets &amp; LUTs</h3>
                <p className="mt-1 max-w-xl text-sm text-white/55">
                  Turn the looks you already use into income. Package your color grades, presets and templates and earn from every download.
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <Button tone="purple" arrow onClick={() => {}}>
                List a product
              </Button>
            </div>
          </div>
        </Surface>
      </div>
    </div>
  );
}
