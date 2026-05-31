"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader, Surface, Card, MediaTile, StatusPill, Icon, Button } from "@/components/dashboard/ui";
import { ShopLogo } from "@/components/dashboard/storefront";
import { BuyProductSheet } from "@/components/dashboard/buy-sheet";
import { useSheet } from "@/components/dashboard/sheet";
import { money } from "@/lib/grid-data";
import type { ShopProduct, ShopSummary } from "@/lib/shop";
import { listProducts, listShops, listMyPurchases } from "@/lib/shop-actions";

function BuyerCard({ product, owned, onOpen }: { product: ShopProduct; owned: boolean; onOpen: () => void }) {
  return (
    <Card hover className="overflow-hidden">
      <button type="button" onClick={onOpen} className="block w-full text-left">
        <MediaTile tile={product.coverTile} image={product.coverImage} ratio="4 / 3" rounded="rounded-t-3xl">
          <span className="absolute left-3 top-3">
            <StatusPill tone="purple">{product.type}</StatusPill>
          </span>
          {owned && (
            <span className="absolute right-3 top-3">
              <StatusPill tone="escrow">Owned</StatusPill>
            </span>
          )}
        </MediaTile>
        <div className="p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="min-w-0 truncate text-sm font-medium text-white">{product.title}</h3>
            <span className="shrink-0 font-semibold text-white">{money(product.price)}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-white/45">{product.shopName}</p>
        </div>
      </button>
    </Card>
  );
}

export default function BrowseShopsPage() {
  const { open } = useSheet();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [shops, setShops] = useState<ShopSummary[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listProducts(), listShops(), listMyPurchases()]).then(([p, s, mine]) => {
      setProducts(p);
      setShops(s);
      setOwned(new Set(mine));
      setLoading(false);
    });
  }, []);

  const markOwned = (id: string) => setOwned((prev) => new Set(prev).add(id));
  const openBuy = (p: ShopProduct) => open(<BuyProductSheet product={p} owned={owned.has(p.id)} onPurchased={markOwned} />);

  return (
    <div className="flex flex-col gap-10">
      <div className="rise flex items-end justify-between gap-4">
        <PageHeader eyebrow="Grid Shop" tone="purple" title="Browse the shop." subtitle="Presets, LUTs, templates and packs from Grid creators." />
        <Button variant="ghost" href="/dashboard/shop">
          <Icon name="shop" size={15} /> My shop
        </Button>
      </div>

      {loading ? (
        <Surface radius="2rem" inner="p-10">
          <p className="text-center text-sm text-white/45">Loading the shop…</p>
        </Surface>
      ) : (
        <>
          {/* Shop directory */}
          {shops.length > 0 && (
            <div className="rise" style={{ animationDelay: "60ms" }}>
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">Shops</h2>
              <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 no-scrollbar">
                {shops.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/shop/${s.id}`}
                    className="flex w-56 shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                  >
                    <ShopLogo config={{ name: s.name, description: s.description, logo: s.logo, banner: s.banner }} size={44} />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{s.name}</div>
                      <div className="text-xs text-white/45">{s.productCount} {s.productCount === 1 ? "product" : "products"}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All products */}
          <div className="rise" style={{ animationDelay: "120ms" }}>
            <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">
              All products <span className="ml-1 text-sm font-normal text-white/40">{products.length}</span>
            </h2>
            {products.length === 0 ? (
              <Surface radius="2rem" inner="p-10">
                <p className="text-center text-sm text-white/55">No products listed yet.</p>
              </Surface>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <BuyerCard key={p.id} product={p} owned={owned.has(p.id)} onOpen={() => openBuy(p)} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
