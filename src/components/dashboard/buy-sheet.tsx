"use client";

import { useState } from "react";
import Link from "next/link";
import { useSheet } from "./sheet";
import { Button, Icon, MediaTile, StatusPill } from "./ui";
import { money } from "@/lib/grid-data";
import type { ShopProduct } from "@/lib/shop";
import { purchaseProduct } from "@/lib/shop-actions";

/**
 * Buyer checkout — mirrors the booking escrow language. Funds are "held" then
 * "released" on a mock timer, ending in an owned/download state.
 */
export function BuyProductSheet({
  product,
  owned,
  onPurchased,
}: {
  product: ShopProduct;
  owned: boolean;
  onPurchased: (id: string) => void;
}) {
  const { close } = useSheet();
  const [step, setStep] = useState<"view" | "paying" | "done">(owned ? "done" : "view");
  const fee = Math.round(product.price * 0.05);
  const total = product.price + fee;

  async function buy() {
    setStep("paying");
    try {
      await purchaseProduct(product.id);
      onPurchased(product.id);
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
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-white">You own this.</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-white/60">
          {product.title} is in your library. {product.fileName ?? "Your files"} is ready to download.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button full onClick={close}>
            <Icon name="upload" size={15} /> Download files
          </Button>
          <Link href={`/dashboard/shop/${product.shopId}`} onClick={close} className="text-sm font-medium text-white/50 transition-colors hover:text-white">
            View {product.shopName} →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <MediaTile tile={product.coverTile} image={product.coverImage} ratio="4 / 3" rounded="rounded-2xl">
        <span className="absolute left-3 top-3">
          <StatusPill tone="purple">{product.type}</StatusPill>
        </span>
      </MediaTile>

      <div className="mt-5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold tracking-tight text-white">{product.title}</h2>
          <Link href={`/dashboard/shop/${product.shopId}`} onClick={close} className="text-sm text-white/50 transition-colors hover:text-white">
            {product.shopName}
          </Link>
        </div>
        <span className="shrink-0 text-lg font-semibold text-white">{money(product.price)}</span>
      </div>

      {product.description && <p className="mt-2 text-sm leading-relaxed text-white/65">{product.description}</p>}

      <div className="mt-5 rounded-2xl border border-escrow-green/25 bg-escrow-green/[0.07] p-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-escrow-green/15 text-escrow-green ring-1 ring-escrow-green/30">
            <Icon name="shield" size={18} />
          </span>
          <div className="text-sm font-semibold text-white">Protected by Grid Escrow</div>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-white/55">Item</span>
          <span className="text-white/85">{money(product.price)}</span>
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
        <Button full tone="green" arrow disabled={step === "paying"} onClick={buy}>
          {step === "paying" ? "Securing payment…" : `Buy · ${money(total)}`}
        </Button>
      </div>
    </div>
  );
}
