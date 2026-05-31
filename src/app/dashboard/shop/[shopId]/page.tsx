"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Surface, Card, Button, Icon } from "@/components/dashboard/ui";
import { StorefrontHeader, ProductLayout } from "@/components/dashboard/storefront";
import { BuyProductSheet } from "@/components/dashboard/buy-sheet";
import { useSheet } from "@/components/dashboard/sheet";
import { DEFAULT_CONFIG, type ShopConfig, type ShopProduct } from "@/lib/shop";
import { getShopById, listMyPurchases } from "@/lib/shop-actions";

export default function ShopStorefrontPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const { open } = useSheet();
  const [config, setConfig] = useState<ShopConfig | null>(null);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [state, setState] = useState<"loading" | "ready" | "missing">("loading");

  useEffect(() => {
    Promise.all([getShopById(shopId), listMyPurchases()]).then(([shop, mine]) => {
      if (!shop) {
        setState("missing");
        return;
      }
      setConfig(shop.config);
      setProducts(shop.products);
      setOwned(new Set(mine));
      setState("ready");
    });
  }, [shopId]);

  const markOwned = (id: string) => setOwned((prev) => new Set(prev).add(id));
  const openBuy = (p: ShopProduct) => open(<BuyProductSheet product={p} owned={owned.has(p.id)} onPurchased={markOwned} />);

  if (state === "missing") {
    return (
      <div className="rise flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-sm p-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight text-white">Shop not found</h1>
          <p className="mt-2 text-sm text-white/55">This shop may have been removed.</p>
          <div className="mt-6">
            <Button href="/dashboard/shop/browse" arrow>
              Browse shops
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (state === "loading" || !config) {
    return (
      <Surface radius="2rem" inner="p-10">
        <p className="text-center text-sm text-white/45">Loading shop…</p>
      </Surface>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <StorefrontHeader
          config={config}
          actions={
            <Button variant="ghost" href="/dashboard/shop/browse">
              <Icon name="shop" size={15} /> All shops
            </Button>
          }
        />
      </div>

      <div className="rise" style={{ animationDelay: "80ms" }}>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">
          Products <span className="ml-1 text-sm font-normal text-white/40">{products.length}</span>
        </h2>
        {products.length === 0 ? (
          <Surface radius="2rem" inner="p-10">
            <p className="text-center text-sm text-white/55">This shop hasn’t listed any products yet.</p>
          </Surface>
        ) : (
          <ProductLayout layout={config.layout} products={products} onOpen={openBuy} />
        )}
      </div>
    </div>
  );
}
