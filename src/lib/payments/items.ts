import "server-only";

/**
 * Payable-item resolver — the SERVER-SIDE source of truth for what a payment is
 * worth. Given (itemType, itemId) it returns the price (minor units), currency,
 * and the creator who should be paid. The client never supplies the amount; this
 * is the only place a price enters the payment pipeline.
 *
 * Item-agnostic by design: `product` is wired today; academy / package / booking
 * / contract slot in here later WITHOUT any schema change.
 *
 * NOTE: GRID stores prices as WHOLE currency units (e.g. €25). We convert to
 * minor units (×100) here so the rest of the pipeline is cents end-to-end.
 */
import { eq } from "drizzle-orm";
import { db } from "../db";
import { product } from "../db/schema";

export type ResolvedItem = {
  itemType: string;
  itemId: string;
  priceMinor: number;
  currency: string;
  creatorId: string | null;
  name: string;
};

export async function resolvePayableItem(itemType: string, itemId: string): Promise<ResolvedItem | null> {
  switch (itemType) {
    case "product": {
      const p = await db.select().from(product).where(eq(product.id, itemId)).limit(1).then((r) => r[0]);
      if (!p) return null;
      return {
        itemType,
        itemId,
        priceMinor: Math.round((p.price ?? 0) * 100),
        currency: "eur",
        creatorId: p.userId,
        name: p.title,
      };
    }
    // case "academy": … case "package": … case "booking": … (future)
    default:
      return null;
  }
}
