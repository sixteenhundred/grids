"use client";

import { useEffect, useRef, useState } from "react";
import { Surface, Button, Icon, MediaTile, StatusPill } from "@/components/dashboard/ui";
import { StorefrontHeader, ProductLayout } from "@/components/dashboard/storefront";
import { useSheet, SheetHeader } from "@/components/dashboard/sheet";
import { money } from "@/lib/grid-data";
import { fileToImageDataUrl, formatSize, tileForType, PRODUCT_KINDS, DEFAULT_CONFIG, type ShopConfig, type ShopProduct, type ProductKind } from "@/lib/shop";
import { getMyShop, createProduct, removeProduct } from "@/lib/shop-actions";

/* -------------------------------------------------------------------------- */
/*  Add product                                                                */
/* -------------------------------------------------------------------------- */

function AddProductSheet({ onAdd }: { onAdd: (p: ShopProduct) => Promise<void> }) {
  const { close } = useSheet();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(29);
  const [type, setType] = useState<ProductKind>("Preset");
  const [cover, setCover] = useState<string | null>(null);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const canSave = title.trim().length > 0 && file !== null && !saving;

  async function onCover(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) {
      try {
        setCover(await fileToImageDataUrl(f, 800));
      } catch {
        /* ignore */
      }
    }
  }
  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) setFile({ name: f.name, size: f.size });
  }

  async function submit() {
    setSaving(true);
    await onAdd({
      // id/shop fields are assigned server-side; locals satisfy the type.
      id: "", shopId: "", shopName: "",
      title: title.trim(),
      description: description.trim(),
      price: Math.max(0, Math.round(price)),
      type,
      coverImage: cover,
      coverTile: tileForType(type),
      fileName: file?.name ?? null,
      fileSize: file?.size ?? null,
      createdAt: Date.now(),
    });
    close();
  }

  return (
    <div>
      <SheetHeader title="Add a product" subtitle="It goes live in your shop right away." />

      <input ref={coverRef} type="file" accept="image/*" className="hidden" onChange={onCover} />
      <button
        type="button"
        onClick={() => coverRef.current?.click()}
        className="relative mb-4 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/[0.03] transition-colors hover:border-ai-purple/50 hover:bg-white/[0.05]"
      >
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="Cover" className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-white/45">
            <Icon name="camera" size={22} />
            <span className="text-xs">Add a cover image</span>
          </span>
        )}
      </button>

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Golden Hour LUT Pack"
        className="mb-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-ai-purple/50"
      />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Description</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        placeholder="What's inside and what it's for."
        className="mb-4 w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/35 focus:border-ai-purple/50"
      />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Type</label>
      <div className="mb-4 flex flex-wrap gap-2">
        {PRODUCT_KINDS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setType(k)}
            className={`rounded-full px-3.5 py-1.5 text-sm transition-colors ${type === k ? "bg-ai-purple text-white" : "bg-white/[0.05] text-white/60 hover:text-white"}`}
          >
            {k}
          </button>
        ))}
      </div>

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Price (€)</label>
      <input
        type="number"
        min={0}
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        className="mb-4 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-ai-purple/50"
      />

      <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-white/45">Product file</label>
      <input ref={fileRef} type="file" className="hidden" onChange={onFile} />
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3.5 text-left transition-colors hover:border-ai-purple/50 hover:bg-white/[0.05]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ai-purple/12 text-ai-purple ring-1 ring-ai-purple/25">
          <Icon name="upload" size={18} />
        </span>
        <span className="min-w-0">
          {file ? (
            <>
              <span className="block truncate text-sm text-white">{file.name}</span>
              <span className="block text-xs text-white/45">{formatSize(file.size)}</span>
            </>
          ) : (
            <span className="text-sm text-white/55">Upload the .cube, .zip, .xmp or folder</span>
          )}
        </span>
      </button>

      <div className="mt-6">
        <Button full tone="purple" arrow disabled={!canSave} onClick={submit}>
          {saving ? "Adding…" : "Add to shop"}
        </Button>
      </div>
    </div>
  );
}

