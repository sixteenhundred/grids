"use client";

import type { ReactNode } from "react";
import { Surface, Card, MediaTile, StatusPill } from "./ui";
import { money } from "@/lib/grid-data";
import type { ShopConfig, ShopProduct } from "@/lib/shop";

/** Minimal brand shape shared by shops and academies. */
type Brandable = { name: string; description: string; logo: string | null; banner: string | null };

/* Circular logo — uploaded image or initial fallback. */
export function ShopLogo({ config, size }: { config: Brandable; size: number }) {
  const initial = config.name.trim().charAt(0).toUpperCase() || "S";
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-ai-purple/15 text-ai-purple ring-1 ring-white/10"
      style={{ height: size, width: size, fontSize: size * 0.4 }}
    >
      {config.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={config.logo} alt={config.name} className="h-full w-full object-cover" />
      ) : (
        <span className="font-semibold">{initial}</span>
      )}
    </span>
  );
}

export function ProductTile({ product, onOpen }: { product: ShopProduct; onOpen: () => void }) {
  return (
    <Card hover className="overflow-hidden">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <MediaTile tile={product.coverTile} image={product.coverImage} ratio="4 / 3" rounded="rounded-t-3xl">
          <span className="absolute left-3 top-3">
            <StatusPill tone="purple">{product.type}</StatusPill>
          </span>
        </MediaTile>
        <div className="flex items-center justify-between gap-3 p-4">
          <h3 className="min-w-0 truncate text-sm font-medium text-white">{product.title}</h3>
          <span className="shrink-0 font-semibold text-white">{money(product.price)}</span>
        </div>
      </button>
    </Card>
  );
}

export function ProductRow({ product, onOpen }: { product: ShopProduct; onOpen: () => void }) {
  return (
    <Card className="p-0">
      <button type="button" onClick={onOpen} className="flex w-full items-center gap-4 rounded-[inherit] p-3 text-left transition-colors hover:bg-white/[0.04]">
        <MediaTile tile={product.coverTile} image={product.coverImage} rounded="rounded-xl" className="h-16 w-16 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-medium text-white">{product.title}</h3>
            <StatusPill tone="purple">{product.type}</StatusPill>
          </div>
          {product.description && <p className="mt-0.5 truncate text-xs text-white/45">{product.description}</p>}
        </div>
        <span className="shrink-0 font-semibold text-white">{money(product.price)}</span>
      </button>
    </Card>
  );
}

/* Arranges products by the shop's chosen layout. */
export function ProductLayout({
  layout,
  products,
  onOpen,
}: {
  layout: ShopConfig["layout"];
  products: ShopProduct[];
  onOpen: (p: ShopProduct) => void;
}) {
  if (layout === "list")
    return (
      <div className="flex flex-col gap-3">
        {products.map((p) => (
          <ProductRow key={p.id} product={p} onOpen={() => onOpen(p)} />
        ))}
      </div>
    );

  if (layout === "spotlight") {
    const [hero, ...rest] = products;
    return (
      <div className="flex flex-col gap-3">
        <Card hover className="overflow-hidden">
          <button type="button" onClick={() => onOpen(hero)} className="block w-full text-left sm:flex">
            <MediaTile
              tile={hero.coverTile}
              image={hero.coverImage}
              ratio="16 / 9"
              rounded="rounded-t-3xl sm:rounded-l-3xl sm:rounded-tr-none"
              className="sm:w-1/2"
            >
              <span className="absolute left-3 top-3">
                <StatusPill tone="purple">{hero.type}</StatusPill>
              </span>
            </MediaTile>
            <div className="flex flex-1 flex-col justify-center gap-2 p-6">
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-ai-purple">Latest drop</span>
              <h3 className="text-xl font-semibold tracking-tight text-white">{hero.title}</h3>
              {hero.description && <p className="text-sm leading-relaxed text-white/55">{hero.description}</p>}
              <span className="mt-1 text-lg font-semibold text-white">{money(hero.price)}</span>
            </div>
          </button>
        </Card>
        {rest.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <ProductTile key={p.id} product={p} onOpen={() => onOpen(p)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((p) => (
        <ProductTile key={p.id} product={p} onOpen={() => onOpen(p)} />
      ))}
    </div>
  );
}

/* Banner + logo + name/description, with a slot for header actions. */
export function StorefrontHeader({ config, actions }: { config: Brandable; actions?: ReactNode }) {
  return (
    <Surface radius="2rem" inner="p-0">
      <div className="relative overflow-hidden rounded-t-[2rem]">
        <MediaTile tile={{ title: config.name, from: "#2a2438", to: "#0d0a12" }} image={config.banner} ratio="4 / 1" rounded="rounded-t-[2rem]" />
      </div>
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-end gap-4">
          <div className="-mt-12 sm:-mt-14">
            <ShopLogo config={config} size={72} />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-white">{config.name}</h1>
            <p className="mt-1 max-w-md text-sm text-white/55">{config.description}</p>
          </div>
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div>}
      </div>
    </Surface>
  );
}
