/**
 * File delivery / transfers (localStorage).
 *
 * Creators upload finished job files, pick the client/project, and optionally
 * mark the upload as a "delivery" — which surfaces in Projects and notifies the
 * client. Demo-only persistence; swap for object storage + a `delivery` table
 * and a real notification when ready.
 */

export type TransferFile = { name: string; size: number };

/** pending = watermarked previews only; accepted = full files + escrow released. */
export type DeliveryStatus = "pending" | "accepted";

export type Delivery = {
  id: string;
  client: string;
  projectId: string;
  projectTitle: string;
  files: TransferFile[];
  markedDelivery: boolean;
  note: string;
  value: number; // escrow amount released on acceptance
  status: DeliveryStatus;
  acceptedAt: number | null;
  createdAt: number;
};

const KEY = "grid:deliveries";

export function isVideoFile(name: string): boolean {
  return /\.(mp4|mov|avi|webm|mkv|m4v)$/i.test(name);
}

/** Mark a delivery accepted — unlocks full files and releases escrow. */
export function acceptDelivery(id: string): Delivery[] {
  const list = loadDeliveries().map((d) => (d.id === id ? { ...d, status: "accepted" as const, acceptedAt: Date.now() } : d));
  saveDeliveries(list);
  return list;
}

export function loadDeliveries(): Delivery[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as Partial<Delivery>[];
    // Normalize older records that predate the status/value fields.
    return raw.map((d) => ({ value: 0, status: "pending" as DeliveryStatus, acceptedAt: null, ...d })) as Delivery[];
  } catch {
    return [];
  }
}

export function saveDeliveries(list: Delivery[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function relativeTime(ts: number): string {
  const mins = Math.floor((Date.now() - ts) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