function ProductSheet({ product, onDelete }: { product: ShopProduct; onDelete: (id: string) => Promise<void> }) {
  const { close } = useSheet();
  const [removing, setRemoving] = useState(false);
  return (
    <div>
      <MediaTile tile={product.coverTile} image={product.coverImage} ratio="4 / 3" rounded="rounded-2xl">
        <span className="absolute left-3 top-3">
          <StatusPill tone="purple">{product.type}</StatusPill>
        </span>
      </MediaTile>
      <div className="mt-5 flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-white">{product.title}</h2>
        <span className="shrink-0 text-lg font-semibold text-white">{money(product.price)}</span>
      </div>
      {product.description && <p className="mt-2 text-sm leading-relaxed text-white/65">{product.description}</p>}
      {product.fileName && (
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
          <Icon name="file" size={16} className="text-ai-purple" />
          <span className="min-w-0 flex-1 truncate text-sm text-white/80">{product.fileName}</span>
          {product.fileSize != null && <span className="shrink-0 text-xs text-white/45">{formatSize(product.fileSize)}</span>}
        </div>
      )}
      <div className="mt-7">
        <Button
          full
          variant="ghost"
          disabled={removing}
          onClick={async () => { setRemoving(true); await onDelete(product.id); close(); }}
          className="!text-urgent-red hover:!bg-urgent-red/10"
        >
          {removing ? "Removing…" : "Remove product"}
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function ShopPage() {
  const { open } = useSheet();
  const [config, setConfig] = useState<ShopConfig>(DEFAULT_CONFIG);
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyShop().then(({ config, products }) => {
      setConfig(config);
      setProducts(products);
      setLoading(false);
    });
  }, []);

  async function addProduct(draft: ShopProduct) {
    const saved = await createProduct({
      title: draft.title,
      description: draft.description,
      price: draft.price,
      type: draft.type,
      coverImage: draft.coverImage,
      fileName: draft.fileName,
      fileSize: draft.fileSize,
    });
    setProducts((prev) => [saved, ...prev]);
  }
  async function deleteProduct(id: string) {
    await removeProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }
  const openProduct = (p: ShopProduct) => open(<ProductSheet product={p} onDelete={deleteProduct} />);

  const addBtn = (
    <Button tone="purple" arrow onClick={() => open(<AddProductSheet onAdd={addProduct} />)}>
      Add product
    </Button>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="rise">
        <StorefrontHeader
          config={config}
          actions={
            <>
              <Button variant="ghost" href="/dashboard/shop/browse">
                <Icon name="shop" size={15} /> Browse shops
              </Button>
              <Button variant="ghost" href="/dashboard/shop/customize">
                <Icon name="layout" size={15} /> Customize shop
              </Button>
            </>
          }
        />
      </div>

      <div className="rise" style={{ animationDelay: "80ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Products <span className="ml-1 text-sm font-normal text-white/40">{products.length}</span>
          </h2>
          {products.length > 0 && addBtn}
        </div>

        {loading ? (
          <Surface radius="2rem" inner="p-10">
            <p className="text-center text-sm text-white/45">Loading your shop…</p>
          </Surface>
        ) : products.length === 0 ? (
          <Surface radius="2rem" inner="p-10">
            <div className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ai-purple/12 text-ai-purple ring-1 ring-ai-purple/25">
                <Icon name="shop" size={22} />
              </span>
              <p className="mt-4 text-sm text-white/55">No products yet. Upload your first preset, LUT or pack.</p>
              <div className="mt-5">{addBtn}</div>
            </div>
          </Surface>
        ) : (
          <ProductLayout layout={config.layout} products={products} onOpen={openProduct} />
        )}
      </div>
    </div>
  );
}
