/**
 * Lightweight geo helpers for location + radius filtering. Featured cities ship
 * with coordinates so radius works WITHOUT any external API; "Other" locations
 * resolve to coordinates via Google Places when a Maps key is configured.
 * Shared by every browse/discovery surface (landing + dashboard + client).
 */

export type GeoPoint = { lat: number; lng: number };

export const FEATURED_CITIES: { name: string; lat: number; lng: number }[] = [
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "New York", lat: 40.7128, lng: -74.006 },
  { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Oslo", lat: 59.9139, lng: 10.7522 },
  { name: "Stockholm", lat: 59.3293, lng: 18.0686 },
  { name: "Copenhagen", lat: 55.6761, lng: 12.5683 },
  { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
  { name: "Barcelona", lat: 41.3874, lng: 2.1686 },
  { name: "Dubai", lat: 25.2048, lng: 55.2708 },
  { name: "Singapore", lat: 1.3521, lng: 103.8198 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Toronto", lat: 43.6532, lng: -79.3832 },
];

export const RADIUS_OPTIONS_KM = [10, 25, 50, 100, 250, 500, 1000];

const R_EARTH_KM = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance between two points, in kilometres. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Best-effort coordinates for a free-text city, matched against featured cities. */
export function cityCoords(city: string | null | undefined): GeoPoint | null {
  if (!city) return null;
  const q = city.trim().toLowerCase();
  if (!q) return null;
  const hit =
    FEATURED_CITIES.find((c) => c.name.toLowerCase() === q) ??
    FEATURED_CITIES.find((c) => q.includes(c.name.toLowerCase()) || c.name.toLowerCase().includes(q));
  return hit ? { lat: hit.lat, lng: hit.lng } : null;
}

/** Is `point` within `radiusKm` of `center`? */
export function withinRadius(center: GeoPoint, point: GeoPoint | null, radiusKm: number): boolean {
  if (!point) return false;
  return haversineKm(center, point) <= radiusKm;
}
