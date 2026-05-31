/**
 * Grid Shop — shared types + browser helpers.
 *
 * Persistence now lives in the database (see `shop-actions.ts`). This module
 * holds the types both client and server share, plus client-only helpers
 * (image downscaling, formatting). Product files are still captured as
 * metadata only — wire a blob store into `createProduct` to store the bytes.
 */

import type { Tile } from "./grid-data";

export type ShopLayout = "grid" | "spotlight" | "list";

export type ProductKind = "LUT" | "Preset" | "Template" | "Pack" | "Photo";

export const PRODUCT_KINDS: ProductKind[] = ["LUT", "Preset", "Template", "Pack", "Photo"];

export type ShopConfig = {
  name: string;
  description: string;
  logo: string | null; // data URL
  banner: string | null; // data URL
  layout: ShopLayout;
};

/** A product as rendered in the UI (gradient fallback resolved from `type`). */
export type ShopProduct = {
  id: string;
  shopId: string;
  shopName: string;
  title: string;
  description: string;
  price: number;
  type: ProductKind;
  coverImage: string | null;
  coverTile: Tile;
  fileName: string | null;
  fileSize: number | null;
  createdAt: number;
};

/** Fields supplied when creating a product (server assigns id/createdAt). */
export type NewProduct = {
  title: string;
  description: string;
  price: number;
  type: ProductKind;
  coverImage: string | null;
  fileName: string | null;
  fileSize: number | null;
};

/** A shop in the buyer-facing directory. */
export type ShopSummary = {
  id: string;
  name: string;
  description: string;
  logo: string | null;
  banner: string | null;
  layout: ShopLayout;
  productCount: number;
};

export const LAYOUTS: { key: ShopLayout; label: string; desc: string }[] = [
  { key: "grid", label: "Grid", desc: "Even gallery — every product equal." },
  { key: "spotlight", label: "Spotlight", desc: "Hero your newest drop, rest below." },
  { key: "list", label: "List", desc: "Compact rows — fast to scan." },
];

const TYPE_TILE: Record<ProductKind, Tile> = {
  LUT: { title: "LUT", from: "#3a2a1a", to: "#0f0a06" },
  Preset: { title: "Preset", from: "#3a2438", to: "#0d0a10" },
  Template: { title: "Template", from: "#1f3350", to: "#090c12" },
  Pack: { title: "Pack", from: "#24323a", to: "#080f12" },
  Photo: { title: "Photo", from: "#2a2a3a", to: "#0a0a10" },
};

export function tileForType(type: ProductKind): Tile {
  return TYPE_TILE[type] ?? TYPE_TILE.Preset;
}

export const DEFAULT_CONFIG: ShopConfig = {
  name: "Your Shop",
  description: "Presets, LUTs and templates I use on real shoots.",
  logo: null,
  banner: null,
  layout: "grid",
};

/** Seeded into a shop when it's first created, so it isn't empty. */
export const SEED_PRODUCTS: NewProduct[] = [
  {
    title: "LA Warm Real-Estate LUT",
    description: "My go-to warm grade for interiors and golden-hour exteriors. Drop it on any clip.",
    price: 39,
    type: "LUT",
    coverImage: null,
    fileName: "la-warm-realestate.cube",
    fileSize: 41_000,
  },
  {
    title: "Twilight Exterior Preset Pack",
    description: "12 Lightroom presets tuned for blue-hour and twilight property exteriors.",
    price: 29,
    type: "Preset",
    coverImage: null,
    fileName: "twilight-exteriors.zip",
    fileSize: 2_400_000,
  },
  {
    title: "Listing Delivery Template",
    description: "A clean Premiere + Resolve delivery template for property films.",
    price: 19,
    type: "Template",
    coverImage: null,
    fileName: "listing-delivery.prproj",
    fileSize: 880_000,
  },
];

/* -------------------------------------------------------------------------- */
/*  Browser helpers                                                            */
/* -------------------------------------------------------------------------- */

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Read an image file, downscale to `maxDim`, return a compact JPEG data URL. */
export function fileToImageDataUrl(file: File, maxDim = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read image"));
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unsupported"));
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
