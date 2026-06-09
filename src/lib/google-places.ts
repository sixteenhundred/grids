"use client";

/**
 * Minimal Google Places Autocomplete loader (client-only). Used by the location
 * "Other" field so a user can type ANY place on Google Maps and we resolve its
 * coordinates for radius filtering. Loaded lazily and ONLY when a Maps key is
 * configured — the search works without it (featured cities + free text).
 * Narrowly typed (no `any`) so it stays build-safe.
 */

export type ResolvedPlace = { address: string; lat: number; lng: number };

interface GLatLng {
  lat(): number;
  lng(): number;
}
interface GPlace {
  formatted_address?: string;
  geometry?: { location?: GLatLng };
}
interface GAutocomplete {
  addListener(event: string, cb: () => void): void;
  getPlace(): GPlace;
}
interface GPlacesNamespace {
  Autocomplete: new (el: HTMLInputElement, opts?: { types?: string[] }) => GAutocomplete;
}
interface GWindow {
  google?: { maps?: { places?: GPlacesNamespace } };
}

let loadPromise: Promise<boolean> | null = null;

function loadScript(key: string): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  const w = window as unknown as GWindow;
  if (w.google?.maps?.places) return Promise.resolve(true);
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
  return loadPromise;
}

/** Attach autocomplete to an input; calls `onPlace` with resolved coords. Returns false if unavailable. */
export async function attachPlacesAutocomplete(
  input: HTMLInputElement,
  key: string,
  onPlace: (p: ResolvedPlace) => void,
): Promise<boolean> {
  const ok = await loadScript(key);
  if (!ok) return false;
  const places = (window as unknown as GWindow).google?.maps?.places;
  if (!places) return false;
  try {
    const ac = new places.Autocomplete(input, { types: ["(regions)"] });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const loc = place?.geometry?.location;
      if (loc) onPlace({ address: place.formatted_address ?? input.value, lat: loc.lat(), lng: loc.lng() });
    });
    return true;
  } catch {
    return false;
  }
}
